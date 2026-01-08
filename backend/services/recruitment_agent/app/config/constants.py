import os
from dotenv import load_dotenv
from pathlib import Path
from enum import Enum

load_dotenv()
# Configurations
GENAI_HOST = os.getenv("GENAI_HOST", "localhost:8004")
SERVICE_NAME = os.getenv("SERVICE_NAME", "recruitment_agent-service")
SERVICE_PORT = int(os.getenv("SERVICE_PORT", 8003))
API_PREFIX = "/api/v1/recruitment"
MATCHING_SCORE_PERCENTAGE = 70
# TLS Configuration
TLS_ENABLED = os.getenv("TLS_ENABLED", "false").lower() == "true"
CA_PATH = os.getenv("CA_PATH", "")
CERT_PATH = os.getenv("CERT_PATH", "")
KEY_PATH = os.getenv("KEY_PATH", "")
SCHEMA = "https" if TLS_ENABLED else "http"
# LOGGING Configurations
LOG_DIR = "/tmp/logs"
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
SERVICE_ID = "recruitment-agent"
LOG_VERSION = "1.0.0"
# OTEL Configurations
OTEL_ENDPOINT = os.getenv("OTEL_ENDPOINT", "otel-collector:4317") # gRPC endpoint
# CV Upload Dir
BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = f"{BASE_DIR}/cv_uploads"
JD_PREVIEW_DIR = "/tmp/jd_previews"

# MinIO / Object Storage Settings
# Set OBJECT_STORAGE_ENABLED=true to use MinIO, false for local filesystem
OBJECT_STORAGE_ENABLED = os.getenv("OBJECT_STORAGE_ENABLED", "false").lower() == "true"
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "minio:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin123")
MINIO_BUCKET_NAME = os.getenv("MINIO_BUCKET_NAME", "cv-storage")
MINIO_SECURE = os.getenv("MINIO_SECURE", "false").lower() == "true"
MINIO_PRESIGNED_URL_EXPIRY = int(os.getenv("MINIO_PRESIGNED_URL_EXPIRY", 86400))  # 24 hours in seconds
# External URL for presigned URLs (when MinIO is behind a proxy/ingress)
MINIO_EXTERNAL_ENDPOINT = os.getenv("MINIO_EXTERNAL_ENDPOINT", "")

# DB Setting - MySQL
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "soai_db")
DB_USERNAME = os.getenv("DB_USERNAME", "soai_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "soai_password")
# Mail Settings
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = os.getenv("SMTP_PORT", 587)
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "your_email@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "your_app_password")
DEFAULT_CANDIDATE_EMAIL = os.getenv("DEFAULT_CANDIDATE_EMAIL", "")
DEFAULT_MODEL = os.getenv("OPENAI_DEFAULT_MODEL", "gpt-4o-mini")

# Knowledge Base / RAG settings
KNOWLEDGE_BASE_HOST = os.getenv("KNOWLEDGE_BASE_HOST", "soai_knowledge_base:8006")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-large")
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "cv_embeddings")

# Celery Settings
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", f"redis://{os.getenv('REDIS_HOST', 'redis')}:{os.getenv('REDIS_PORT', '6379')}/0")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", CELERY_BROKER_URL)
CELERY_TASK_TIME_LIMIT = int(os.getenv("CELERY_TASK_TIME_LIMIT", 600))
CELERY_TASK_SOFT_TIME_LIMIT = int(os.getenv("CELERY_TASK_SOFT_TIME_LIMIT", 500))
CELERY_TASK_DEFAULT_QUEUE = os.getenv("CELERY_TASK_DEFAULT_QUEUE", "default")
CELERY_TIMEZONE = os.getenv("CELERY_TIMEZONE", "Asia/Ho_Chi_Minh")

class FinalDecisionStatus(str, Enum):
    PENDING = "Pending"
    ACCEPTED = "Accepted"
    REJECTED = "Rejected"