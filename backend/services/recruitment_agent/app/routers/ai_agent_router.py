import logging
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from models.response_models import StandardResponse
from models.request_models import ChatRequest
from services.ai_agent_service import AIAgentService
from services.jwt_service import get_current_user
from config.log_config import AppLogger

router = APIRouter()
logger = AppLogger(__name__)

@router.post("/settings", response_model=StandardResponse)
async def settings(
    chat_request: ChatRequest,
    get_current_user: dict = get_current_user
):
    """Set chatbot settings."""
    try:
        username = get_current_user.get("sub")
        role = get_current_user.get("role")
        logger.debug(f"USER '{username}' [{role}] is calling /settings endpoint.")
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
