from fastapi import APIRouter
from routers import controller_router
from routers import health_router
router = APIRouter()

router.include_router(controller_router.router)
router.include_router(health_router.router)