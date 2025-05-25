from config.log_config import AppLogger
from fastapi import APIRouter
from fastapi.responses import JSONResponse, StreamingResponse
from models.response_models import StandardResponse
from models.request_models import ChatRequest
from services.gen_ai_service import GenAIService

router = APIRouter()
logger = AppLogger(__name__)


@router.post("/chat")
def chat(chat_request: ChatRequest):
    """Processes a chat message and returns a response."""
    try:
        logger.debug(f"Chat request: {chat_request}")
        response = GenAIService.chat(
            messages=chat_request.messages,
            model=chat_request.model,
            temperature=chat_request.temperature,
        )
        logger.debug(f"Chat response: {response}")
        return JSONResponse(
            content=StandardResponse(
                status="success",
                data=response,
            ).dict(),
            status_code=200,
        )
    except Exception as e:
        logger.exception(e)
    return JSONResponse(
        content=StandardResponse(
            status="error",
            message="Error processing chat request",
        ).dict(),
        status_code=500,
    )


@router.get("/models", response_model=StandardResponse)
async def models():
    """Retrieve supported models."""
    try:
        models_data = GenAIService.get_available_models()
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
