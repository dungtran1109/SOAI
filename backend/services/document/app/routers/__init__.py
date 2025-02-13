from fastapi import APIRouter
from routers import document_router
from routers import health_router
router = APIRouter()

router.include_router(document_router.router)
router.include_router(health_router.router)
