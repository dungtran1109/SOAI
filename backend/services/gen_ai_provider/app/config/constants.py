import os

CONSUL_HOST = os.getenv("CONSUL_HOST", "localhost:8500")
SERVICE_NAME = os.getenv("SERVICE_NAME", "gen-ai-service")
SERVICE_PORT = int(os.getenv("SERVICE_PORT", 8004))
# LOGGING Configurations
LOG_DIR = "./logs"
LOG_LEVEL = "INFO"
SERVICE_ID = "genai-agent"
LOG_VERSION = "1.0.0"
DEFAULT_MODEL_NAME = "llama3.2"

MAPPING_AI_PROVIDER_TO_MODEL = {
    "openai": "OpenAI",
    "ollama": "Ollama",
    "gemini": "Gemini",
}
