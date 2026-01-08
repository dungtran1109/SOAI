from fastapi import APIRouter, UploadFile, File, Form, Depends, Body, Query, HTTPException
from typing import Optional, Dict, List
from sqlalchemy.orm import Session
from config.database import DatabaseSession
from services.service import RecruitmentService
from schemas.interview_schema import (
    InterviewScheduleCreateSchema,
    InterviewAcceptSchema,
)
import json
from schemas.jd_schema import JobDescriptionUploadSchema
from schemas.cv_schema import CVUploadResponseSchema, CVApplicationResponse
from services.jwt_service import JWTService
from config.log_config import AppLogger
from schemas.interview_question_schema import InterviewQuestionSchema
from celery_tasks.pipeline import *
from services.genai import GenAI
from utils.utils import extract_text_from_pdf, ensure_text, clean_json_from_text
from config.constants import UPLOAD_DIR
import os, subprocess, json

logger = AppLogger(__name__)
router = APIRouter()

recruitment_service = RecruitmentService()


def get_db():
    db = DatabaseSession()
    try:
        yield db
    finally:
        db.close()


# Upload CVs without authentication
@router.post("/cvs/upload", response_model=CVUploadResponseSchema)
async def upload_cv(
    file: UploadFile = File(...),
    override_email: Optional[str] = Form(None),
    position_applied_for: str = Form(...),
    get_current_user: dict = Depends(JWTService.verify_jwt),
):
    username = get_current_user.get("sub")
    role = get_current_user.get("role")
    logger.debug(f"USER '{username}' [{role}] is calling /cvs/upload endpoint.")
    return recruitment_service.upload_and_process_cv(
        file,
        override_email=override_email,
        position_applied_for=position_applied_for,
        username=username,
    )


@router.get("/cvs/{cv_id}/preview")
async def preview_cv_file(cv_id: int, db: Session = Depends(get_db)):
    logger.debug(f"Fetching CV preview for CV ID: {cv_id}")
    return recruitment_service.preview_cv_file(cv_id, db)


# === JD edit/delete ===
# Only administrator can get the Job Description preview
@router.get("/jds/{jd_id}/preview")
async def preview_jd_file(jd_id: int, db: Session = Depends(get_db)):
    return recruitment_service.preview_jd_file(jd_id, db)


# Only administrator can upload the Job Descriptions
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


@router.post("/jds", response_model=CVUploadResponseSchema)
async def create_jd(
    jd_data: JobDescriptionUploadSchema,
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN"),
):
    """
    Create a new Job Description from JSON body (not file upload).
    """
    username = get_current_user.get("sub")
    role = get_current_user.get("role")
    logger.debug(f"USER '{username}' [{role}] is calling POST /jds endpoint.")

    try:
        # Reuse upload_jd service, but wrap jd_data in a list
        result = recruitment_service.upload_jd([jd_data.dict()], db)
        return result
    except Exception as e:
        logger.error(f"Error creating JD: {e}")
        return CVUploadResponseSchema(message=f"Failed to create JD: {str(e)}")


# Candidate can get job descriptions list without authentication
@router.get("/jds")
async def get_jds(
    position: Optional[str] = Query(None, description="Optional position filter"),
    db: Session = Depends(get_db),
):
    logger.debug(f"Fetching job descriptions with position filter: {position}")
    return recruitment_service.get_all_jds(db, position=position)


# Only administrator can edit the Job Description
@router.put("/jds/{jd_id}", response_model=CVUploadResponseSchema)
async def edit_jd(
    jd_id: int,
    update_data: Dict = Body(...),
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN"),
):
    logger.debug(f"USER '{get_current_user.get('sub')}' is calling PUT /jds/{jd_id}")
    return recruitment_service.edit_jd(jd_id, update_data, db)


# Only Administrator can delete specific JD
@router.delete("/jds/{jd_id}", response_model=CVUploadResponseSchema)
async def delete_jd(
    jd_id: int,
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN"),
):
    logger.debug(f"USER '{get_current_user.get('sub')}' is calling DELETE /jds/{jd_id}")
    return recruitment_service.delete_jd(jd_id, db)


# Only Administrator can delete all JDs
@router.delete("/jds", response_model=CVUploadResponseSchema)
async def delete_all_jds(
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN"),
):
    logger.debug(f"USER '{get_current_user.get('sub')}' is calling DELETE /jds")
    return recruitment_service.delete_all_jds(db)


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


# Only administrator can delete interview
@router.delete("/interviews/{interview_id}", response_model=CVUploadResponseSchema)
async def delete_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN"),
):
    logger.debug(
        f"USER '{get_current_user.get('sub')}' is calling DELETE /interviews/{interview_id}"
    )
    return recruitment_service.delete_interview(interview_id, db)


