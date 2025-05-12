import os
import shutil
import json
from sqlalchemy.orm import Session
from sqlalchemy import and_
from config.config import Settings
from utils.email_sender import EmailSender
from agents.state import RecruitmentState
from agents.graph import build_recruitment_graph_matching, build_recruitment_graph_approval
from models.job_description import JobDescription
from models.interview_schedule import InterviewSchedule
from models.cv_application import CVApplication
from schemas.jd_schema import JobDescriptionUploadSchema
from schemas.cv_schema import CVUploadResponseSchema
from datetime import datetime
from typing import Optional, List
from config.logging import AppLogger
from config.constants import *

logger = AppLogger(__name__)

class RecruitmentService:
    """
    Service class handling CV processing:
    - Uploading and parsing CVs
    - Matching candidates to JDs
    - Approving candidates
    - Scheduling interviews
    """

    def __init__(self):
        """Initialize RecruitmentService with email sender."""
        self.email_sender = EmailSender(
            Settings.SMTP_SERVER,
            Settings.SMTP_PORT,
            Settings.SMTP_USERNAME,
            Settings.SMTP_PASSWORD,
        )

    def upload_and_process_cv(self, file, db: Session, override_email: Optional[str] = None, position_applied_for: Optional[str] = None):
        """Upload a CV, parse it, match with JDs, and save as Pending CVApplication."""
        logger.info("Uploading and processing CV file.")

        cv_dir = "./cv_uploads"
        os.makedirs(cv_dir, exist_ok=True)
        cv_path = os.path.join(cv_dir, file.filename)
        with open(cv_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        pipeline = build_recruitment_graph_matching(db)
        state = RecruitmentState(cv_file_path=cv_path)

        if override_email:
            state.override_email = override_email
        if position_applied_for:
            state.position_applied_for = position_applied_for

        try:
            updated_state = pipeline.invoke(state.model_dump())
            final_state = RecruitmentState(**updated_state)
            logger.debug(f"[upload_and_process_cv] final_state: {final_state}")
            logger.info("CV parsing and JD matching completed.")
        except Exception as e:
            logger.error(f"Error during CV processing: {e}")
            raise RuntimeError(f"Error during CV processing: {str(e)}")

        if not final_state.matched_jd:
            logger.error("No matching JD found for this CV.")
            return CVUploadResponseSchema(message="No suitable JD match found for this CV.")

        email_to_check = final_state.override_email or final_state.parsed_cv.get("email")

        # Check duplicate
        existing_cv = db.query(CVApplication).filter(
            CVApplication.candidate_name == final_state.parsed_cv.get("name"),
            CVApplication.email == email_to_check,
            CVApplication.matched_position == final_state.matched_jd.get("position"),
            CVApplication.status.in_([FinalDecisionStatus.PENDING.value, FinalDecisionStatus.ACCEPTED.value])
        ).first()

        if existing_cv:
            logger.info("Duplicate CV detected. Skipping new insertion.")
            return CVUploadResponseSchema(message="CV already uploaded and matched successfully. Pending approval.")

        # Validate experience
        candidate_experience = final_state.parsed_cv.get("experience_years", 0)
        jd_experience_required = final_state.matched_jd.get("experience_required", 0)

        if abs(candidate_experience - jd_experience_required) > 1:
            logger.error(f"Candidate experience {candidate_experience}yrs does not match JD experience {jd_experience_required}yrs (bias > 1). Rejecting CV.")
            final_state.stop_pipeline = True
            final_state.final_decision = f"{FinalDecisionStatus.REJECTED.value}: Candidate experience does not match JD requirement."
            return CVUploadResponseSchema(message=f"{FinalDecisionStatus.REJECTED.value}: Candidate experience does not match JD requirements.")

        # Save new CVApplication
        cv_application = CVApplication(
            candidate_name=final_state.parsed_cv.get("name"),
            email=email_to_check,
            matched_position=final_state.matched_jd.get("position"),
            status=FinalDecisionStatus.PENDING.value,
            skills=json.dumps(final_state.parsed_cv.get("skills", [])),
            matched_jd_skills=json.dumps(final_state.matched_jd.get("skills_required", [])),
            matched_jd_experience_required=jd_experience_required,
            experience_years=candidate_experience,
            is_matched=True if final_state.matched_jd else False,
            parsed_cv=json.dumps(final_state.parsed_cv)
        )
        db.add(cv_application)
        db.commit()
        logger.info(f"New CVApplication created for candidate: {final_state.parsed_cv.get('name')}")

        return CVUploadResponseSchema(message="CV uploaded and matched successfully. Pending approval.")

    def dev_approve_cv(self, candidate_id: int, db: Session):
        """Approve a pending CV based on skills and experience."""
        logger.info(f"Starting approval for candidate_id={candidate_id}.")

        cv_application = db.query(CVApplication).filter_by(id=candidate_id, status=FinalDecisionStatus.PENDING.value).first()
        if not cv_application:
            logger.error("Pending CV not found or already approved/rejected.")
            raise ValueError("Pending CV not found or already processed.")

        pipeline = build_recruitment_graph_approval(db, self.email_sender)

        try:
            parsed_cv = json.loads(cv_application.parsed_cv) if isinstance(cv_application.parsed_cv, str) else cv_application.parsed_cv or {}
            matched_jd_skills = json.loads(cv_application.matched_jd_skills) if isinstance(cv_application.matched_jd_skills, str) else cv_application.matched_jd_skills or []
        except Exception as e:
            logger.error(f"Error loading CV or JD skills JSON: {e}")
            raise RuntimeError(f"Error loading data from database: {str(e)}")

        state = RecruitmentState(
            parsed_cv=parsed_cv,
            matched_jd={
                "position": cv_application.matched_position,
                "skills_required": matched_jd_skills,
                "experience_required": cv_application.matched_jd_experience_required
            },
            override_email=cv_application.email,
        )

        try:
            updated_state = pipeline.invoke(state.model_dump())
            final_state = RecruitmentState(**updated_state)
            logger.info(f"[dev_approve_cv] final_state: {final_state}")
            logger.info("Approval graph execution completed.")
        except Exception as e:
            logger.error(f"Error during approval process: {e}")
            raise RuntimeError(f"Error during approval process: {str(e)}")

        if final_state.final_decision and final_state.final_decision.startswith(FinalDecisionStatus.ACCEPTED.value):
            cv_application.status = FinalDecisionStatus.ACCEPTED.value
        else:
            cv_application.status = FinalDecisionStatus.REJECTED.value

        db.commit()
        logger.info(f"CV status updated to {cv_application.status} for candidate: {cv_application.candidate_name}")

        return CVUploadResponseSchema(message=f"CV approval result: {final_state.final_decision}")

    def upload_jd(self, jd_data_list: list, db: Session):
        """Upload multiple JD entries into database."""
        logger.info("Uploading JD list.")
        for jd_data in jd_data_list:
            jd_validated = JobDescriptionUploadSchema(**jd_data)
            normalized_skills = json.dumps(sorted(jd_validated.skills_required))

            existing = db.query(JobDescription).filter_by(
                position=jd_validated.position,
                skills_required=normalized_skills,
                experience_required=jd_validated.experience_required,
                level=jd_validated.level
            ).first()

            if existing:
                continue

            jd = JobDescription(
                position=jd_validated.position,
                skills_required=normalized_skills,
                experience_required=jd_validated.experience_required,
                level=jd_validated.level
            )
            db.add(jd)

        db.commit()
        logger.info("JD list uploaded successfully.")
        return CVUploadResponseSchema(message="JD uploaded successfully.")

    def schedule_interview(self, interview_data, db: Session):
        """Schedule an interview for a candidate."""
        logger.info(f"Scheduling interview for {interview_data.candidate_name}.")

        cv = db.query(CVApplication).filter_by(candidate_name=interview_data.candidate_name).first()
        if not cv:
            return CVUploadResponseSchema(message="Candidate CV not found.")

        if not cv.is_matched:
            return CVUploadResponseSchema(message="Candidate has not matched any JD. Cannot schedule interview.")

        existing = db.query(InterviewSchedule).filter_by(
            candidate_name=interview_data.candidate_name,
            interview_datetime=interview_data.interview_datetime
        ).first()

        if existing:
            return CVUploadResponseSchema(message="Candidate already has an interview scheduled at this time.")

        interview = InterviewSchedule(
            candidate_name=interview_data.candidate_name,
            interviewer_name=interview_data.interviewer_name,
            interview_datetime=interview_data.interview_datetime,
            status=FinalDecisionStatus.PENDING.value,
        )
        db.add(interview)
        db.commit()
        logger.info(f"Interview scheduled successfully for {interview_data.candidate_name}.")

        return CVUploadResponseSchema(message="Interview scheduled successfully.")

    def accept_interview(self, interview_data, db: Session):
        """Candidate accepts a scheduled interview."""
        logger.info(f"Candidate accepting interview ID={interview_data.candidate_id}.")
        try:
            interview = db.query(InterviewSchedule).filter_by(
                id=interview_data.candidate_id
            ).first()

            if not interview:
                return CVUploadResponseSchema(message="Interview not found.")

            interview.status = FinalDecisionStatus.ACCEPTED.value
            db.commit()
            logger.info("Interview accepted successfully.")
            return CVUploadResponseSchema(message="Interview accepted successfully.")

        except Exception as e:
            db.rollback()
            logger.error(f"Error accepting interview: {e}")
            return CVUploadResponseSchema(message=f"Failed to accept interview: {str(e)}")

    def get_all_interviews(self, db: Session, interview_date: Optional[str] = None, candidate_name: Optional[str] = None):
        """Get all scheduled interviews with optional filters."""
        filters = []

        if interview_date:
            try:
                filter_date = datetime.strptime(interview_date, "%Y-%m-%d").date()
                start_datetime = datetime.combine(filter_date, datetime.min.time())
                end_datetime = datetime.combine(filter_date, datetime.max.time())
                filters.append(InterviewSchedule.interview_datetime.between(start_datetime, end_datetime))
            except ValueError:
                raise ValueError("Invalid date format. Use YYYY-MM-DD.")

        if candidate_name:
            filters.append(InterviewSchedule.candidate_name.ilike(f"%{candidate_name}%"))

        if filters:
            interviews = db.query(InterviewSchedule).filter(and_(*filters)).all()
        else:
            interviews = db.query(InterviewSchedule).all()

        logger.info(f"Fetched {len(interviews)} interviews.")
        return interviews

    def get_all_jds(self, db: Session, position: Optional[str] = None):
        """Get all job descriptions with optional filtering."""
        if position:
            jds = db.query(JobDescription).filter(
                JobDescription.position.ilike(f"%{position}%")
            ).all()
        else:
            jds = db.query(JobDescription).all()

        logger.info(f"Fetched {len(jds)} job descriptions.")
        return jds

    def get_pending_cvs(self, db: Session, candidate_name: Optional[str] = None) -> List[dict]:
        """Get all pending CVs with optional filtering."""
        query = db.query(CVApplication).filter_by(status=FinalDecisionStatus.PENDING.value)

        if candidate_name:
            query = query.filter(CVApplication.candidate_name.ilike(f"%{candidate_name}%"))

        pending_cvs = query.all()

        result = [{
            "id": cv.id,
            "candidate_name": cv.candidate_name,
            "email": cv.email,
            "matched_position": cv.matched_position,
            "status": cv.status,
        } for cv in pending_cvs]

        logger.info(f"Fetched {len(result)} pending CVs.")
        return result
    
# TODO: Need to implement full CRUD for RecruitmentService
# ----------------------------------------------------------------
# - (1) Update CV Application (admin can manually edit fields if needed)
# - (2) Delete CV Application (soft-delete or hard-delete depending on requirement)
# - (3) View CV Application by ID (fetch full CV detail)
# - (4) List all CV Applications (with filtering, pagination, search)
# - (5) Update Interview Schedule (reschedule, update interviewer, time)
# - (6) Cancel Interview (mark interview as "Cancelled" status)
# - (7) Manage Job Descriptions (edit / delete JD)
# - (8) Export CV Application list (CSV / Excel format)
# ----------------------------------------------------------------
    def update_cv_application(self, cv_id: int, update_data: dict, db: Session):
        """Admin updates CV Application fields."""
        logger.info(f"Updating CV application ID={cv_id}")
        cv = db.query(CVApplication).filter_by(id=cv_id).first()
        if not cv:
            raise ValueError("CV Application not found.")

        for key, value in update_data.items():
            if hasattr(cv, key):
                setattr(cv, key, value)

        db.commit()
        logger.info("CV application updated.")
        return CVUploadResponseSchema(message="CV application updated successfully.")

    def delete_cv_application(self, cv_id: int, db: Session):
        """Admin deletes a CV Application (hard delete)."""
        logger.info(f"Deleting CV application ID={cv_id}")
        cv = db.query(CVApplication).filter_by(id=cv_id).first()
        if not cv:
            raise ValueError("CV Application not found.")

        db.delete(cv)
        db.commit()
        logger.info("CV application deleted.")
        return CVUploadResponseSchema(message="CV application deleted.")

    def get_cv_application_by_id(self, cv_id: int, db: Session):
        """Fetch full CV detail by ID."""
        cv = db.query(CVApplication).filter_by(id=cv_id).first()
        if not cv:
            raise ValueError("CV Application not found.")
        return {
            "id": cv.id,
            "candidate_name": cv.candidate_name,
            "email": cv.email,
            "position": cv.matched_position,
            "experience_years": cv.experience_years,
            "skills": json.loads(cv.skills),
            "jd_skills": json.loads(cv.matched_jd_skills),
            "status": cv.status,
            "parsed_cv": json.loads(cv.parsed_cv),
        }

    def list_all_cv_applications(self, db: Session, position: Optional[str] = None):
        """List all CVs with optional filtering."""
        if not position or position.lower() == "null":
            query = db.query(CVApplication)
        else:
            query = db.query(CVApplication).filter(CVApplication.matched_position.ilike(f"%{position}%"))
        cvs = query.all()
        logger.info(f"Fetched {len(cvs)} CV applications.")
        return [{
            "id": cv.id,
            "candidate_name": cv.candidate_name,
            "email": cv.email,
            "matched_position": cv.matched_position,
            "status": cv.status,
        } for cv in cvs]

    def update_interview(self, interview_id: int, update_data: dict, db: Session):
        """Admin updates interview details (reschedule, interviewer)."""
        logger.info(f"Updating interview ID={interview_id}")
        interview = db.query(InterviewSchedule).filter_by(id=interview_id).first()
        if not interview:
            raise ValueError("Interview not found.")

        for key, value in update_data.items():
            if hasattr(interview, key):
                setattr(interview, key, value)

        db.commit()
        logger.info("Interview updated.")
        return CVUploadResponseSchema(message="Interview updated successfully.")

    def cancel_interview(self, interview_id: int, db: Session):
        """Cancel an interview (mark as cancelled)."""
        logger.info(f"Cancelling interview ID={interview_id}")
        interview = db.query(InterviewSchedule).filter_by(id=interview_id).first()
        if not interview:
            raise ValueError("Interview not found.")
        interview.status = FinalDecisionStatus.REJECTED.value
        db.commit()
        logger.info("Interview cancelled.")
        return CVUploadResponseSchema(message="Interview cancelled.")

    def edit_jd(self, jd_id: int, update_data: dict, db: Session):
        """Edit JD details."""
        jd = db.query(JobDescription).filter_by(id=jd_id).first()
        if not jd:
            raise ValueError("JD not found.")
        for key, value in update_data.items():
            if hasattr(jd, key):
                setattr(jd, key, value)
        db.commit()
        logger.info("JD updated.")
        return CVUploadResponseSchema(message="JD updated.")

    def delete_jd(self, jd_id: int, db: Session):
        """Delete JD from database."""
        jd = db.query(JobDescription).filter_by(id=jd_id).first()
        if not jd:
            raise ValueError("JD not found.")
        db.delete(jd)
        db.commit()
        logger.info("JD deleted.")
        return CVUploadResponseSchema(message="JD deleted.")