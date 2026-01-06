from prometheus_client import Counter

# === COUNTERS ===

# CV Counters
cv_upload_total = Counter("cv_upload_total", "Total number of CVs uploaded")
cv_approved_total = Counter("cv_approved_total", "Total number of CVs approved")
cv_deleted_total = Counter("cv_deleted_total", "Total number of CVs deleted")

# JD Counters
jd_upload_total = Counter(
    "jd_upload_total", "Total number of Job Descriptions uploaded"
)
jd_deleted_total = Counter("jd_deleted_total", "Total number of JDs deleted")

# Interview Counters
interview_scheduled_total = Counter(
    "interview_scheduled_total", "Total number of interviews scheduled"
)
interview_accepted_total = Counter(
    "interview_accepted_total", "Total number of interviews accepted by candidates"
)
interview_deleted_total = Counter(
    "interview_deleted_total", "Total number of interviews deleted"
)
# Interview Question Counters
interview_questions_generated_total = Counter(
    "interview_questions_generated_total", "Total sets of interview questions generated"
)
interview_questions_regenerated_total = Counter(
    "interview_questions_regenerated_total",
    "Total sets of interview questions regenerated",
)

# Auth / JWT Counters
jwt_verification_total = Counter(
    "jwt_verification_total", "Total number of JWT verifications"
)
jwt_verification_failed_total = Counter(
    "jwt_verification_failed_total", "Total number of failed JWT verifications"
)

# RAG Counters
rag_ingest_total = Counter(
    "rag_ingest_total", "Total number of CV chunks ingested into Qdrant"
)
rag_query_total = Counter("rag_query_total", "Total number of RAG queries executed")
rag_query_failed_total = Counter(
    "rag_query_failed_total", "Total number of failed RAG queries"
)