# Only administrator can delete all interviews
@router.delete("/interviews", response_model=CVUploadResponseSchema)
async def delete_all_interviews(
    candidate_name: Optional[str] = Query(
        None, description="Optional candidate name filter"
    ),
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN"),
):
    logger.debug(
        f"USER '{get_current_user.get('sub')}' is calling DELETE /interviews with filter candidate_name={candidate_name}"
    )
    return recruitment_service.delete_all_interviews(db, candidate_name=candidate_name)


# Candidate will accept interview scheduler
@router.post("/interviews/accept", response_model=CVUploadResponseSchema)
async def accept_interview(
    interview_accept_data: InterviewAcceptSchema,
    get_current_user: dict = Depends(JWTService.verify_jwt),
):
    username = get_current_user.get("sub")
    role = get_current_user.get("role")
    logger.debug(
        f"USER '{username}' [{role}] is calling POST /interviews/accept endpoint."
    )
    accept_interview_task.delay(interview_accept_data.dict())
    return CVUploadResponseSchema(message="Interview acceptance is being processed.")


# Only administrator can update the interview scheduler
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


# Candidate can cancel the interview scheduler
@router.post("/interviews/{interview_id}/cancel", response_model=CVUploadResponseSchema)
async def cancel_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    get_current_user: dict = Depends(JWTService.verify_jwt),
):
    logger.debug(
        f"USER '{get_current_user.get('sub')}' is calling POST /interviews/{interview_id}/cancel"
    )
    return recruitment_service.cancel_interview(interview_id, db)


# === Interview question ===


# Only TA can get a list of questions
@router.get(
    "/interview-questions/{cv_id}/questions",
    response_model=List[InterviewQuestionSchema],
)
async def get_questions_for_cv(
    cv_id: int,
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN"),
):
    logger.debug(
        f"USER '{get_current_user.get('sub')}' is calling GET /interview-questions/{cv_id}/questions"
    )
    return recruitment_service.get_interview_questions(cv_id, db)


# Only TA can edit the questions
@router.put("/interview-questions/{question_id}/edit")
async def edit_question(
    question_id: int,
    new_question: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN"),
):
    logger.debug(
        f"USER '{get_current_user.get('sub')}' is calling PUT /interview-questions/{question_id}/edit"
    )
    return recruitment_service.edit_interview_question(
        question_id, new_question, db, edited_by=get_current_user["sub"]
    )


# Only TA can regenerate the interview questions
@router.post(
    "/interview-questions/{cv_id}/questions/regenerate",
    response_model=List[InterviewQuestionSchema],
)
async def regenerate_questions(
    cv_id: int,
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN"),
):
    logger.debug(
        f"USER '{get_current_user.get('sub')}' is calling POST /interview-questions/{cv_id}/questions/regenerate"
    )
    return recruitment_service.regenerate_interview_questions(cv_id, db)


# ==== CV Applications ====
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
        approve_cv_task.delay(candidate_id)
        return CVUploadResponseSchema(message="CV Approval is being processed")
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


# Only administrator can get approved list CVs
@router.get("/cvs/approved")
async def get_approved_cv_list(
    candidate_name: Optional[str] = Query(
        None, description="Optional candidate name filter"
    ),
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN"),
):
    username = get_current_user.get("sub")
    role = get_current_user.get("role")
    logger.debug(f"USER '{username}' [{role}] is calling GET /cvs/approved endpoint.")
    return recruitment_service.get_approved_cvs(db, candidate_name=candidate_name)


# Only administrator can update the CV
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


# Only administrator can delete the CV
@router.delete("/cvs/{cv_id}", response_model=CVUploadResponseSchema)
async def delete_cv(
    cv_id: int,
    db: Session = Depends(get_db),
    get_current_user: dict = JWTService.require_role("ADMIN"),
):
    logger.debug(f"USER '{get_current_user.get('sub')}' is calling DELETE /cvs/{cv_id}")
    return recruitment_service.delete_cv_application(cv_id, db)


# Only administrator can get all CVs filtered with position
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


# User can get own CV applied
@router.get("/cvs/me", response_model=List[CVApplicationResponse])
async def get_cv_by_username(
    db: Session = Depends(get_db),
    get_current_user: dict = Depends(JWTService.verify_jwt),
):
    username = get_current_user.get("sub")
    role = get_current_user.get("role")
    logger.debug(f"USER '{username}' with role {role} is calling GET /cvs/me")
    return recruitment_service.get_cv_application_by_username(username=username, db=db)


# Only administrator can get specific CV
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


# Candidate can get the proof images
@router.get("/cvs/{cv_id}/proofs", response_model=List[str])
async def list_proof_images(
    cv_id: int, get_current_user: dict = Depends(JWTService.verify_jwt)
):
    """
    Returns a list of URLs for the proof images uploaded for the application.
    """
    logger.debug(
        f"USER '{get_current_user.get('sub')}' is calling GET /cvs/{cv_id}/proofs"
    )
    return recruitment_service.list_proof_images(cv_id=cv_id)


