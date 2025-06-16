from fastapi import APIRouter, UploadFile, File, Form, Depends, Body, Query
from typing import Optional, Dict
from sqlalchemy.orm import Session
from config.database import DatabaseSession
from services.service import RecruitmentService
from schemas.interview_schema import (
    InterviewScheduleCreateSchema,
    InterviewAcceptSchema,
)
import json
from schemas.cv_schema import CVUploadResponseSchema
from services.jwt_service import JWTService
from config.log_config import AppLogger

logger = AppLogger(__name__)
router = APIRouter()

recruitment_service = RecruitmentService()


def get_db():
    db = DatabaseSession()
    try:
        yield db
    finally:
        db.close()


@router.post("/cvs/upload", response_model=CVUploadResponseSchema)
async def upload_cv(
    file: UploadFile = File(...),
    override_email: Optional[str] = Form(None),
    position_applied_for: str = Form(...),
    db: Session = Depends(get_db),
    get_current_user: dict = Depends(JWTService.verify_jwt),
):
    username = get_current_user.get("sub")
    role = get_current_user.get("role")
    logger.debug(f"USER '{username}' [{role}] is calling /cv/upload endpoint.")
    return recruitment_service.upload_and_process_cv(
        file,
        db,
        override_email=override_email,
        position_applied_for=position_applied_for,
    )


@router.post("/jds/upload", response_model=CVUploadResponseSchema)
async def upload_jd(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN"),
):
    username = get_current_user.get("sub")
    role = get_current_user.get("role")
    logger.debug(f"USER '{username}' [{role}] is calling /jd/upload endpoint.")
    content = await file.read()
    jd_list = json.loads(content)
    return recruitment_service.upload_jd(jd_list, db)


# Only administrator can schedule interview
@router.post("/interviews/schedule")
async def schedule_interview(
    interview_data: InterviewScheduleCreateSchema,
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN"),
):
    username = get_current_user.get("sub")
    role = get_current_user.get("role")
    logger.debug(
        f"USER '{username}' [{role}] is calling POST /interviews/schedule endpoint."
    )
    return recruitment_service.schedule_interview(interview_data, db)


# Only administrator can get interview list
@router.get("/interviews")
async def get_interviews(
    interview_date: Optional[str] = Query(
        None, description="Optional interview date filter in format YYYY-MM-DD"
    ),
    candidate_name: Optional[str] = Query(
        None, description="Optional candidate name filter"
    ),
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN"),
):
    try:
        username = get_current_user.get("sub")
        role = get_current_user.get("role")
        logger.debug(f"USER '{username}' [{role}] is calling GET /interviews endpoint.")
        return recruitment_service.get_all_interviews(
            db, interview_date=interview_date, candidate_name=candidate_name
        )
    except ValueError as e:
        return {"error": str(e)}


# Candidate can get job descriptions list -> But it need to verify JWT
@router.get("/jds")
async def get_jds(
    position: Optional[str] = Query(None, description="Optional position filter"),
    db: Session = Depends(get_db),
    get_current_user: dict = Depends(JWTService.verify_jwt),
):
    username = get_current_user.get("sub")
    role = get_current_user.get("role")
    logger.debug(f"USER '{username}' [{role}] is calling GET /jds endpoint.")
    return recruitment_service.get_all_jds(db, position=position)


# Candidate will accept interview
@router.post("/interviews/accept", response_model=CVUploadResponseSchema)
async def accept_interview(
    interview_accept_data: InterviewAcceptSchema,
    db: Session = Depends(get_db),
    get_current_user: dict = Depends(JWTService.verify_jwt),
):
    username = get_current_user.get("sub")
    role = get_current_user.get("role")
    logger.debug(
        f"USER '{username}' [{role}] is calling POST /interviews/accept endpoint."
    )
    return recruitment_service.accept_interview(interview_accept_data, db)


