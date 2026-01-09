from fastapi import APIRouter, status, Depends
from fastapi.responses import JSONResponse
from config.log_config import AppLogger
from services.controller import AgentController
from services.jwt_service import JWTService

logger = AppLogger(__name__)
router = APIRouter()

agent_controller = AgentController()


@router.post("/run/{start_task}")
async def run(
    start_task: str,
    data: dict = None,
    get_current_user: dict = Depends(JWTService.verify_jwt),
):
    result = await agent_controller.run(start_task, data, get_current_user.get("token"))
    if not result.get("success"):
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content=result)

    return JSONResponse(status_code=status.HTTP_200_OK, content=result)
