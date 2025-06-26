import os
from dotenv import load_dotenv
from enum import Enum

load_dotenv()
# Configurations
GENAI_HOST = os.getenv("GENAI_HOST", "localhost:8004")
CONSUL_HOST = os.getenv("CONSUL_HOST", "localhost:8500")
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

class FinalDecisionStatus(str, Enum):
    PENDING = "Pending"
    ACCEPTED = "Accepted"
    REJECTED = "Rejected"