# services/recruitment_service.py
import os
import subprocess
import shutil
import json
from typing import Optional, List

from sqlalchemy.orm import Session
from sqlalchemy import and_
from fastapi.responses import FileResponse
from fastapi import HTTPException, UploadFile
from datetime import datetime
from config.config import Settings
from config.log_config import AppLogger
from config.constants import *
from utils.email_sender import EmailSender
from services.genai import GenAI
from agents.state import RecruitmentState
from agents.graph import (
    build_recruitment_graph_matching,
    build_recruitment_graph_approval,
)
from agents.interview_question_agent import InterviewQuestionAgent
from models.job_description import JobDescription
from models.interview_schedule import InterviewSchedule
from models.cv_application import CVApplication
from models.interview_question import InterviewQuestion
from schemas.interview_question_schema import InterviewQuestionSchema
from schemas.jd_schema import JobDescriptionUploadSchema
from schemas.cv_schema import CVUploadResponseSchema
from metrics.prometheus_metrics import *

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
        self.email_sender = EmailSender(
            Settings.SMTP_SERVER,
            Settings.SMTP_PORT,
            Settings.SMTP_USERNAME,
            Settings.SMTP_PASSWORD,
        )

    def upload_and_process_cv(
        self,
        file,
        override_email: Optional[str] = None,
        position_applied_for: Optional[str] = None,
        username: Optional[str] = None
    ):
        logger.info("Uploading and processing CV file.")
        try:
            cv_dir = UPLOAD_DIR
            original_path = os.path.join(cv_dir, file.filename)
            with open(original_path, "wb") as f:
                shutil.copyfileobj(file.file, f)

            if not file.filename.lower().endswith(".pdf"):
                try:
                    subprocess.run(
                        [
                            "libreoffice",
                            "--headless",
                            "--convert-to",
                            "pdf",
                            "--outdir",
                            cv_dir,
                            original_path,
                        ],
                        check=True,
                    )
                    pdf_filename = file.filename.rsplit(".", 1)[0] + ".pdf"
                    pdf_path = os.path.join(cv_dir, pdf_filename)
                    if not os.path.exists(pdf_path):
                        raise RuntimeError("PDF conversion failed.")
                except Exception as e:
                    logger.error(f"LibreOffice conversion failed: {e}")
                    raise RuntimeError("Failed to convert CV to PDF.")
            else:
                pdf_filename = file.filename

            full_path = os.path.join(cv_dir, pdf_filename)
            from celery_tasks.pipeline import process_cv_pipeline
            cv_upload_total.inc()
            process_cv_pipeline.delay(full_path, override_email, position_applied_for, username)
            return CVUploadResponseSchema(message="CV received and is being processed.")
        except Exception as e:
            logger.exception(f"Error processing CV: {e}")
            return CVUploadResponseSchema(message=f"Error processing CV: {str(e)}")

    def upload_cv_from_file_path(
        self,
        cv_file_path: str,
        override_email: str,
        position_applied_for: str,
        username: str,
        db: Session,
    ):
        logger.info(f"[Worker] Processing CV: {cv_file_path}")
        pipeline = build_recruitment_graph_matching(db)
        state = RecruitmentState(cv_file_path=cv_file_path)

        if override_email:
            state.override_email = override_email
        if position_applied_for:
            state.position_applied_for = position_applied_for

        updated_state = pipeline.invoke(state.model_dump())
        final_state = RecruitmentState(**updated_state)

        parsed_cv = final_state.parsed_cv or {}
        candidate_name = parsed_cv.get("name", "Unknown Candidate")
        matched = final_state.matched_jd or {}
        email_to_check = final_state.override_email or parsed_cv.get("email")
        final_state.parsed_cv["cv_file_name"] = os.path.basename(cv_file_path)

        if not matched:
            logger.info("No JD match from pipeline.")
            return "No suitable JD match found."

        candidate_experience = parsed_cv.get("experience_years", 0)
        jd_experience_required = matched.get("experience_required", 0)

        if abs(candidate_experience - jd_experience_required) > 1:
            logger.info("Experience mismatch with JD requirements.")
            return f"{FinalDecisionStatus.REJECTED.value}: Experience mismatch with JD requirements."

        existing = (
            db.query(CVApplication)
            .filter(
                CVApplication.candidate_name == candidate_name,
                CVApplication.email == email_to_check,
                CVApplication.matched_position == matched.get("position"),
                CVApplication.status.in_(
                    [FinalDecisionStatus.PENDING.value, FinalDecisionStatus.ACCEPTED.value]
                ),
            )
            .first()
        )
        if existing:
            logger.info("CV already exists in DB. Skipping.")
            return "CV already exists in DB. Skipping."

        matched_score = 0
        justification = ""
        score_breakdown = matched.get("score_breakdown")
        if isinstance(score_breakdown, dict):
            try:
                matched_score = int(float(score_breakdown.get("total_score", 0)))
            except Exception:
                matched_score = 0
            justification = str(score_breakdown.get("justification", "") or "")

        cv = CVApplication(
            candidate_name=candidate_name,
            username=username,
            email=email_to_check,
            matched_position=matched.get("position", position_applied_for),
            status=FinalDecisionStatus.PENDING.value,
            skills=json.dumps(parsed_cv.get("skills", [])),
            matched_jd_skills=json.dumps(matched.get("skills_required", [])),
            matched_jd_experience_required=jd_experience_required,
            experience_years=candidate_experience,
            parsed_cv=json.dumps(parsed_cv),
            is_matched=True,
            matched_score=matched_score,
            justification=justification,
        )
        db.add(cv)
        db.commit()
        logger.info("CV saved to database.")
        return f"CV processed successfully for candidate name: {candidate_name}"

    def approve_cv(self, candidate_id: int, db: Session):
        logger.info(f"Starting approval for candidate_id={candidate_id}.")
        cv_application = (
            db.query(CVApplication)
            .filter_by(id=candidate_id, status=FinalDecisionStatus.PENDING.value)
            .first()
        )
        if not cv_application:
            logger.error("Pending CV not found or already approved/rejected.")
            raise ValueError("Pending CV not found or already processed.")

        pipeline = build_recruitment_graph_approval(db, self.email_sender)
        try:
            parsed_cv = (
                json.loads(cv_application.parsed_cv)
                if isinstance(cv_application.parsed_cv, str)
                else cv_application.parsed_cv
                or {}
            )
            matched_jd_skills = (
                json.loads(cv_application.matched_jd_skills)
                if isinstance(cv_application.matched_jd_skills, str)
                else cv_application.matched_jd_skills
                or []
            )
        except Exception as e:
            logger.error(f"Error loading CV or JD skills JSON: {e}")
            raise RuntimeError(f"Error loading data from database: {str(e)}")

        state = RecruitmentState(
            parsed_cv=parsed_cv,
            matched_jd={
                "position": cv_application.matched_position,
                "skills_required": matched_jd_skills,
                "experience_required": cv_application.matched_jd_experience_required,
            },
            override_email=cv_application.email,
        )

        try:
            updated_state = pipeline.invoke(state.model_dump())
            final_state = RecruitmentState(**updated_state)
            logger.info("[approve_cv] Approval graph execution completed.")
        except Exception as e:
            logger.error(f"Error during approval process: {e}")
            raise RuntimeError(f"Error during approval process: {str(e)}")

        if final_state.final_decision and final_state.final_decision.startswith(
            FinalDecisionStatus.ACCEPTED.value
        ):
            cv_application.status = FinalDecisionStatus.ACCEPTED.value
            cv_approved_total.inc()
        else:
            cv_application.status = FinalDecisionStatus.REJECTED.value

        if final_state.final_decision:
            cv_application.justification = final_state.final_decision

        db.commit()
        logger.info(
            f"CV status updated to {cv_application.status} for candidate: {cv_application.candidate_name}"
        )
        return f"CV approval result: {final_state.final_decision}"

    def upload_jd(self, jd_data_list: list, db: Session):
        logger.info("Uploading JD list.")
        for jd_data in jd_data_list:
            jd_validated = JobDescriptionUploadSchema(**jd_data)
            logger.debug(f"Validating JD data: {jd_validated}")

            if not jd_validated.position:
                logger.warn("JD position is empty. Skipping this JD.")
                continue
            if not jd_validated.skills_required:
                logger.warn("JD skills_required is empty. Skipping this JD.")
                continue
            if jd_validated.experience_required is None:
                logger.warn("JD experience_required is not set. Skipping this JD.")
                continue
            if not jd_validated.level:
                logger.warn("JD level is not set. Defaulting to 'Mid'.")
                jd_validated.level = "Mid"

            normalized_skills = sorted(jd_validated.skills_required)
            existing = (
                db.query(JobDescription)
                .filter_by(
                    position=jd_validated.position,
                    skills_required=normalized_skills,
                    experience_required=jd_validated.experience_required,
                    level=jd_validated.level,
                )
                .first()
            )
            if existing:
                logger.warn(
                    f"JD with position '{jd_validated.position}' and skills '{normalized_skills}' already exists. Skipping."
                )
                continue

            jd = JobDescription(
                position=jd_validated.position,
                skills_required=normalized_skills,
                location=jd_validated.location,
                datetime=jd_validated.datetime,
                experience_required=jd_validated.experience_required,
                level=jd_validated.level,
                referral=jd_validated.referral,
                referral_code=jd_validated.referral_code,
                company_description=jd_validated.company_description,
                job_description=jd_validated.job_description,
                responsibilities=jd_validated.responsibilities,
                qualifications=jd_validated.qualifications,
                additional_information=jd_validated.additional_information,
                hiring_manager=jd_validated.hiring_manager,
                recruiter=jd_validated.recruiter,
            )
            db.add(jd)

        try:
            db.commit()
            jd_upload_total.inc()
        except Exception as e:
            logger.error(f"Error committing JD uploads: {e}")
            return CVUploadResponseSchema(message="Failed to save JD to the database.")
        logger.info("JD list uploaded successfully.")
        return CVUploadResponseSchema(message="JD uploaded successfully.")

    def schedule_interview(self, interview_data, db: Session):
        logger.info(f"Scheduling interview for {interview_data.candidate_name}.")
        cv = (
            db.query(CVApplication)
            .filter_by(candidate_name=interview_data.candidate_name)
            .first()
        )
        if not cv:
            return CVUploadResponseSchema(message="Candidate CV not found.")

        if not cv.is_matched:
            return CVUploadResponseSchema(
                message="Candidate has not matched any JD. Cannot schedule interview."
            )

        existing = (
            db.query(InterviewSchedule)
            .filter_by(candidate_name=interview_data.candidate_name)
            .first()
        )
        if existing:
            return CVUploadResponseSchema(
                message="Candidate already has an interview scheduled at this time."
            )

        interview = InterviewSchedule(
            candidate_name=interview_data.candidate_name,
            interviewer_name=interview_data.interviewer_name,
            interview_datetime=interview_data.interview_datetime,
            status=FinalDecisionStatus.PENDING.value,
            cv_application_id=cv.id,
        )
        db.add(interview)
        db.commit()
        interview_scheduled_total.inc()
        logger.info("Interview scheduled successfully.")
        return CVUploadResponseSchema(message="Interview scheduled successfully.")

    def accept_interview(self, interview_data, db: Session):
        logger.info(f"Candidate accepting interview ID={interview_data.candidate_id}.")
        try:
            interview = (
                db.query(InterviewSchedule)
                .filter_by(id=interview_data.candidate_id)
                .first()
            )
            if not interview:
                logger.warn("Interview not found.")
                return "Interview not found."

            interview.status = FinalDecisionStatus.ACCEPTED.value
            db.commit()
            logger.info("Interview accepted successfully.")

            cv = db.query(CVApplication).filter_by(id=interview.cv_application_id).first()
            if not cv:
                logger.warn("Associated CV not found for this interview.")
                return "Associated CV not found."

            logger.info(
                f"Triggering InterviewQuestionAgent for candidate: {cv.candidate_name} (CV ID={cv.id})"
            )

            parsed_cv = json.loads(cv.parsed_cv)
            matched_jd = {
                "position": cv.matched_position,
                "skills_required": json.loads(cv.matched_jd_skills),
                "experience_required": cv.matched_jd_experience_required,
            }

            agent = InterviewQuestionAgent(GenAI(model=DEFAULT_MODEL))
            state = RecruitmentState(parsed_cv=parsed_cv, matched_jd=matched_jd)
            result = agent.run(state)
            questions = result.interview_questions or []

            if not questions:
                logger.warn("No interview questions were generated by the agent.")
            else:
                logger.info(f"Generated {len(questions)} questions for CV ID={cv.id}")

            db.query(InterviewQuestion).filter_by(cv_application_id=cv.id).delete()
            for q in questions:
                question_text = q.get("question", "") or q.get("original_question", "")
                if not question_text.strip():
                    logger.warn("Generated question is empty, skipping storage.")
                    continue
                raw_answers = q.get("answers")
                if isinstance(raw_answers, list):
                    answer = "\n".join(raw_answers)
                elif isinstance(raw_answers, str):
                    answer = raw_answers
                else:
                    answer = "No answer provided."

                db.add(
                    InterviewQuestion(
                        cv_application_id=cv.id,
                        original_question=question_text.strip(),
                        answer=answer.strip() or "No answer provided.",
                        source=DEFAULT_MODEL,
                    )
                )
                interview_questions_generated_total.inc()

            db.commit()
            interview_accepted_total.inc()
            logger.info(
                f"{len(questions)} interview questions stored in DB for CV ID={cv.id}."
            )
            return f"Interview accepted. Generated {len(questions)} questions for CV ID={cv.id}."
        except Exception as e:
            db.rollback()
            logger.error(f"Error accepting interview: {e}")
            return CVUploadResponseSchema(message=f"Failed to accept interview: {str(e)}")

    def get_all_interviews(
        self,
        db: Session,
        interview_date: Optional[str] = None,
        candidate_name: Optional[str] = None,
    ):
        filters = []

        if interview_date:
            try:
                filter_date = datetime.strptime(interview_date, "%Y-%m-%d").date()
                start_datetime = datetime.combine(filter_date, datetime.min.time())
                end_datetime = datetime.combine(filter_date, datetime.max.time())
                filters.append(
                    InterviewSchedule.interview_datetime.between(
                        start_datetime, end_datetime
                    )
                )
            except ValueError:
                raise ValueError("Invalid date format. Use YYYY-MM-DD.")

        if candidate_name:
            filters.append(
                InterviewSchedule.candidate_name.ilike(f"%{candidate_name}%")
            )

        interviews = (
            db.query(InterviewSchedule).filter(and_(*filters)).all()
            if filters
            else db.query(InterviewSchedule).all()
        )
        logger.info(f"Fetched {len(interviews)} interviews.")
        return interviews

    def get_all_jds(self, db: Session, position: Optional[str] = None):
        if position:
            jds = (
                db.query(JobDescription)
                .filter(JobDescription.position.ilike(f"%{position}%"))
                .all()
            )
        else:
            jds = db.query(JobDescription).all()

        logger.info(f"Fetched {len(jds)} job descriptions.")
        return jds

    def get_pending_cvs(
        self, db: Session, candidate_name: Optional[str] = None
    ) -> List[dict]:
        query = db.query(CVApplication).filter_by(
            status=FinalDecisionStatus.PENDING.value
        )
        if candidate_name:
            query = query.filter(
                CVApplication.candidate_name.ilike(f"%{candidate_name}%")
            )
        pending_cvs = query.all()
        return [
        {
            "id": cv.id,
            "candidate_name": cv.candidate_name,
            "email": cv.email,
            "position": cv.matched_position,
            "matched_score": cv.matched_score,
            "justification": cv.justification,
            "status": cv.status,
            "datetime": cv.datetime,
        }
        for cv in pending_cvs
    ]

    def get_approved_cvs(
        self, db: Session, candidate_name: Optional[str] = None
    ) -> List[dict]:
        query = db.query(CVApplication).filter_by(
            status=FinalDecisionStatus.ACCEPTED.value
        )
        if candidate_name:
            query = query.filter(
                CVApplication.candidate_name.ilike(f"%{candidate_name}%")
            )
        approved_cvs = query.all()
        return [
        {
            "id": cv.id,
            "candidate_name": cv.candidate_name,
            "email": cv.email,
            "position": cv.matched_position,
            "matched_score": cv.matched_score,
            "justification": cv.justification,
            "status": cv.status,
            "datetime": cv.datetime,
        }
        for cv in approved_cvs
    ]

    def update_cv_application(self, cv_id: int, update_data: dict, db: Session):
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
        logger.info(f"Deleting CV application ID={cv_id}")
        cv = db.query(CVApplication).filter_by(id=cv_id).first()
        if not cv:
            raise ValueError("CV Application not found.")
        db.delete(cv)
        db.commit()
        cv_deleted_total.inc()
        logger.info("CV application deleted.")
        return CVUploadResponseSchema(message="CV application deleted.")

    def get_cv_application_by_id(self, cv_id: int, db: Session):
        cv = db.query(CVApplication).filter_by(id=cv_id).first()
        if not cv:
            raise ValueError("CV Application not found.")
        return {
            "id": cv.id,
            "candidate_name": cv.candidate_name,
            "username": cv.username,
            "email": cv.email,
            "position": cv.matched_position,
            "experience_years": cv.experience_years,
            "skills": json.loads(cv.skills) if cv.skills else [],
            "jd_skills": json.loads(cv.matched_jd_skills) if cv.matched_jd_skills else [],
            "matched_score": cv.matched_score,
            "justification": cv.justification,
            "status": cv.status,
            "parsed_cv": json.loads(cv.parsed_cv) if cv.parsed_cv else {},
        }
    
    def get_cv_application_by_username(self, username: str, db: Session):
        cvs = db.query(CVApplication).filter(CVApplication.username == username).all()
        result = []
        for cv in cvs:
            result.append({
                "id": cv.id,
                "candidate_name": cv.candidate_name,
                "username": cv.username,
                "email": cv.email,
                "position": cv.matched_position,
                "experience_years": cv.experience_years,
                "skills": json.loads(cv.skills) if cv.skills else [],
                "jd_skills": json.loads(cv.matched_jd_skills) if cv.matched_jd_skills else [],
                "matched_score": cv.matched_score,
                "justification": cv.justification,
                "status": cv.status,
                "parsed_cv": json.loads(cv.parsed_cv) if cv.parsed_cv else {},
            })
        logger.debug(f"Found {len(result)} CV(s) for username '{username}'")
        return result

    def list_all_cv_applications(self, db: Session, position: Optional[str] = None):
        if not position or position.lower() == "null":
            query = db.query(CVApplication)
        else:
            query = db.query(CVApplication).filter(
                CVApplication.matched_position.ilike(f"%{position}%")
            )
        cvs = query.all()
        logger.info(f"Fetched {len(cvs)} CV applications.")
        return [
        {
            "id": cv.id,
            "candidate_name": cv.candidate_name,
            "username": cv.username,
            "email": cv.email,
            "position": cv.matched_position,
            "matched_score": cv.matched_score,
            "justification": cv.justification,
            "status": cv.status,
            "datetime": cv.datetime,
        }
        for cv in cvs
    ]

    def update_interview(self, interview_id: int, update_data: dict, db: Session):
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
        logger.info(f"Cancelling interview ID={interview_id}")
        interview = db.query(InterviewSchedule).filter_by(id=interview_id).first()
        if not interview:
            raise ValueError("Interview not found.")
        interview.status = FinalDecisionStatus.REJECTED.value
        db.commit()
        logger.info("Interview cancelled.")
        return CVUploadResponseSchema(message="Interview cancelled.")

    def edit_jd(self, jd_id: int, update_data: dict, db: Session):
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
        jd = db.query(JobDescription).filter_by(id=jd_id).first()
        if not jd:
            raise ValueError("JD not found.")
        db.delete(jd)
        db.commit()
        jd_deleted_total.inc()
        logger.info("JD deleted.")
        return CVUploadResponseSchema(message="JD deleted.")

    def delete_all_jds(self, db: Session):
        logger.info("Deleting all JDs.")
        db.query(JobDescription).delete(synchronize_session=False)
        db.commit()
        logger.info("All JDs deleted.")
        return CVUploadResponseSchema(message="All JDs deleted.")

    def get_interview_questions(self, cv_id: int, db: Session) -> List[InterviewQuestionSchema]:
        logger.info(f"[get_interview_questions] Fetching interview questions for CV ID={cv_id}")
        try:
            questions = db.query(InterviewQuestion).filter_by(cv_application_id=cv_id).all()
            logger.info(f"[get_interview_questions] Found {len(questions)} questions for CV ID={cv_id}")
            for i, q in enumerate(questions, 1):
                logger.debug(
                    f"[get_interview_questions] Q{i}: {q.original_question} (edited: {q.is_edited})"
                )
            return [InterviewQuestionSchema.model_validate(q) for q in questions]
        except Exception as e:
            logger.error(f"[get_interview_questions] Error fetching questions for CV ID={cv_id}: {e}")
            return []

    def edit_interview_question(
        self,
        question_id: int,
        new_text: str,
        db: Session,
        edited_by: str,
    ):
        logger.info(f"Editing interview question ID={question_id}")
        q = db.query(InterviewQuestion).filter_by(id=question_id).first()
        if not q:
            raise ValueError("Interview question not found.")

        q.edited_question = new_text
        q.is_edited = True
        q.edited_by = edited_by
        q.edited_at = datetime.utcnow()

        db.commit()
        logger.info("Interview question updated.")
        return {"message": "Interview question updated successfully."}

    def regenerate_interview_questions(self, cv_id: int, db: Session) -> List[InterviewQuestion]:
        logger.info(f"Regenerating interview questions for CV ID={cv_id}")

        cv = db.query(CVApplication).filter_by(id=cv_id).first()
        if not cv:
            raise ValueError("CV Application not found.")

        parsed_cv = json.loads(cv.parsed_cv) if cv.parsed_cv else {}
        matched_jd = {
            "position": cv.matched_position,
            "skills_required": json.loads(cv.matched_jd_skills) if cv.matched_jd_skills else [],
            "experience_required": cv.matched_jd_experience_required,
        }

        agent = InterviewQuestionAgent(GenAI(model=DEFAULT_MODEL))
        state = RecruitmentState(parsed_cv=parsed_cv, matched_jd=matched_jd)
        result = agent.run(state)
        questions = result.interview_questions or []

        if not questions:
            logger.warn("No questions generated, keeping existing questions")
            return []

        db.query(InterviewQuestion).filter_by(cv_application_id=cv_id).delete()

        for q in questions:
            question_text = q.get("question") or q.get("original_question") or ""
            if not question_text.strip():
                logger.warn("Generated question is empty or invalid, skipping.")
                continue

            raw_answers = q.get("answers")
            if isinstance(raw_answers, list):
                answer_text = "\n".join(raw_answers)
            elif isinstance(raw_answers, str):
                answer_text = raw_answers
            else:
                answer_text = ""

            db.add(
                InterviewQuestion(
                    cv_application_id=cv_id,
                    original_question=question_text.strip(),
                    answer=answer_text.strip() or "No answer provided.",
                    edited_question=None,
                    is_edited=False,
                    source=DEFAULT_MODEL,
                )
            )

        db.commit()
        interview_questions_regenerated_total.inc()
        stored = db.query(InterviewQuestion).filter_by(cv_application_id=cv_id).all()
        logger.info(
            f"{len(stored)} interview questions regenerated and stored for CV ID={cv_id}"
        )
        return stored

    def delete_interview(self, interview_id: int, db: Session):
        logger.info(f"Deleting interview ID={interview_id}")
        interview = db.query(InterviewSchedule).filter_by(id=interview_id).first()
        if not interview:
            raise ValueError("Interview not found.")
        db.delete(interview)
        db.commit()
        interview_deleted_total.inc()
        logger.info("Interview deleted.")
        return CVUploadResponseSchema(message="Interview deleted successfully.")

    def delete_all_interviews(self, db: Session, candidate_name: Optional[str] = None):
        logger.info(
            "Deleting all interviews"
            + (f" for candidate '{candidate_name}'" if candidate_name else "")
        )
        query = db.query(InterviewSchedule)
        if candidate_name:
            query = query.filter(
                InterviewSchedule.candidate_name.ilike(f"%{candidate_name}%")
            )
        deleted_count = query.delete(synchronize_session=False)
        db.commit()
        logger.info(f"{deleted_count} interview(s) deleted.")
        return CVUploadResponseSchema(
            message=f"{deleted_count} interview(s) deleted successfully."
        )

    def preview_cv_file(self, cv_id: int, db: Session):
        cv = db.query(CVApplication).filter_by(id=cv_id).first()
        if not cv:
            raise HTTPException(status_code=404, detail="CV not found.")

        parsed_cv = json.loads(cv.parsed_cv) if cv.parsed_cv else {}
        filename = parsed_cv.get("cv_file_name") or f"{cv.candidate_name.replace(' ', '_')}.pdf"
        file_path = os.path.join(UPLOAD_DIR, filename)

        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=404, detail="CV file not found on server."
            )

        return FileResponse(
            path=file_path,
            media_type="application/pdf",
            filename=filename,
            headers={"Content-Disposition": f'inline; filename="{filename}"'},
        )

    def preview_jd_file(self, jd_id: int, db: Session):
        jd = db.query(JobDescription).filter_by(id=jd_id).first()
        if not jd:
            raise HTTPException(status_code=404, detail="Job Description not found.")

        output_dir = JD_PREVIEW_DIR
        os.makedirs(output_dir, exist_ok=True)

        filename = f"jd_{jd.id}_{jd.position.replace(' ', '_')}.pdf"
        output_path = os.path.join(output_dir, filename)

        jd_text = f"""
Position: {jd.position}
Level: {jd.level}
Experience Required: {jd.experience_required}

Location: {jd.location}
Referral Code: {jd.referral_code or ''}
Recruiter: {jd.recruiter or ''}
Hiring Manager: {jd.hiring_manager or ''}

--- Company Description ---
{jd.company_description or ''}

--- Job Description ---
{jd.job_description or ''}

--- Responsibilities ---
{jd.responsibilities or ''}

--- Qualifications ---
{jd.qualifications or ''}

--- Additional Information ---
{jd.additional_information or ''}
        """.strip()

        txt_path = os.path.join(output_dir, filename.replace(".pdf", ".txt"))
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(jd_text)

        try:
            subprocess.run(
                ["libreoffice", "--headless", "--convert-to", "pdf", "--outdir", output_dir, txt_path],
                check=True,
            )
        except Exception as e:
            logger.error(f"[preview_jd_file] LibreOffice failed: {e}")
            raise HTTPException(status_code=500, detail="Failed to convert JD to PDF.")

        if not os.path.exists(output_path):
            raise HTTPException(status_code=500, detail="JD PDF was not created.")

        return FileResponse(
            path=output_path,
            media_type="application/pdf",
            filename=filename,
            headers={"Content-Disposition": f'inline; filename="{filename}"'},
        )
    
    def list_proof_images(self, cv_id: int) -> List[str]:
        folder_path = os.path.join(UPLOAD_DIR, f"cv_{cv_id}", "proofs")
        if not os.path.exists(folder_path):
            logger.info(f"[list_proof_images] No proof images found for CV ID: {cv_id}")
            return []
        files = sorted(os.listdir(folder_path))
        image_urls = [
            f"{API_PREFIX}/static/cv_{cv_id}/proofs/{file}"
            for file in files
            if file.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))
        ]
        return image_urls
    
    def upload_proof_images(self, cv_id: int, files: List[UploadFile]) -> CVUploadResponseSchema:
        folder_path = os.path.join(UPLOAD_DIR, f"cv_{cv_id}", "proofs")
        saved_files = []
        for file in files:
            if not file.filename.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
                continue
            save_path = os.path.join(folder_path, file.filename)
            with open(save_path, "wb") as f:
                shutil.copyfileobj(file.file, f)
            saved_files.append(file.filename)
        return CVUploadResponseSchema(message=f"Uploaded {len(saved_files)} proof images.")