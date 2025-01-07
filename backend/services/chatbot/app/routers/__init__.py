from fastapi import APIRouter
from routers import chatbot_router

router = APIRouter()

router.include_router(chatbot_router.router)
