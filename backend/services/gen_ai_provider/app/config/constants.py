import os

CONSUL_HOST = os.getenv("CONSUL_HOST", "localhost")
SERVICE_NAME = os.getenv("SERVICE_NAME", "gen-ai-service")
SERVICE_HOST = os.getenv("SERVICE_HOST", "genai")
SERVICE_PORT = int(os.getenv("SERVICE_PORT", 8004))
# LOGGING Configurations
LOG_LEVEL = os.getenv("LOG_LEVEL", "DEBUG")
LOG_DIR = os.getenv("LOG_DIR", ".")

DEFAULT_MODEL_NAME = "llama3.2"

MAPPING_AI_PROVIDER_TO_MODEL = {
    "openai": "OpenAI",
    "ollama": "Ollama",
    "gemini": "Gemini",
}
