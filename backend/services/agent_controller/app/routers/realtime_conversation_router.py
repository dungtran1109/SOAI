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
    try:
        # First message must be the handshake with JWT token
        connect_msg_json = await ws.receive_json()
        connect_msg = WebsocketMessage.from_json(connect_msg_json)
        logger.error(f"Received handshake message: {connect_msg}")
        if connect_msg.type != WebsocketMessageType.USER_CONNECT:
            await send_ws_message(
                ws,
                WebsocketErrorMessage(
                    "first message must be the handshake with JWT auth token"
                ),
            )
            return
        connect_msg = WebsocketConnectMessage.from_msg(connect_msg)
        # if not JWTService.verify_jwt_token(connect_msg.auth_token()):
        #     await send_ws_message(ws, WebsocketErrorMessage("invalid auth token"))
        #     return

        # TODO: fix this initialization with model name
        chat_service = ChatService(
            user_id=connect_msg.user_id(),
            conversation_id=connect_msg.conversation_id(),
        )
        while True:
            frame = await ws.receive_json()
            msg = WebsocketMessage.from_json(frame)

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
                print("User text:", user_text)
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


async def send_ws_message(ws: WebSocket, msg: WebsocketMessage):
    if not msg.data:
        await ws.send_json({"type": msg.type.value})
        return
    await ws.send_json({"type": msg.type.value, "data": msg.data})
