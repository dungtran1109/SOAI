import os

CONSUL_HOST = os.getenv("CONSUL_HOST", "localhost")
SERVICE_NAME = os.getenv("SERVICE_NAME", "ai_agent-service")
SERVICE_PORT = int(os.getenv("SERVICE_PORT", 8004))

DEFAULT_MODEL_NAME = "llama3.2"
MESSAGE_CHATBOT_DONT_UNDERSTAND = "I'm sorry, I don't understand that."