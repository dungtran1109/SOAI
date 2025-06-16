from fastapi import APIRouter
from routers import gen_ai_router
from routers import health_router
router = APIRouter()

router.include_router(gen_ai_router.router)
router.include_router(health_router.router)
