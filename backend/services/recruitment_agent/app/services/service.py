import os, subprocess
import shutil
import json
from sqlalchemy.orm import Session
from sqlalchemy import and_
from config.config import Settings
from utils.email_sender import EmailSender
from agents.state import RecruitmentState
from agents.graph import (
    build_recruitment_graph_matching,
    build_recruitment_graph_approval,
)
from fastapi.responses import FileResponse
from fastapi import HTTPException
from models.job_description import JobDescription
from models.interview_schedule import InterviewSchedule
from models.cv_application import CVApplication
from models.interview_question import InterviewQuestion
from schemas.interview_question_schema import InterviewQuestionSchema
from schemas.jd_schema import JobDescriptionUploadSchema
from schemas.cv_schema import CVUploadResponseSchema
from datetime import datetime
from typing import Optional, List
from config.log_config import AppLogger
from config.constants import *
from agents.interview_question_agent import InterviewQuestionAgent
from services.genai import GenAI
from metrics.prometheus_metrics import (
    # CV Counter
    cv_upload_total,
    cv_approved_total,
    cv_rejected_total,
    cv_deleted_total,
    cv_processing_failed_total,
    cv_approval_failed_total,
    # JD Counter
    jd_upload_total,
    jd_deleted_total,
    jd_upload_failed_total,
    # Interview Counter
    interview_scheduled_total,
    interview_accepted_total,
    interview_rejected_total,
    interview_deleted_total,
    interview_bulk_deleted_total,
    interview_schedule_failed_total,
    interview_acceptance_failed_total,
    # Interview Question Counter
    interview_questions_generated_total,
    interview_questions_regenerated_total,
    question_generation_failed_total,
    regenerate_questions_failed_total,
    # Histogram CV
    cv_processing_duration_seconds,
    cv_approval_duration_seconds,
    # Histogration JD
    jd_upload_duration_seconds,
    # Histogram Interview Schedule/Question
    interview_scheduling_duration_seconds,
    interview_acceptance_duration_seconds,
    interview_question_generation_duration_seconds,
    # Gauge metricss
    pending_cv_count,
    scheduled_interview_count,
    interview_question_count,
    jd_count
)
from datetime import date
from urllib.parse import quote
from celery_tasks.pipeline import process_cv_pipeline

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

    def upload_and_process_cv(
        self,
        file,
        override_email: Optional[str] = None,
        position_applied_for: Optional[str] = None,
    ):
        logger.info("Uploading and processing CV file.")
        try:
            with cv_processing_duration_seconds.time():
                cv_dir = "./cv_uploads"
                os.makedirs(cv_dir, exist_ok=True)

                original_path = os.path.join(cv_dir, file.filename)
                with open(original_path, "wb") as f:
                    shutil.copyfileobj(file.file, f)

                # Convert to PDF if needed
                if not file.filename.lower().endswith(".pdf"):
                    try:
                        subprocess.run([
                            "libreoffice", "--headless", "--convert-to", "pdf",
                            "--outdir", cv_dir, original_path
                        ], check=True)
                        pdf_filename = file.filename.rsplit(".", 1)[0] + ".pdf"
                        pdf_path = os.path.join(cv_dir, pdf_filename)
                        if not os.path.exists(pdf_path):
                            raise RuntimeError("PDF conversion failed.")
                    except Exception as e:
                        logger.error(f"LibreOffice conversion failed: {e}")
                        raise RuntimeError("Không thể chuyển đổi CV sang PDF.")
                else:
                    pdf_filename = file.filename

                full_path = os.path.join(cv_dir, pdf_filename)
                process_cv_pipeline.delay(full_path, override_email, position_applied_for)
                return CVUploadResponseSchema(message="Đang xử lý CV. Vui lòng kiểm tra sau.")

        except Exception as e:
            logger.exception(f"Error processing CV: {e}")
            cv_processing_failed_total.inc()
            return CVUploadResponseSchema(message="Đã xảy ra lỗi trong quá trình xử lý hồ sơ. Vui lòng thử lại sau.")

    def upload_cv_from_file_path(
        self,
        cv_file_path: str,
        override_email: str,
        position_applied_for: str,
        db: Session,
    ):
        logger.info(f"[Worker] Processing CV from file path: {cv_file_path}")
        pipeline = build_recruitment_graph_matching(db)
        state = RecruitmentState(cv_file_path=cv_file_path)

        if override_email:
            state.override_email = override_email
        if position_applied_for:
            state.position_applied_for = position_applied_for

        updated_state = pipeline.invoke(state.model_dump())
        final_state = RecruitmentState(**updated_state)
        final_state.parsed_cv["cv_file_name"] = os.path.basename(cv_file_path)

        email_to_check = final_state.override_email or final_state.parsed_cv.get("email")

        matched_jd = final_state.matched_jd or {}
        matched_position = matched_jd.get("position") or position_applied_for or "Không xác định"
        matched_score = matched_jd.get("match_score", 0)
        matched_skills = matched_jd.get("skills_required", [])

        existing_cv = (
            db.query(CVApplication)
            .filter(
                CVApplication.candidate_name == final_state.parsed_cv.get("name"),
                CVApplication.email == email_to_check,
                CVApplication.matched_position == matched_position,
                CVApplication.status.in_([FinalDecisionStatus.PENDING.value, FinalDecisionStatus.ACCEPTED.value])
            ).first()
        )

        if existing_cv:
            return "Hồ sơ này đã được nộp và đang chờ xét duyệt. Không cần nộp lại."

        # Save CV
        cv_application = CVApplication(
            candidate_name=final_state.parsed_cv.get("name"),
            email=email_to_check,
            matched_position=matched_position,
            status=FinalDecisionStatus.PENDING.value,
            skills=json.dumps(final_state.parsed_cv.get("skills", [])),
            matched_jd_skills=json.dumps(matched_skills),
            matched_score=matched_score,
            is_matched=True,
            parsed_cv=json.dumps(final_state.parsed_cv),
            datetime=date.today()
        )
        db.add(cv_application)
        db.commit()
        cv_upload_total.inc()

        if matched_score >= 50:
            return (
                f"Hồ sơ đã được hệ thống phân tích và ghép nối thành công với chuyên đề phù hợp " +
                f"(Điểm đánh giá: {matched_score}/100). Vui lòng chờ hội đồng xét duyệt."
            )
        elif matched_score > 0:
            return (
                f"Hồ sơ của học sinh chưa đáp ứng đầy đủ yêu cầu chuyên đề nhưng đã được đánh giá " +
                f"với điểm {matched_score}/100 dựa trên năng lực học tập. Hồ sơ sẽ được xét tuyển bổ sung."
            )
        else:
            return (
                "Hồ sơ đã được xử lý nhưng không tìm thấy chuyên đề phù hợp. " +
                "Vui lòng kiểm tra lại thông tin học tập hoặc thử với vị trí khác."
            )
    def approve_cv(self, candidate_id: int, db: Session):
        """Phê duyệt hồ sơ học sinh dựa trên đánh giá từ AI Agent."""
        logger.info(f"Starting approval for candidate_id={candidate_id}.")

        cv_application = (
            db.query(CVApplication)
            .filter_by(id=candidate_id, status=FinalDecisionStatus.PENDING.value)
            .first()
        )
        if not cv_application:
            logger.error("Không tìm thấy hồ sơ đang chờ xét duyệt hoặc đã được xử lý.")
            raise ValueError("Hồ sơ không tồn tại hoặc đã được xét duyệt trước đó.")

        pipeline = build_recruitment_graph_approval(db, self.email_sender)

        try:
            parsed_cv = (
                json.loads(cv_application.parsed_cv)
                if isinstance(cv_application.parsed_cv, str)
                else cv_application.parsed_cv or {}
            )
            matched_jd_skills = (
                json.loads(cv_application.matched_jd_skills)
                if isinstance(cv_application.matched_jd_skills, str)
                else cv_application.matched_jd_skills or []
            )
        except Exception as e:
            logger.error(f"Lỗi khi xử lý dữ liệu từ DB: {e}")
            cv_approval_failed_total.inc()
            raise RuntimeError("Không thể đọc dữ liệu hồ sơ hoặc yêu cầu chuyên đề.")

        state = RecruitmentState(
            parsed_cv=parsed_cv,
            matched_jd={
                "position": cv_application.matched_position,
                "skills_required": matched_jd_skills
            },
            override_email=cv_application.email,
        )

        try:
            with cv_approval_duration_seconds.time():
                updated_state = pipeline.invoke(state.model_dump())
                final_state = RecruitmentState(**updated_state)
                logger.info(f"[approve_cv] final_state: {final_state}")
        except Exception as e:
            logger.error(f"Lỗi trong quá trình xét duyệt: {e}")
            cv_approval_failed_total.inc()
            raise RuntimeError("Đã xảy ra lỗi khi thực thi quá trình xét duyệt.")

        if final_state.final_decision and final_state.final_decision.startswith(
            FinalDecisionStatus.ACCEPTED.value
        ):
            cv_application.status = FinalDecisionStatus.ACCEPTED.value
            cv_approved_total.inc()
            decision_message = "Hồ sơ đã được duyệt thành công. Học sinh phù hợp với chuyên đề."
        else:
            cv_application.status = FinalDecisionStatus.REJECTED.value
            cv_rejected_total.inc()
            decision_message = "Hồ sơ không đáp ứng yêu cầu và đã bị từ chối bởi hệ thống đánh giá."

        db.commit()
        logger.info(
            f"Trạng thái hồ sơ đã được cập nhật thành {cv_application.status} cho học sinh {cv_application.candidate_name}"
        )

        return decision_message

    def upload_jd(self, jd_data_list: list, db: Session):
        """Tải lên danh sách chuyên đề để hệ thống đánh giá năng lực học sinh."""
        logger.info("Đang tải danh sách chuyên đề.")

        for jd_data in jd_data_list:
            with jd_upload_duration_seconds.time():
                jd_validated = JobDescriptionUploadSchema(**jd_data)
                logger.debug(f"Xác thực chuyên đề: {jd_validated}")
                normalized_skills = json.dumps(sorted(jd_validated.skills_required))
                logger.debug(f"Kỹ năng chuẩn hóa: {normalized_skills}")

                # Bỏ qua nếu thiếu thông tin bắt buộc
                if not jd_validated.position:
                    logger.warn("Chuyên đề không có tiêu đề. Bỏ qua.")
                    continue
                if not jd_validated.skills_required:
                    logger.warn("Chuyên đề không có yêu cầu kỹ năng. Bỏ qua.")
                    continue
                if not jd_validated.level:
                    logger.warn("Không có cấp độ chuyên đề. Gán mặc định là 'Trung bình'.")
                    jd_validated.level = "Trung bình"

                # Kiểm tra trùng
                existing = (
                    db.query(JobDescription)
                    .filter_by(
                        position=jd_validated.position,
                        skills_required=normalized_skills,
                        level=jd_validated.level,
                    )
                    .first()
                )
                if existing:
                    logger.warn(
                        f"Chuyên đề '{jd_validated.position}' với kỹ năng tương ứng đã tồn tại. Bỏ qua."
                    )
                    continue

                # Thêm mới
                jd = JobDescription(
                    position=jd_validated.position,
                    skills_required=normalized_skills,
                    location=jd_validated.location,
                    datetime=jd_validated.datetime,
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
                logger.debug(f"Thêm mới chuyên đề vào DB: {jd}")
                db.add(jd)
                jd_upload_total.inc()

        # Commit sau cùng
        try:
            db.commit()
        except Exception as e:
            jd_upload_failed_total.inc()
            logger.error(f"Lỗi khi lưu chuyên đề vào DB: {e}")
            return CVUploadResponseSchema(message="Không thể lưu chuyên đề vào hệ thống.")

        logger.info("Tải lên danh sách chuyên đề thành công.")
        return CVUploadResponseSchema(message="Tải lên chuyên đề thành công.")

    def schedule_interview(self, interview_data, db: Session):
        """Lên lịch phỏng vấn cho học sinh đã nộp hồ sơ."""
        logger.info(f"Đang lên lịch phỏng vấn cho học sinh: {interview_data.candidate_name}")
        with interview_scheduling_duration_seconds.time():
            # Kiểm tra hồ sơ ứng viên
            cv = (
                db.query(CVApplication)
                .filter_by(candidate_name=interview_data.candidate_name)
                .first()
            )
            if not cv:
                interview_schedule_failed_total.inc()
                return CVUploadResponseSchema(message="Không tìm thấy hồ sơ của học sinh.")

            if not cv.is_matched:
                interview_schedule_failed_total.inc()
                return CVUploadResponseSchema(
                    message="Học sinh chưa được ghép nối với bất kỳ chuyên đề nào. Không thể lên lịch phỏng vấn."
                )

            # Kiểm tra trùng lịch
            existing = (
                db.query(InterviewSchedule)
                .filter_by(candidate_name=interview_data.candidate_name)
                .first()
            )
            if existing:
                return CVUploadResponseSchema(
                    message="Học sinh đã có lịch phỏng vấn được sắp xếp trước đó."
                )

            # Tạo lịch phỏng vấn
            interview = InterviewSchedule(
                candidate_name=interview_data.candidate_name,
                interviewer_name=interview_data.interviewer_name,
                interview_datetime=interview_data.interview_datetime,
                status=FinalDecisionStatus.PENDING.value,
                cv_application_id=cv.id
            )
            db.add(interview)
            db.commit()
            interview_scheduled_total.inc()
            logger.info(f"Phỏng vấn được lên lịch thành công cho học sinh: {interview_data.candidate_name}")

        return CVUploadResponseSchema(message="Phỏng vấn đã được lên lịch thành công.")

    def accept_interview(self, interview_data, db: Session):
        """Học sinh xác nhận tham gia phỏng vấn. Hệ thống sẽ tạo câu hỏi dựa trên năng lực."""
        logger.info(f"Học sinh xác nhận phỏng vấn, interview_id={interview_data.candidate_id}")
        try:
            # Bước 1: Tìm lịch phỏng vấn
            interview = (
                db.query(InterviewSchedule)
                .filter_by(id=interview_data.candidate_id)
                .first()
            )

            if not interview:
                logger.warn("Không tìm thấy lịch phỏng vấn.")
                return "Không tìm thấy lịch phỏng vấn."

            logger.debug(f"Tìm thấy lịch phỏng vấn: {interview}")
            logger.debug(f"Liên kết với hồ sơ ID: {interview.cv_application_id}")

            with interview_acceptance_duration_seconds.time():
                # Bước 2: Xác nhận phỏng vấn
                interview.status = FinalDecisionStatus.ACCEPTED.value
                db.commit()
                interview_accepted_total.inc()
                logger.info("Học sinh đã xác nhận phỏng vấn.")

                # Bước 3: Lấy hồ sơ liên kết
                cv = db.query(CVApplication).filter_by(id=interview.cv_application_id).first()
                if not cv:
                    logger.warn("Không tìm thấy hồ sơ liên kết.")
                    return "Không tìm thấy hồ sơ liên kết với phỏng vấn."

                logger.info(f"Khởi tạo sinh câu hỏi cho học sinh: {cv.candidate_name} (CV ID={cv.id})")

                parsed_cv = json.loads(cv.parsed_cv)
                matched_jd = {
                    "position": cv.matched_position,
                    "skills_required": json.loads(cv.matched_jd_skills)
                }

                # Bước 4: Sinh câu hỏi phỏng vấn từ AI
                agent = InterviewQuestionAgent(GenAI(model=DEFAULT_MODEL))
                state = RecruitmentState(parsed_cv=parsed_cv, matched_jd=matched_jd)

                with interview_question_generation_duration_seconds.time():
                    result = agent.run(state)
                    questions = result.interview_questions or []

                if not questions:
                    question_generation_failed_total.inc()
                    logger.warn("Không tạo được câu hỏi từ AI.")
                else:
                    interview_questions_generated_total.inc()
                    logger.info(f"Đã tạo {len(questions)} câu hỏi cho CV ID={cv.id}")

                # Bước 5: Ghi câu hỏi vào DB
                db.query(InterviewQuestion).filter_by(cv_application_id=cv.id).delete()
                for q in questions:
                    question_text = q.get("question", "")
                    answer = "\n".join(q.get("answers", []))
                    if not question_text:
                        logger.warn("Câu hỏi trống, bỏ qua.")
                        continue
                    if not answer:
                        answer = "Chưa có câu trả lời."

                    db.add(InterviewQuestion(
                        cv_application_id=cv.id,
                        original_question=question_text,
                        answer=answer,
                        source=DEFAULT_MODEL
                    ))

                db.commit()
                logger.info(f"{len(questions)} câu hỏi phỏng vấn đã được lưu cho CV ID={cv.id}")

            return f"Học sinh đã xác nhận phỏng vấn. Hệ thống đã tạo {len(questions)} câu hỏi để chuẩn bị."

        except Exception as e:
            db.rollback()
            interview_acceptance_failed_total.inc()
            logger.error(f"Lỗi khi xác nhận phỏng vấn: {e}")
            return "Đã xảy ra lỗi khi xác nhận phỏng vấn. Vui lòng thử lại sau."


    def get_all_interviews(
        self,
        db: Session,
        interview_date: Optional[str] = None,
        candidate_name: Optional[str] = None,
    ):
        """Lấy danh sách tất cả các buổi phỏng vấn (có thể lọc theo ngày hoặc tên học sinh)."""
        filters = []

        # Lọc theo ngày phỏng vấn (nếu có)
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
                raise ValueError("Định dạng ngày không hợp lệ. Vui lòng dùng định dạng YYYY-MM-DD.")

        # Lọc theo tên học sinh
        if candidate_name:
            filters.append(
                InterviewSchedule.candidate_name.ilike(f"%{candidate_name}%")
            )

        # Thực hiện truy vấn có lọc hoặc không lọc
        if filters:
            interviews = db.query(InterviewSchedule).filter(and_(*filters)).all()
        else:
            interviews = db.query(InterviewSchedule).all()

        # Cập nhật chỉ số Prometheus
        scheduled_interview_count.set(len(interviews))
        logger.info(f"Đã truy xuất {len(interviews)} lịch phỏng vấn.")

        return interviews

    def get_all_jds(self, db: Session, position: Optional[str] = None):
        """Lấy danh sách tất cả chuyên đề (có thể lọc theo tên chuyên đề)."""
        if position:
            jds = (
                db.query(JobDescription)
                .filter(JobDescription.position.ilike(f"%{position}%"))
                .all()
            )
        else:
            jds = db.query(JobDescription).all()

        # Cập nhật chỉ số Prometheus
        jd_count.set(len(jds))
        logger.info(f"Đã truy xuất {len(jds)} chuyên đề.")

        return jds

    def get_pending_cvs(
        self, db: Session, candidate_name: Optional[str] = None
    ) -> List[dict]:
        """Lấy danh sách hồ sơ đang chờ xét duyệt (có thể lọc theo tên học sinh)."""
        query = db.query(CVApplication).filter_by(
            status=FinalDecisionStatus.PENDING.value
        )

        if candidate_name:
            query = query.filter(
                CVApplication.candidate_name.ilike(f"%{candidate_name}%")
            )

        pending_cvs = query.all()

        # Cập nhật Prometheus Gauge
        pending_cv_count.set(len(pending_cvs))

        result = [
            {
                "id": cv.id,
                "candidate_name": cv.candidate_name,
                "email": cv.email,
                "matched_position": cv.matched_position,
                "matched_score": cv.matched_score,
                "status": cv.status,
                "datetime": cv.datetime.isoformat() if cv.datetime else None,
            }
            for cv in pending_cvs
        ]

        logger.info(f"Đã truy xuất {len(result)} hồ sơ đang chờ xét duyệt.")
        return result
    
    def get_approved_cvs(
        self, db: Session, candidate_name: Optional[str] = None
    ) -> List[dict]:
        """Lấy danh sách hồ sơ đã được xét duyệt (có thể lọc theo tên học sinh)."""
        query = db.query(CVApplication).filter_by(
            status=FinalDecisionStatus.ACCEPTED.value
        )

        if candidate_name:
            query = query.filter(
                CVApplication.candidate_name.ilike(f"%{candidate_name}%")
            )

        approved_cvs = query.all()

        result = [
            {
                "id": cv.id,
                "candidate_name": cv.candidate_name,
                "email": cv.email,
                "matched_position": cv.matched_position,
                "matched_score": cv.matched_score,
                "status": cv.status,
                "datetime": cv.datetime.isoformat() if cv.datetime else None,
            }
            for cv in approved_cvs
        ]

        logger.info(f"Đã truy xuất {len(result)} hồ sơ đã được xét duyệt.")
        return result

    def update_cv_application(self, cv_id: int, update_data: dict, db: Session):
        """Admin cập nhật nội dung hồ sơ học sinh theo yêu cầu."""
        logger.info(f"Đang cập nhật hồ sơ ID={cv_id}")

        cv = db.query(CVApplication).filter_by(id=cv_id).first()
        if not cv:
            raise ValueError("Không tìm thấy hồ sơ học sinh.")

        for key, value in update_data.items():
            if hasattr(cv, key):
                setattr(cv, key, value)

        db.commit()
        logger.info("Cập nhật hồ sơ thành công.")

        return CVUploadResponseSchema(message="Hồ sơ đã được cập nhật thành công.")

    def delete_cv_application(self, cv_id: int, db: Session):
        """Admin xóa hoàn toàn một hồ sơ học sinh khỏi hệ thống."""
        logger.info(f"Đang xóa hồ sơ học sinh ID={cv_id}")

        cv = db.query(CVApplication).filter_by(id=cv_id).first()
        if not cv:
            raise ValueError("Không tìm thấy hồ sơ học sinh cần xóa.")

        db.delete(cv)
        db.commit()
        cv_deleted_total.inc()  # Ghi nhận metric

        logger.info("Hồ sơ đã được xóa khỏi hệ thống.")
        return CVUploadResponseSchema(message="Hồ sơ đã được xóa thành công.")


    def get_cv_application_by_id(self, cv_id: int, db: Session):
        """Lấy chi tiết đầy đủ của hồ sơ học sinh theo ID."""
        cv = db.query(CVApplication).filter_by(id=cv_id).first()
        if not cv:
            raise ValueError("Không tìm thấy hồ sơ học sinh.")

        return {
            "id": cv.id,
            "candidate_name": cv.candidate_name,
            "email": cv.email,
            "position": cv.matched_position,
            "skills": json.loads(cv.skills),
            "jd_skills": json.loads(cv.matched_jd_skills),
            "matched_score": cv.matched_score,
            "status": cv.status,
            "parsed_cv": json.loads(cv.parsed_cv),
        }


    def list_all_cv_applications(self, db: Session, position: Optional[str] = None):
        """Lấy tất cả hồ sơ học sinh, có thể lọc theo chuyên đề."""
        if not position or position.lower() == "null":
            query = db.query(CVApplication)
        else:
            query = db.query(CVApplication).filter(
                CVApplication.matched_position.ilike(f"%{position}%")
            )

        cvs = query.all()
        logger.info(f"Đã truy xuất {len(cvs)} hồ sơ ứng tuyển.")
        return [
            {
                "id": cv.id,
                "candidate_name": cv.candidate_name,
                "email": cv.email,
                "matched_position": cv.matched_position,
                "matched_score": cv.matched_score,
                "status": cv.status,
            }
            for cv in cvs
        ]

    def update_interview(self, interview_id: int, update_data: dict, db: Session):
        """Admin cập nhật thông tin buổi phỏng vấn."""
        logger.info(f"Đang cập nhật lịch phỏng vấn ID={interview_id}")
        interview = db.query(InterviewSchedule).filter_by(id=interview_id).first()
        if not interview:
            raise ValueError("Không tìm thấy lịch phỏng vấn.")

        for key, value in update_data.items():
            if hasattr(interview, key):
                setattr(interview, key, value)

        db.commit()
        logger.info("Lịch phỏng vấn đã được cập nhật.")
        return CVUploadResponseSchema(message="Lịch phỏng vấn đã được cập nhật thành công.")

    def cancel_interview(self, interview_id: int, db: Session):
        """Hủy lịch phỏng vấn – đánh dấu là bị từ chối."""
        logger.info(f"Đang hủy lịch phỏng vấn ID={interview_id}")
        interview = db.query(InterviewSchedule).filter_by(id=interview_id).first()
        if not interview:
            raise ValueError("Không tìm thấy lịch phỏng vấn.")
        interview.status = FinalDecisionStatus.REJECTED.value
        db.commit()
        interview_rejected_total.inc()
        logger.info("Lịch phỏng vấn đã bị hủy.")
        return CVUploadResponseSchema(message="Lịch phỏng vấn đã được hủy.")

    def edit_jd(self, jd_id: int, update_data: dict, db: Session):
        """Admin chỉnh sửa nội dung chuyên đề."""
        jd = db.query(JobDescription).filter_by(id=jd_id).first()
        if not jd:
            raise ValueError("Không tìm thấy chuyên đề.")

        for key, value in update_data.items():
            if hasattr(jd, key):
                setattr(jd, key, value)

        db.commit()
        logger.info("Chuyên đề đã được chỉnh sửa.")
        return CVUploadResponseSchema(message="Chuyên đề đã được cập nhật thành công.")

    def delete_jd(self, jd_id: int, db: Session):
        """Xóa một chuyên đề ra khỏi hệ thống."""
        jd = db.query(JobDescription).filter_by(id=jd_id).first()
        if not jd:
            raise ValueError("Không tìm thấy chuyên đề cần xóa.")
        db.delete(jd)
        db.commit()
        jd_deleted_total.inc()
        logger.info("Chuyên đề đã bị xóa.")
        return CVUploadResponseSchema(message="Chuyên đề đã được xóa thành công.")

    def delete_all_jds(self, db: Session):
        """Xóa toàn bộ chuyên đề trong hệ thống."""
        logger.info("Đang xóa tất cả chuyên đề.")
        deleted_count = db.query(JobDescription).delete(synchronize_session=False)
        db.commit()
        jd_deleted_total.inc(deleted_count)
        return CVUploadResponseSchema(message=f"Đã xóa {deleted_count} chuyên đề.")
    
    def get_interview_questions(self, cv_id: int, db: Session) -> List[InterviewQuestionSchema]:
        logger.info(f"Lấy câu hỏi phỏng vấn cho CV ID={cv_id}")
        try:
            questions = db.query(InterviewQuestion).filter_by(cv_application_id=cv_id).all()
            interview_question_count.set(len(questions))
            logger.info(f"Tìm thấy {len(questions)} câu hỏi.")
            return [InterviewQuestionSchema.model_validate(q) for q in questions]
        except Exception as e:
            logger.error(f"Lỗi khi lấy câu hỏi: {e}")
            return []


    def edit_interview_question(
        self,
        question_id: int,
        new_text: str,
        db: Session,
        edited_by: str
    ):
        logger.info(f"Đang chỉnh sửa câu hỏi ID={question_id}")
        q = db.query(InterviewQuestion).filter_by(id=question_id).first()
        if not q:
            raise ValueError("Không tìm thấy câu hỏi phỏng vấn.")
        
        q.edited_question = new_text
        q.is_edited = True
        q.edited_by = edited_by
        q.edited_at = datetime.utcnow()
        db.commit()
        return {"message": "Câu hỏi đã được cập nhật thành công."}

    
    def regenerate_interview_questions(self, cv_id: int, db: Session) -> List[InterviewQuestion]:
        logger.info(f"Đang tạo lại câu hỏi phỏng vấn cho CV ID={cv_id}")
        cv = db.query(CVApplication).filter_by(id=cv_id).first()
        if not cv:
            regenerate_questions_failed_total.inc()
            raise ValueError("Không tìm thấy hồ sơ học sinh.")

        parsed_cv = json.loads(cv.parsed_cv)
        matched_jd = {
            "position": cv.matched_position,
            "skills_required": json.loads(cv.matched_jd_skills)
        }

        with interview_question_generation_duration_seconds.time():
            agent = InterviewQuestionAgent(GenAI(model=DEFAULT_MODEL))
            state = RecruitmentState(parsed_cv=parsed_cv, matched_jd=matched_jd)
            result = agent.run(state)
            questions = result.interview_questions or []

        if not questions:
            regenerate_questions_failed_total.inc()
            logger.warn("Không tạo được câu hỏi mới.")
            return []

        interview_questions_regenerated_total.inc()
        db.query(InterviewQuestion).filter_by(cv_application_id=cv_id).delete()

        for q in questions:
            question_text = q.get("question") or q.get("original_question") or ""
            if not question_text.strip():
                continue
            raw_answers = q.get("answers")
            if isinstance(raw_answers, list):
                answer_text = "\n".join(raw_answers)
            elif isinstance(raw_answers, str):
                answer_text = raw_answers
            else:
                answer_text = ""
            db.add(InterviewQuestion(
                cv_application_id=cv_id,
                original_question=question_text.strip(),
                answer=answer_text.strip() or "Không có câu trả lời.",
                edited_question=None,
                is_edited=False,
                source=DEFAULT_MODEL
            ))

        db.commit()
        stored = db.query(InterviewQuestion).filter_by(cv_application_id=cv_id).all()
        logger.info(f"Đã lưu {len(stored)} câu hỏi mới.")
        return stored
    
    def delete_interview(self, interview_id: int, db: Session):
        logger.info(f"Đang xóa lịch phỏng vấn ID={interview_id}")
        interview = db.query(InterviewSchedule).filter_by(id=interview_id).first()
        if not interview:
            raise ValueError("Không tìm thấy lịch phỏng vấn.")
        db.delete(interview)
        db.commit()
        interview_deleted_total.inc()
        logger.info("Lịch phỏng vấn đã được xóa.")
        return CVUploadResponseSchema(message="Lịch phỏng vấn đã được xóa.")

    def delete_all_interviews(self, db: Session, candidate_name: Optional[str] = None):
        logger.info("Xóa tất cả lịch phỏng vấn" + (f" cho học sinh '{candidate_name}'" if candidate_name else ""))
        query = db.query(InterviewSchedule)
        if candidate_name:
            query = query.filter(InterviewSchedule.candidate_name.ilike(f"%{candidate_name}%"))
        deleted_count = query.delete(synchronize_session=False)
        db.commit()
        interview_bulk_deleted_total.inc()
        logger.info(f"Đã xóa {deleted_count} lịch phỏng vấn.")
        return CVUploadResponseSchema(message=f"Đã xóa {deleted_count} lịch phỏng vấn.")

    
    def preview_cv_file(self, cv_id: int, db: Session):
        """Serve CV file for inline preview."""
        cv = db.query(CVApplication).filter_by(id=cv_id).first()
        if not cv:
            raise HTTPException(status_code=404, detail="CV not found.")

        parsed_cv = json.loads(cv.parsed_cv)
        filename = parsed_cv.get("cv_file_name") or f"{cv.candidate_name.replace(' ', '_')}.pdf"
        file_path = os.path.join("./cv_uploads", filename)

        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="CV file not found on server.")

        return FileResponse(
            path=file_path,
            media_type="application/pdf",
            filename=filename,
            headers={"Content-Disposition": f'inline; filename=\"{filename}\"'}
        )

    from urllib.parse import quote

    def preview_jd_file(self, jd_id: int, db: Session):
        """
        Tạo và trả về file PDF từ nội dung chuyên đề (JD) để xem trước trên trình duyệt.
        """
        jd = db.query(JobDescription).filter_by(id=jd_id).first()
        if not jd:
            raise HTTPException(status_code=404, detail="Không tìm thấy chuyên đề.")

        output_dir = "./jd_previews"
        os.makedirs(output_dir, exist_ok=True)

        # Tạo tên file chuẩn hóa
        safe_position = jd.position.replace(" ", "_")
        filename = f"jd_{jd.id}_{safe_position}.pdf"
        output_path = os.path.join(output_dir, filename)

        # Nội dung chuyên đề dạng văn bản
        jd_text = f"""
    Chuyên đề: {jd.position}
    Cấp độ: {jd.level}

    Địa điểm: {jd.location}
    Mã giới thiệu: {jd.referral_code or ''}
    Người tuyển dụng: {jd.recruiter or ''}
    Quản lý tuyển dụng: {jd.hiring_manager or ''}

    --- Mô tả công ty ---
    {jd.company_description or ''}

    --- Nội dung chuyên đề ---
    {jd.job_description or ''}

    --- Trách nhiệm ---
    {jd.responsibilities or ''}

    --- Yêu cầu ---
    {jd.qualifications or ''}

    --- Thông tin bổ sung ---
    {jd.additional_information or ''}
        """.strip()

        txt_path = output_path.replace(".pdf", ".txt")
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(jd_text)

        try:
            subprocess.run([
                "libreoffice", "--headless", "--convert-to", "pdf",
                "--outdir", output_dir, txt_path
            ], check=True)
        except Exception as e:
            logger.error(f"[preview_jd_file] Lỗi khi convert LibreOffice: {e}")
            raise HTTPException(status_code=500, detail="Không thể chuyển chuyên đề sang PDF.")

        if not os.path.exists(output_path):
            raise HTTPException(status_code=500, detail="Tạo PDF không thành công.")

        return FileResponse(
            path=output_path,
            media_type="application/pdf",
            filename=filename,
            headers={
                "Content-Disposition": f"inline; filename*=UTF-8''{quote(filename)}"
            }
        )