# Candidate can upload the proof images
@router.post("/cvs/{cv_id}/proofs/upload", response_model=CVUploadResponseSchema)
async def upload_proof_images(
    cv_id: int,
    files: List[UploadFile] = File(...),
    get_current_user: dict = Depends(JWTService.verify_jwt),
):
    """
    Upload proof images (certificates, transcripts...) for the application.
    """
    logger.debug(
        f"USER '{get_current_user.get('sub')}' is calling POST /cvs/{cv_id}/proofs/upload"
    )
    return recruitment_service.upload_proof_images(cv_id=cv_id, files=files)


# === Scorecard Auto-Fill (single multipart upload) ===
@router.post("/scorecards/auto-fill")
async def auto_fill_scorecard(
    jdFile: UploadFile = File(...),
    templateFile: UploadFile = File(...),
    transcriptFile: Optional[UploadFile] = File(None),
    gradePayload: Optional[str] = Form(None),
    mode: Optional[str] = Form("genai"),
    model: Optional[str] = Form(None),
    get_current_user: dict = JWTService.require_role("USER"),
):
    async def _save(path_dir: str, up: UploadFile) -> str:
        os.makedirs(path_dir, exist_ok=True)
        path = os.path.join(path_dir, up.filename)
        content = await up.read()
        with open(path, "wb") as f:
            f.write(content)
        return path

    async def _parse_txt(path: str) -> str:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return ensure_text(f.read())

    async def _convert_docx_to_pdf(path: str) -> str:
        outdir = os.path.dirname(path)
        subprocess.run([
            "libreoffice", "--headless", "--convert-to", "pdf", "--outdir", outdir, path
        ], check=True)
        pdf_path = os.path.splitext(path)[0] + ".pdf"
        if not os.path.exists(pdf_path):
            raise RuntimeError("DOCX to PDF conversion failed")
        return pdf_path

    async def _parse_file(up: UploadFile) -> str:
        saved = await _save(os.path.join(UPLOAD_DIR, "autofill"), up)
        ext = os.path.splitext(saved)[1].lower()
        if ext == ".txt":
            return await _parse_txt(saved)
        if ext == ".pdf":
            return ensure_text(extract_text_from_pdf(saved))
        if ext == ".docx":
            pdf_path = await _convert_docx_to_pdf(saved)
            return ensure_text(extract_text_from_pdf(pdf_path))
        if ext == ".vtt":
            # Minimal VTT parsing: strip indices and timestamps
            lines = []
            with open(saved, "r", encoding="utf-8", errors="ignore") as f:
                for line in f:
                    s = line.strip()
                    if "-->" in s or s.isdigit():
                        continue
                    if s:
                        lines.append(s)
            return "\n".join(lines)
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

    # Parse inputs
    jd_text = await _parse_file(jdFile)
    tpl_text = await _parse_file(templateFile)
    tr_text = ""
    if transcriptFile is not None:
        tr_text = await _parse_file(transcriptFile)

    # Build a minimal schema from template lines
    fields = [
        {"label": line[:64], "type": "string"}
        for line in tpl_text.splitlines() if line.strip()
    ]
    schema = {"sections": [{"name": templateFile.filename, "fields": fields}]}

    # Optional grade payload
    grade = {}
    try:
        if gradePayload:
            grade = json.loads(gradePayload)
    except Exception:
        grade = {}

    # GenAI path
    if (mode or "genai") == "genai":
        try:
            system_prompt = (
                "You are an extractor. Output strict JSON with keys: grades (object), confidence (object of floats 0..1), notes (string). "
                "Use the provided schema to map fields."
            )
            user_payload = json.dumps({
                "schema": schema,
                "job_description": jd_text,
                "interview_transcript": tr_text,
                "provided_grades": grade,
            })
            ga = GenAI(model=model or None)
            resp = ga.invoke(message=f"{system_prompt}\n{user_payload}")
            content = resp.json().get("message") if hasattr(resp, "json") else resp.text
            cleaned = clean_json_from_text(ensure_text(content))
            obj = json.loads(cleaned)
            proposed = obj.get("grades") or {}
            confidence = obj.get("confidence") or {}
            notes = obj.get("notes") or ""
            return {
                "proposed_grades": proposed,
                "confidence": confidence,
                "notes": notes,
            }
        except Exception as e:
            logger.error(f"GenAI auto-fill failed, falling back: {e}")

    # Deterministic fallback: naive keyword frequency mapping
    base_text = f"{jd_text}\n{tr_text}".lower()
    proposed = {}
    for f in fields:
        key = ensure_text(f.get("label", "")).lower()
        if not key:
            continue
        score = float(base_text.count(key))
        proposed[key] = min(1.0, score / 5.0)
    return {
        "proposed_grades": proposed,
        "confidence": {k: 0.5 for k in proposed.keys()},
        "notes": "Deterministic fallback applied",
    }
