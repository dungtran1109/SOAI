from config.logging import AppLogger
from fastapi import APIRouter
from fastapi.responses import JSONResponse, StreamingResponse
from models.response_models import StandardResponse
from models.request_models import ChatRequest
from services.chatbot_service import ChatBotService
from services.jwt_service import get_current_user

router = APIRouter()
logger = AppLogger(__name__)

@router.post("/completions")
async def completions_stream(
    chat_request: ChatRequest,
    get_current_user: dict = get_current_user
):
    """Processes a chat message and returns a response."""

    username = get_current_user.get("sub")
    role = get_current_user.get("role")
    logger.debug(f"USER '{username}' [{role}] is calling /completions endpoint to process a chat message and return a response.")

    async def stream_generator():
        async for chunk in ChatBotService.query(
            messages=chat_request.messages,
            model=chat_request.model,
            temperature=chat_request.temperature,
            collection_name=chat_request.collection_name,
        ):
            yield chunk

    return StreamingResponse(stream_generator(), media_type="text/plain")


@router.get("/models", response_model=StandardResponse)
async def models(get_current_user: dict = get_current_user):
    """Retrieve supported models."""

    username = get_current_user.get("sub")
    role = get_current_user.get("role")
    logger.debug(f"USER '{username}' [{role}] is calling /models endpoint to get all supported models.")

    try:
        models_data = ChatBotService.list_models()
        return JSONResponse(
            content=StandardResponse(
                status="success",
                data=models_data,
            ).dict(),
            status_code=200,
        )
    except Exception as e:
        logger.exception(e)
    return JSONResponse(
        content=StandardResponse(
            status="error",
            message="Failed to retrieve models.",
            error=str(e),
        ).dict(),
        status_code=500,
    )
