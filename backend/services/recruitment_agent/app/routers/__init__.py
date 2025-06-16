from fastapi import APIRouter
from routers import recruitment_agent_router
from routers import health_router
router = APIRouter()

router.include_router(recruitment_agent_router.router)
router.include_router(health_router.router)