# Only administrator can approve cv
@router.post("/cvs/{candidate_id}/approve", response_model=CVUploadResponseSchema)
async def approve_cv(
    candidate_id: int,
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN"),
):
    username = get_current_user.get("sub")
    role = get_current_user.get("role")
    logger.debug(f"USER '{username}' [{role}] is calling /cvs/approve endpoint.")

    try:
        return recruitment_service.approve_cv(candidate_id, db)
    except ValueError as e:
        return CVUploadResponseSchema(message="Value error.")
    except Exception as e:
        logger.error(f"Error approving CV: {e}")
        return CVUploadResponseSchema(message="Internal server error.")


# Only administrator can get pending list CVs
@router.get("/cvs/pending")
async def get_pending_cv_list(
    candidate_name: Optional[str] = Query(
        None, description="Optional candidate name filter"
    ),
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN"),
):
    username = get_current_user.get("sub")
    role = get_current_user.get("role")
    logger.debug(f"USER '{username}' [{role}] is calling GET /cvs/pending endpoint.")
    return recruitment_service.get_pending_cvs(db, candidate_name=candidate_name)


@router.put("/cvs/{cv_id}", response_model=CVUploadResponseSchema)
async def update_cv(
    cv_id: int,
    update_data: Dict = Body(...),
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN"),
):
    logger.debug(
        f"USER '{get_current_user.get('sub')}' is calling PUT /cv/update/{cv_id}"
    )
    return recruitment_service.update_cv_application(cv_id, update_data, db)


@router.delete("/cvs/{cv_id}", response_model=CVUploadResponseSchema)
async def delete_cv(
    cv_id: int,
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN"),
):
    logger.debug(f"USER '{get_current_user.get('sub')}' is calling DELETE /cvs/{cv_id}")
    return recruitment_service.delete_cv_application(cv_id, db)


@router.get("/cvs/position")
async def list_all_cvs(
    position: Optional[str] = Query(
        default=None, description="Optional position filter"
    ),
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN"),
):
    logger.debug(
        f"USER '{get_current_user.get('sub')}' is calling GET /cvs/position with position={position}"
    )
    return recruitment_service.list_all_cv_applications(db, position)


@router.get("/cvs/{cv_id}")
async def get_cv_by_id(
    cv_id: int,
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN"),
):
    logger.debug(f"USER '{get_current_user.get('sub')}' is calling GET /cv/{cv_id}")
    try:
        return recruitment_service.get_cv_application_by_id(cv_id, db)
    except ValueError as e:
        return {"error": str(e)}


# === Interview update/cancel ===


@router.put("/interviews/{interview_id}", response_model=CVUploadResponseSchema)
async def update_interview(
    interview_id: int,
    update_data: Dict = Body(...),
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN"),
):
    logger.debug(
        f"USER '{get_current_user.get('sub')}' is calling PUT /interviews/{interview_id}"
    )
    return recruitment_service.update_interview(interview_id, update_data, db)


@router.post("/interviews/{interview_id}/cancel", response_model=CVUploadResponseSchema)
async def cancel_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN"),
):
    logger.debug(
        f"USER '{get_current_user.get('sub')}' is calling POST /interviews/{interview_id}/cancel"
    )
    return recruitment_service.cancel_interview(interview_id, db)


# === JD edit/delete ===


@router.put("/jds/{jd_id}", response_model=CVUploadResponseSchema)
async def edit_jd(
    jd_id: int,
    update_data: Dict = Body(...),
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN"),
):
    logger.debug(f"USER '{get_current_user.get('sub')}' is calling PUT /jds/{jd_id}")
    return recruitment_service.edit_jd(jd_id, update_data, db)


@router.delete("/jds/{jd_id}", response_model=CVUploadResponseSchema)
async def delete_jd(
    jd_id: int,
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN"),
):
    logger.debug(f"USER '{get_current_user.get('sub')}' is calling DELETE /jds/{jd_id}")
    return recruitment_service.delete_jd(jd_id, db)
