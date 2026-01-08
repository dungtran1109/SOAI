# celery_tasks/pipeline.py
from celery_worker import celery
from config.database import DatabaseSession
from config.log_config import AppLogger

logger = AppLogger(__name__)

@celery.task(name="celery_tasks.process_cv_pipeline", bind=True, max_retries=3)
def process_cv_pipeline(
    self,
    storage_key: str,
    bucket_name: str,
    original_filename: str,
    email: str,
    position: str,
    username: str,
):
    """
    Celery task to process a CV file from object storage and run the matching pipeline.

    Args:
        storage_key: Object key in MinIO storage
        bucket_name: Storage bucket name
        original_filename: Original uploaded filename
        email: Candidate email override
        position: Position applied for
        username: User who uploaded the CV
    """
    db = DatabaseSession()
    try:
        logger.info(f"[TASK] Start processing CV for position: {position} with storage_key: {storage_key}")
        from services.service import RecruitmentService
        service = RecruitmentService()
        task_result = service.process_cv_from_storage(
            storage_key=storage_key,
            bucket_name=bucket_name,
            original_filename=original_filename,
            override_email=email,
            position_applied_for=position,
            username=username,
            db=db
        )

        logger.info(f"[OK] CV processed successfully for storage_key: {storage_key}")
        return task_result
    except Exception as e:
        logger.error(f"[ERROR] Failed to process CV for storage_key: {storage_key} | Error: {e}")
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

        interview_schema = InterviewAcceptSchema(**interview_data)
        service = RecruitmentService()
        task_result = service.accept_interview(interview_data=interview_schema, db=db)
        logger.info(f"[✓] Accepted Interview with candidate ID={interview_schema.candidate_id} successfully")
        return task_result
    except Exception as e:
        logger.error(f"[✘] Failed to accept Interview with candidateID={interview_schema.candidate_id}: {e}")
        self.retry(exc=e, countdown=10)
    finally:
        db.close()