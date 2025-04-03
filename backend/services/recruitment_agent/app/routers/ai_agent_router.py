import logging
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from models.response_models import StandardResponse
from models.request_models import ChatRequest
from services.ai_agent_service import AIAgentService

router = APIRouter()

logger = logging.getLogger(__file__)


@router.post("/settings", response_model=StandardResponse)
async def settings(chat_request: ChatRequest):
    """Set chatbot settings."""
    try:
        AIAgentService.query(
            model=chat_request.model,
            temperature=chat_request.temperature,
            collection_name=chat_request.collection_name,
        )
        return JSONResponse(
            content=StandardResponse(
                status="success",
                message="Settings updated successfully.",
            ).dict(),
            status_code=200,
        )
    except Exception as e:
        logger.exception(e)
    return JSONResponse(
        content=StandardResponse(
            status="error",
            message="Failed to update settings.",
            error=str(e),
        ).dict(),
        status_code=500,
    )
