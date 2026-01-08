import asyncio
from fastapi import APIRouter, WebSocket
from starlette.websockets import WebSocketDisconnect
from fastapi.responses import JSONResponse
from services.chat_service import ChatService
from models.websocket_models import (
    WebsocketMessage,
    WebsocketMessageType,
    WebsocketConnectMessage,
    WebsocketErrorMessage,
)
from config.log_config import AppLogger
from services.user_history_store import UserHistoryStore
from models.response_models import StandardResponse

router = APIRouter()
logger = AppLogger(__file__)

# WebSocket timeout settings
HANDSHAKE_TIMEOUT = 30  # seconds to wait for initial handshake
MESSAGE_TIMEOUT = 300   # seconds to wait for messages (5 minutes)
PING_INTERVAL = 30      # seconds between ping messages


@router.get("/conversations/{user_id}")
def get_conversations(user_id: str):
    """
    API endpoint to get list of conversations.
    """
    try:
        return JSONResponse(
            content=StandardResponse(
                status="success",
                message="",
                data={
                    "conversations": UserHistoryStore.list_conversations(
                        user_id=user_id
                    )
                },
            ).dict(),
            status_code=200,
        )
    except Exception as e:
        logger.exception(e)
    return JSONResponse(
        content=StandardResponse(
            status="error",
            message="Failed to get conversations.",
        ).dict(),
        status_code=500,
    )


@router.post("/conversations/{user_id}/create")
def create_conversation(user_id: str):
    """
    API endpoint to create a new conversation.
    """
    new_conversation_id = UserHistoryStore.create_new_conversation(user_id=user_id)
    return JSONResponse(
        content=StandardResponse(
            status="success",
            message="Conversation created successfully.",
            data={"conversation_id": new_conversation_id},
        ).dict(),
        status_code=200,
    )


@router.get("/conversations/{user_id}/{conversation_id}")
def get_conversation(user_id: str, conversation_id: str):
    """
    API endpoint to get a specific conversation by ID.
    """
    history = UserHistoryStore.get_conversation_history_by_id(user_id, conversation_id)
    return JSONResponse(
        content=StandardResponse(
            status="success",
            message="Conversation retrieved successfully.",
            data={"conversation_id": conversation_id, "history": history},
        ).dict(),
        status_code=200,
    )


@router.websocket("/conversations/realtime")
async def realtime_stream(ws: WebSocket):
    await ws.accept()
    ping_task = None
    try:
        # First message must be the handshake with JWT token (with timeout)
        try:
            connect_msg_json = await asyncio.wait_for(
                ws.receive_json(),
                timeout=HANDSHAKE_TIMEOUT
            )
        except asyncio.TimeoutError:
            logger.warning("WebSocket handshake timeout")
            await send_ws_message(ws, WebsocketErrorMessage("handshake timeout"))
            await ws.close(code=1008)
            return

        connect_msg = WebsocketMessage.from_json(connect_msg_json)
        logger.info(f"Received handshake message: {connect_msg}")
        if connect_msg.type != WebsocketMessageType.USER_CONNECT:
            await send_ws_message(
                ws,
                WebsocketErrorMessage(
                    "first message must be the handshake with JWT auth token"
                ),
            )
            return
        connect_msg = WebsocketConnectMessage.from_msg(connect_msg)

        chat_service = ChatService(
            user_id=connect_msg.user_id(),
            conversation_id=connect_msg.conversation_id(),
            auth_token=connect_msg.auth_token(),
        )

        # Start ping task to keep connection alive
        async def send_ping():
            while True:
                try:
                    await asyncio.sleep(PING_INTERVAL)
                    await ws.send_json({"type": "ping"})
                except Exception:
                    break

        ping_task = asyncio.create_task(send_ping())

        while True:
            try:
                frame = await asyncio.wait_for(
                    ws.receive_json(),
                    timeout=MESSAGE_TIMEOUT
                )
            except asyncio.TimeoutError:
                logger.info("WebSocket message timeout, closing connection")
                await ws.close(code=1000, reason="idle timeout")
                return

            msg = WebsocketMessage.from_json(frame)

            # Handle pong response (client acknowledgment)
            if msg.type == WebsocketMessageType.PONG if hasattr(WebsocketMessageType, 'PONG') else frame.get("type") == "pong":
                continue

            if msg.type == WebsocketMessageType.USER_INPUT_TEXT_COMMIT:
                # msg.data can be a raw string or a dict with "text"
                user_text = (
                    msg.data
                    if isinstance(msg.data, str)
                    else (msg.data or {}).get("text", "")
                )
                if not user_text:
                    await send_ws_message(ws, WebsocketErrorMessage("empty text"))
                    continue

                # Call ChatService
                logger.debug(f"User text: {user_text}")
                result = await chat_service.ask(
                    user_text
                )  # returns {"text": ai_response}
                ai_text = result.get("text", "")

                # Send AI text back (choose a type your frontend listens to)
                await send_ws_message(
                    ws,
                    WebsocketMessage(
                        WebsocketMessageType.AGENT_INTERACTION_SHOW_TEXT, ai_text
                    ),
                )
            else:
                # Ignore other types in text-only mode
                continue
    except WebSocketDisconnect as e:
        logger.info("WebSocket disconnected: code=%s, reason=%s", e.code, e.reason)
    except Exception as e:
        logger.error("Connection terminated with error: %s", e)
        try:
            await send_ws_message(ws, WebsocketErrorMessage(str(e)))
            await ws.close(code=1011)
        except Exception:
            # Connection already closed, ignore
            pass
    finally:
        # Cancel ping task if running
        if ping_task and not ping_task.done():
            ping_task.cancel()
            try:
                await ping_task
            except asyncio.CancelledError:
                pass


async def send_ws_message(ws: WebSocket, msg: WebsocketMessage):
    if not msg.data:
        await ws.send_json({"type": msg.type.value})
        return
    await ws.send_json({"type": msg.type.value, "data": msg.data})
