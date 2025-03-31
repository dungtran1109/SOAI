import os

CONSUL_HOST = os.getenv("CONSUL_HOST", "localhost")
SERVICE_NAME = os.getenv("SERVICE_NAME", "gen-ai-service")
SERVICE_HOST = os.getenv("SERVICE_HOST", "genai")
SERVICE_PORT = int(os.getenv("SERVICE_PORT", 8004))

DEFAULT_MODEL_NAME = "llama3.2"
MESSAGE_CHATBOT_DONT_UNDERSTAND = "I'm sorry, I don't understand that."

MAPPING_AI_PROVIDER_TO_MODEL = {
    "openai": "OpenAI",
    "ollama": "Ollama",
    "gemini": "Gemini",
}
