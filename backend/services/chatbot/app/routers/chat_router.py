from fastapi import APIRouter
from models.response_models import ChatRequest, ChatResponse

router = APIRouter()


@router.post("/send/", response_model=ChatResponse)
async def send(chat_request: ChatRequest):
    """Processes a chat message and returns a response."""
    return ChatResponse(response=chat_request.message, references=[])
