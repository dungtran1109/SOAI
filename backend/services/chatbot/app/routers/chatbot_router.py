import logging
from fastapi import APIRouter
from models.response_models import ChatRequest, ChatResponse
from services.chatbot_service import ChatBotService

router = APIRouter()

logger = logging.getLogger(__file__)


@router.post("/completions/", response_model=ChatResponse)
async def completions(chat_request: ChatRequest):
    """Processes a chat message and returns a response."""
    return ChatResponse(response=ChatBotService.query(chat_request.message))
