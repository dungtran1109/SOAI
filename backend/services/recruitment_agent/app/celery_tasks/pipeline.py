# celery_tasks/pipeline.py
from celery_worker import celery
from config.database import DatabaseSession
from config.log_config import AppLogger

logger = AppLogger(__name__)

@celery.task(name="celery_tasks.process_cv_pipeline", bind=True, max_retries=3)
def process_cv_pipeline(self, cv_file_path: str, email: str, position: str):
    """
    Celery task to process a CV file (already uploaded to disk) and run the matching pipeline.
    """
    db = DatabaseSession()
    try:
        logger.info(f"[TASK] Start processing CV for position: {position} with cv_file: {cv_file_path}")
        from services.service import RecruitmentService
        service = RecruitmentService()
        task_result = service.upload_cv_from_file_path(
            cv_file_path=cv_file_path,
            override_email=email,
            position_applied_for=position,
            db=db
        )

        logger.info(f"[✓] CV processed successfully for: {cv_file_path}")
        return task_result
    except Exception as e:
        logger.error(f"[✘] Failed to process CV for: {cv_file_path} | Error: {e}")
        self.retry(exc=e, countdown=10)
    finally:
        db.close()

@celery.task(name="celery_tasks.approve_cv_task", bind=True, max_retries=3)
def approve_cv_task(self, candidate_id: int):
    """
    Celery task to approve a candidate CV
    """
    db = DatabaseSession()
    try:
        from services.service import RecruitmentService
        service = RecruitmentService()
        task_result = service.approve_cv(candidate_id=candidate_id, db=db)
        logger.info(f"[✓] Approved CV ID={candidate_id} successfully")
        return task_result
    except Exception as e:
        logger.error(f"[✘] Failed to approve CV ID={candidate_id}: {e}")
        self.retry(exc=e, countdown=10)
    finally:
        db.close()

@celery.task(name="celery_tasks.accept_interview_task", bind=True, max_retries=3)
def accept_interview_task(self, interview_data: dict):
    """
    Celery task to accept candidate interview
    """
    db = DatabaseSession()
    try:
        from services.service import RecruitmentService
        from schemas.interview_schema import InterviewAcceptSchema
        service = RecruitmentService()
        interview_schema = InterviewAcceptSchema(**interview_data)
        task_result = service.accept_interview(interview_data=interview_schema, db=db)
        logger.info(f"[✓] Accepted Interview with candidate ID={interview_schema.candidate_id} successfully")
        return task_result
    except Exception as e:
        logger.error(f"[✘] Failed to accept Interview with candidateID={interview_schema.candidate_id}: {e}")
        self.retry(exc=e, countdown=10)
    finally:
        db.close()