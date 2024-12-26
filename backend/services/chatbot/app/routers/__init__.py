from fastapi import APIRouter
from routers import file_management_router
from routers import chat_router

router = APIRouter()

router.include_router(file_management_router.router)
router.include_router(chat_router.router)
