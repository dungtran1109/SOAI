import os

CONSUL_HOST = os.getenv("CONSUL_HOST", "localhost:8500")
SERVICE_NAME = os.getenv("SERVICE_NAME", "gen-ai-service")
SERVICE_PORT = int(os.getenv("SERVICE_PORT", 8004))
# TLS Configuration
TLS_ENABLED = os.getenv("TLS_ENABLED", "false").lower() == "true"
CERT_PATH = os.getenv("CERT_PATH", "")
KEY_PATH = os.getenv("KEY_PATH", "")
# LOGGING Configurations
LOG_DIR = "/tmp/logs"
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
SERVICE_ID = "genai-agent"
LOG_VERSION = "1.0.0"
DEFAULT_MODEL_NAME = "llama3.2"

MAPPING_AI_PROVIDER_TO_MODEL = {
    "openai": "OpenAI",
    "ollama": "Ollama",
    "gemini": "Gemini",
}
