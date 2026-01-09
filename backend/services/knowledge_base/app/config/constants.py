import os
from dotenv import load_dotenv

load_dotenv()
DEFAULT_COLLECTION_NAME = "knowledge_base"
DEFAULT_EMBEDDING_MODEL = "text-embedding-3-large"

MESSAGE_ADD_DOCUMENT_SUCCESS = "Document added successfully"
MESSAGE_ADD_DOCUMENT_FAILED = "Failed to add document"
# Configurations
SERVICE_NAME = os.getenv("SERVICE_NAME", "knowledge_base_service")
SERVICE_PORT = int(os.getenv("SERVICE_PORT", 8006))
API_PREFIX = "/api/v1/knowledge-base"
# TLS Configuration
TLS_ENABLED = os.getenv("TLS_ENABLED", "false").lower() == "true"
CA_PATH = os.getenv("CA_PATH", "")
CERT_PATH = os.getenv("CERT_PATH", "")
KEY_PATH = os.getenv("KEY_PATH", "")
SCHEMA = "https" if TLS_ENABLED else "http"
# GenAI Provider Configuration
GENAI_HOST = os.getenv("GENAI_HOST", "localhost:8004")
# LOGGING Configurations
LOG_DIR = "/tmp/logs"
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
SERVICE_ID = "knowledge-base"
LOG_VERSION = "1.0.0"

# OpenTelemetry Configuration
OTEL_ENDPOINT = os.getenv("OTEL_ENDPOINT", "otel-collector:4317")
