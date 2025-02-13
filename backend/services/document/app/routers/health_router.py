import logging
from fastapi import APIRouter

router = APIRouter()

logger = logging.getLogger(__file__)


@router.get("/health")
def health_check():
    return {"status": "healthy"}
