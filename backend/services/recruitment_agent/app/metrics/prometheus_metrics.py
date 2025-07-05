from prometheus_client import Counter, Histogram, Gauge

# === COUNTERS ===

# CV Counters
cv_upload_total = Counter("cv_upload_total", "Total number of CVs uploaded")
cv_approved_total = Counter("cv_approved_total", "Total number of CVs approved")
cv_rejected_total = Counter("cv_rejected_total", "Total number of CVs rejected")
cv_deleted_total = Counter("cv_deleted_total", "Total number of CVs deleted")
cv_processing_failed_total = Counter("cv_processing_failed_total", "Number of CV uploads that failed")
cv_approval_failed_total = Counter("cv_approval_failed_total", "Number of CV approvals that failed")

# JD Counters
jd_upload_total = Counter("jd_upload_total", "Total number of Job Descriptions uploaded")
jd_deleted_total = Counter("jd_deleted_total", "Total number of JDs deleted")
jd_upload_failed_total = Counter("jd_upload_failed_total", "Number of JD uploads that failed")

# Interview Counters
interview_scheduled_total = Counter("interview_scheduled_total", "Total number of interviews scheduled")
interview_accepted_total = Counter("interview_accepted_total", "Total number of interviews accepted by candidates")
interview_rejected_total = Counter("interview_rejected_total", "Total number of interviews rejected or cancelled")
interview_deleted_total = Counter("interview_deleted_total", "Total number of interviews deleted")
interview_bulk_deleted_total = Counter("interview_bulk_deleted_total", "Total number of interviews deleted in bulk")
interview_schedule_failed_total = Counter("interview_schedule_failed_total", "Number of interview scheduling failures")
interview_acceptance_failed_total = Counter("interview_acceptance_failed_total", "Number of interview acceptance failures")

# Interview Question Counters
interview_questions_generated_total = Counter("interview_questions_generated_total", "Total sets of interview questions generated")
interview_questions_regenerated_total = Counter("interview_questions_regenerated_total", "Total sets of interview questions regenerated")
question_generation_failed_total = Counter("question_generation_failed_total", "Number of failed interview question generations")
regenerate_questions_failed_total = Counter("regenerate_questions_failed_total", "Number of failed question regenerations")

# Auth / JWT Counters
jwt_verification_total = Counter("jwt_verification_total", "Total number of JWT verifications")
jwt_verification_failed_total = Counter("jwt_verification_failed_total", "Total number of failed JWT verifications")

# === HISTOGRAMS ===

cv_processing_duration_seconds = Histogram(
    "cv_processing_duration_seconds",
    "Time taken to process and match a CV",
    buckets=[0.5, 1, 2, 3, 5, 10]
)

cv_approval_duration_seconds = Histogram(
    "cv_approval_duration_seconds",
    "Time taken to approve a CV",
    buckets=[0.1, 0.5, 1, 2, 5]
)

jd_upload_duration_seconds = Histogram(
    "jd_upload_duration_seconds",
    "Time taken to upload and validate a JD",
    buckets=[0.1, 0.3, 0.5, 1, 2, 5]
)

interview_scheduling_duration_seconds = Histogram(
    "interview_scheduling_duration_seconds",
    "Time taken to schedule an interview",
    buckets=[0.1, 0.3, 0.5, 1, 2, 5]
)

interview_acceptance_duration_seconds = Histogram(
    "interview_acceptance_duration_seconds",
    "Time taken to accept interview and generate questions",
    buckets=[0.3, 0.5, 1, 2, 3, 5, 10]
)

interview_question_generation_duration_seconds = Histogram(
    "interview_question_generation_duration_seconds",
    "Time taken to generate interview questions using GenAI",
    buckets=[0.3, 0.5, 1, 2, 5, 10]
)

genai_inference_duration_seconds = Histogram(
    "genai_inference_duration_seconds",
    "Duration of GenAI inference calls",
    buckets=[0.1, 0.3, 0.5, 1, 2, 5]
)

cv_list_fetch_duration_seconds = Histogram(
    "cv_list_fetch_duration_seconds",
    "Time taken to fetch all CV applications",
    buckets=[0.05, 0.1, 0.3, 0.5, 1]
)

interview_list_fetch_duration_seconds = Histogram(
    "interview_list_fetch_duration_seconds",
    "Time taken to fetch all interviews",
    buckets=[0.05, 0.1, 0.3, 0.5, 1]
)

# === GAUGES ===

pending_cv_count = Gauge("pending_cv_count", "Current number of CVs pending approval")
scheduled_interview_count = Gauge("scheduled_interview_count", "Current number of scheduled interviews")
interview_question_count = Gauge("interview_question_count", "Current total number of interview questions in DB")
jd_count = Gauge("jd_count", "Current number of Job Descriptions in DB")
