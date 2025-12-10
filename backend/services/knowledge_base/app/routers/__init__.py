from fastapi import APIRouter
from routers import knowledge_base_router
from routers import health_router
router = APIRouter()

router.include_router(knowledge_base_router.router)
router.include_router(health_router.router)
