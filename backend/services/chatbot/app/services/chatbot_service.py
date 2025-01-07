import logging
from services.ollama_llm import OllamaLLM

logger = logging.getLogger(__file__)


class ChatBotService:
    def __init__(self):
        pass

    def query(message: str, model: str = "llama3.2"):
        ollama_llm = OllamaLLM()
        response = ollama_llm.invoke(message, model)
        logger.info(response)
        return response
