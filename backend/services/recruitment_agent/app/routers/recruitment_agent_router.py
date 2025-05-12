from fastapi import APIRouter, UploadFile, File, Form, Depends, Body, Query
from typing import Optional, Dict
from sqlalchemy.orm import Session
from config.database import DatabaseSession
from services.service import RecruitmentService
from schemas.interview_schema import InterviewScheduleCreateSchema, InterviewAcceptSchema
import json
from schemas.cv_schema import CVUploadResponseSchema
from services.jwt_service import JWTService
from config.logging import AppLogger
logger = AppLogger(__name__)
router = APIRouter()

recruitment_service = RecruitmentService()

def get_db():
    db = DatabaseSession()
    try:
        yield db
    finally:
        db.close()

@router.post("/upload-cv", response_model=CVUploadResponseSchema)
async def upload_cv(
    file: UploadFile = File(...),
    override_email: Optional[str] = Form(None),
    position_applied_for: str = Form(...),
    db: Session = Depends(get_db),
    get_current_user: dict = Depends(JWTService.verify_jwt)
):
    username = get_current_user.get("sub")
    role = get_current_user.get("role")
    logger.debug(f"USER '{username}' [{role}] is calling /upload-cv endpoint.")
    return recruitment_service.upload_and_process_cv(file, db, override_email=override_email, position_applied_for=position_applied_for)

@router.post("/upload-jd", response_model=CVUploadResponseSchema)
async def upload_jd(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN")
):
    username = get_current_user.get("sub")
    role = get_current_user.get("role")
    logger.debug(f"USER '{username}' [{role}] is calling /upload-jd endpoint.")
    content = await file.read()
    jd_list = json.loads(content)
    return recruitment_service.upload_jd(jd_list, db)

# Only administrator can schedule interview
@router.post("/schedule-interview")
async def schedule_interview(
    interview_data: InterviewScheduleCreateSchema,
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN")
):
    username = get_current_user.get("sub")
    role = get_current_user.get("role")
    logger.debug(f"USER '{username}' [{role}] is calling /schedule-interview endpoint.")
    return recruitment_service.schedule_interview(interview_data, db)

# Only administrator can get interview list
@router.get("/interview-list")
async def get_interviews(
    interview_date: Optional[str] = Query(None, description="Optional interview date filter in format YYYY-MM-DD"),
    candidate_name: Optional[str] = Query(None, description="Optional candidate name filter"),
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN")
):
    try:
        username = get_current_user.get("sub")
        role = get_current_user.get("role")
        logger.debug(f"USER '{username}' [{role}] is calling /interview-list endpoint.")
        return recruitment_service.get_all_interviews(db, interview_date=interview_date, candidate_name=candidate_name)
    except ValueError as e:
        return {"error": str(e)}

# Only administrator can get JD list
@router.get("/jd-list")
async def get_jds(
    position: Optional[str] = Query(None, description="Optional position filter"),
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN")
):
    username = get_current_user.get("sub")
    role = get_current_user.get("role")
    logger.debug(f"USER '{username}' [{role}] is calling /jd-list endpoint.")
    return recruitment_service.get_all_jds(db, position=position)

# Candidate will accept interview
@router.put("/accept-interview", response_model=CVUploadResponseSchema)
async def accept_interview(
    interview_accept_data: InterviewAcceptSchema,
    db: Session = Depends(get_db),
    get_current_user: dict = Depends(JWTService.verify_jwt)
):
    username = get_current_user.get("sub")
    role = get_current_user.get("role")
    logger.debug(f"USER '{username}' [{role}] is calling /accept-interview endpoint.")
    return recruitment_service.accept_interview(interview_accept_data, db)

# Only administrator can approve cv
@router.post("/approve-cv", response_model=CVUploadResponseSchema)
async def dev_approve_cv(
    candidate_id: int = Form(...),
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN")
):
    username = get_current_user.get("sub")
    role = get_current_user.get("role")
    logger.debug(f"USER '{username}' [{role}] is calling /approve-cv endpoint.")

    try:
        return recruitment_service.dev_approve_cv(candidate_id, db)
    except ValueError as e:
        return CVUploadResponseSchema(message="Value error.")
    except Exception as e:
        logger.error(f"Error approving CV: {e}")
        return CVUploadResponseSchema(message="Internal server error.")
    
# Only administrator can get pending list CVs
@router.get("/pending-cv-list")
async def get_pending_cv_list(
    candidate_name: Optional[str] = Query(None, description="Optional candidate name filter"),
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN")
):
    username = get_current_user.get("sub")
    role = get_current_user.get("role")
    logger.debug(f"USER '{username}' [{role}] is calling /pending-cv-list endpoint.")
    return recruitment_service.get_pending_cvs(db, candidate_name=candidate_name)

@router.put("/cv/update/{cv_id}", response_model=CVUploadResponseSchema)
async def update_cv(
    cv_id: int,
    update_data: Dict = Body(...),
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN")
):
    logger.debug(f"USER '{get_current_user.get('sub')}' is calling /cv/update/{cv_id}")
    return recruitment_service.update_cv_application(cv_id, update_data, db)

@router.delete("/cv/delete/{cv_id}", response_model=CVUploadResponseSchema)
async def delete_cv(
    cv_id: int,
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN")
):
    logger.debug(f"USER '{get_current_user.get('sub')}' is calling /cv/delete/{cv_id}")
    return recruitment_service.delete_cv_application(cv_id, db)

@router.get("/cv/list")
async def list_all_cvs(
    position: Optional[str] = Query(default=None, description="Optional position filter"),
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN")
):
    logger.debug(f"USER '{get_current_user.get('sub')}' is calling /cv/list with position={position}")
    return recruitment_service.list_all_cv_applications(db, position)

@router.get("/cv/{cv_id}")
async def get_cv_by_id(
    cv_id: int,
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN")
):
    logger.debug(f"USER '{get_current_user.get('sub')}' is calling /cv/{cv_id}")
    try:
        return recruitment_service.get_cv_application_by_id(cv_id, db)
    except ValueError as e:
        return {"error": str(e)}

# === Interview update/cancel ===

@router.put("/interview/update/{interview_id}", response_model=CVUploadResponseSchema)
async def update_interview(
    interview_id: int,
    update_data: Dict = Body(...),
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN")
):
    logger.debug(f"USER '{get_current_user.get('sub')}' is calling /interview/update/{interview_id}")
    return recruitment_service.update_interview(interview_id, update_data, db)

@router.put("/interview/cancel/{interview_id}", response_model=CVUploadResponseSchema)
async def cancel_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN")
):
    logger.debug(f"USER '{get_current_user.get('sub')}' is calling /interview/cancel/{interview_id}")
    return recruitment_service.cancel_interview(interview_id, db)

# === JD edit/delete ===

@router.put("/jd/update/{jd_id}", response_model=CVUploadResponseSchema)
async def edit_jd(
    jd_id: int,
    update_data: Dict = Body(...),
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN")
):
    logger.debug(f"USER '{get_current_user.get('sub')}' is calling /jd/update/{jd_id}")
    return recruitment_service.edit_jd(jd_id, update_data, db)

@router.delete("/jd/delete/{jd_id}", response_model=CVUploadResponseSchema)
async def delete_jd(
    jd_id: int,
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN")
):
    logger.debug(f"USER '{get_current_user.get('sub')}' is calling /jd/delete/{jd_id}")
    return recruitment_service.delete_jd(jd_id, db)