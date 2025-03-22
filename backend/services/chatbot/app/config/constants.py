import os

# CONSUL
CONSUL_HOST = os.getenv("CONSUL_HOST", "localhost")
# OLLAMA
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "localhost")
OLLAMA_PORT = int(os.getenv("OLLAMA_PORT", 11434))
# QDRANT VECTOR DATABASE RAG
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))
# CHATBOT SERVICE
SERVICE_NAME = os.getenv("SERVICE_NAME", "chatbot-service")
SERVICE_HOST = os.getenv("SERVICE_HOST", "localhost") # Chatbot service for ServiceRegistration in consul
SERVICE_PORT = int(os.getenv("SERVICE_PORT", 8000))

DEFAULT_MODEL_NAME = "llama3.2"
MESSAGE_CHATBOT_DONT_UNDERSTAND = "I'm sorry, I don't understand that."