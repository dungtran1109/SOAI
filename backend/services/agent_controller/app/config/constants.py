import os
from dotenv import load_dotenv

load_dotenv()
# Configurations
CONSUL_HOST = os.getenv("CONSUL_HOST", "localhost:8500")
GENAI_HOST = os.getenv("GENAI_HOST", "localhost:8004")
REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
SERVICE_NAME = os.getenv("SERVICE_NAME", "agent_controller_service")
SERVICE_PORT = int(os.getenv("SERVICE_PORT", 8005))
API_PREFIX = "/api/v1/agent-controller"
# TLS Configuration
TLS_ENABLED = os.getenv("TLS_ENABLED", "false").lower() == "true"
CA_PATH = os.getenv("CA_PATH", "")
CERT_PATH = os.getenv("CERT_PATH", "")
KEY_PATH = os.getenv("KEY_PATH", "")
SCHEMA = "https" if TLS_ENABLED else "http"
# LOGGING Configurations
LOG_DIR = "/tmp/logs"
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
SERVICE_ID = "agent-controller"
LOG_VERSION = "1.0.0"
DEFAULT_MODEL = "gpt-4.1"
