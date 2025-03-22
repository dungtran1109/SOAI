import logging
from services.ollama_service import OllamaService
from services.rag_service import RAGService

logger = logging.getLogger(__file__)

class ChatBotService:
    @staticmethod
    def list_models():
        ollama_service = OllamaService()
        return ollama_service.list_models()

    @staticmethod
    async def query(messages, model, temperature, collection_name):
        logger.info(f"Querying Ollama with messages: {collection_name}")
        if not collection_name:
            ollama_service = OllamaService()
            async for chunk in ollama_service.query(messages, model, temperature):
                yield chunk
        else:
            qdrant_service = RAGService(
                collection_name=collection_name, model_name=model
            )
            async for chunk in qdrant_service.query(messages[0]["content"]):
                yield chunk
