from config.log_config import AppLogger
from fastapi import APIRouter

router = APIRouter()

logger = AppLogger(__name__)

@router.get("/health")
def health_check():
    return {"status": "healthy"}
