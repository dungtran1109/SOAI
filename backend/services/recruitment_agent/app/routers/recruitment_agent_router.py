from fastapi import APIRouter, UploadFile, File, Form, Depends
from typing import Optional
from sqlalchemy.orm import Session
from config.database import DatabaseSession
from services.service import RecruitmentService
from schemas.interview_schema import InterviewScheduleCreateSchema, InterviewAcceptSchema
import json
from schemas.cv_schema import CVUploadResponseSchema
from fastapi import Query
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

@router.post("/upload-jd")
async def upload_jd(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    get_current_user: dict = Depends(JWTService.verify_jwt)
):
    username = get_current_user.get("sub")
    role = get_current_user.get("role")
    logger.debug(f"USER '{username}' [{role}] is calling /upload-jd endpoint.")
    content = await file.read()
    jd_list = json.loads(content)
    return recruitment_service.upload_jd(jd_list, db)

@router.post("/schedule-interview")
async def schedule_interview(
    interview_data: InterviewScheduleCreateSchema,
    db: Session = Depends(get_db),
    get_current_user: dict = Depends(JWTService.verify_jwt)
):
    username = get_current_user.get("sub")
    role = get_current_user.get("role")
    logger.debug(f"USER '{username}' [{role}] is calling /schedule-interview endpoint.")
    return recruitment_service.schedule_interview(interview_data, db)

@router.get("/interview-list")
async def get_interviews(
    interview_date: Optional[str] = Query(None, description="Optional interview date filter in format YYYY-MM-DD"),
    candidate_name: Optional[str] = Query(None, description="Optional candidate name filter"),
    db: Session = Depends(get_db),
    get_current_user: dict = Depends(JWTService.verify_jwt)
):
    try:
        username = get_current_user.get("sub")
        role = get_current_user.get("role")
        logger.debug(f"USER '{username}' [{role}] is calling /interview-list endpoint.")
        return recruitment_service.get_all_interviews(db, interview_date=interview_date, candidate_name=candidate_name)
    except ValueError as e:
        return {"error": str(e)}

@router.get("/jd-list")
async def get_jds(
    position: Optional[str] = Query(None, description="Optional position filter"),
    db: Session = Depends(get_db),
    get_current_user: dict = Depends(JWTService.verify_jwt)
):
    username = get_current_user.get("sub")
    role = get_current_user.get("role")
    logger.debug(f"USER '{username}' [{role}] is calling /jd-list endpoint.")
    return recruitment_service.get_all_jds(db, position=position)

@router.put("/accept-interview")
async def accept_interview(
    interview_accept_data: InterviewAcceptSchema,
    db: Session = Depends(get_db),
    get_current_user: dict = Depends(JWTService.verify_jwt)
):
    username = get_current_user.get("sub")
    role = get_current_user.get("role")
    logger.debug(f"USER '{username}' [{role}] is calling /accept-interview endpoint.")
    return recruitment_service.accept_interview(interview_accept_data, db)

@router.post("/approve-cv", response_model=CVUploadResponseSchema)
async def dev_approve_cv(
    candidate_id: int = Form(...),
    db: Session = Depends(get_db),
    get_current_user: dict = Depends(JWTService.verify_jwt)
):
    username = get_current_user.get("sub")
    role = get_current_user.get("role")
    logger.debug(f"USER '{username}' [{role}] is calling /approve-cv endpoint.")

    # TODO: Only need DEV/QA/ADMIN approve
    # if role not in ("DEV", "QA", "ADMIN"):
    #     return {"error": "Permission denied. Only DEV/QA/Admin can approve CVs."}

    try:
        return recruitment_service.dev_approve_cv(candidate_id, db)
    except ValueError as e:
        return CVUploadResponseSchema(message="Value error.")
    except Exception as e:
        logger.error(f"Error approving CV: {e}")
        return CVUploadResponseSchema(message="Internal server error.")
    
@router.get("/pending-cv-list")
async def get_pending_cv_list(
    candidate_name: Optional[str] = Query(None, description="Optional candidate name filter"),
    db: Session = Depends(get_db),
    get_current_user: dict = Depends(JWTService.verify_jwt)
):
    username = get_current_user.get("sub")
    role = get_current_user.get("role")
    logger.debug(f"USER '{username}' [{role}] is calling /pending-cv-list endpoint.")
    return recruitment_service.get_pending_cvs(db, candidate_name=candidate_name)