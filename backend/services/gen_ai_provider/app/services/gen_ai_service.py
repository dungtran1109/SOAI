from typing import List, Union
from services.ollama_service import OllamaService
from services.openai_service import OpenAIService
from services.gemini_service import GeminiAIService
from services.service_factory import get_ai_service
from config.log_config import AppLogger
from config.constants import DEFAULT_EMBEDDING_MODEL
from metrics.prometheus_metrics import *
logger = AppLogger(__name__)


class GenAIService:
    @staticmethod
    def get_available_models():
        services = [OllamaService(), OpenAIService(), GeminiAIService()]
        models = []
        for service in services:
            provider = service.__class__.__name__
            GET_MODELS_REQUESTS.labels(provider=provider).inc()
            try:
                available_models = service.get_available_models()
                if available_models:
                    logger.info(f"Available models from {provider}: {available_models}")
                    models.extend(available_models)
            except Exception as e:
                logger.exception(f"Error getting models from {provider}: {e}")
                GET_MODELS_ERRORS.labels(provider=provider).inc()
        return models

    @staticmethod
    def chat(
        model: str,
        messages: list,
        temperature: float = 0.7,
    ) -> str:
        """
        Chat with the specified AI provider using user/assistant role structure.
        System instructions should be included in the first user message.
        """
        provider = "unknown"
        try:
            service = get_ai_service(model)
            provider = service.__class__.__name__
            CHAT_REQUESTS.labels(provider=provider).inc()
            return service.chat(messages)
        except Exception as e:
            logger.error(f"Chat error with provider {provider}: {e}")
            CHAT_ERRORS.labels(provider=provider).inc()
        return "Error querying AI."

    @staticmethod
    def embed(
        input: Union[str, List[str]],
        model: str = DEFAULT_EMBEDDING_MODEL,
    ) -> List[List[float]]:
        """
        Create embeddings for the given input using OpenAI's embedding API.

        :param input: A string or list of strings to embed
        :param model: The embedding model to use
        :return: List of embedding vectors
        """
        try:
            service = OpenAIService()
            CHAT_REQUESTS.labels(provider="OpenAIService").inc()
            return service.embed(input, model)
        except Exception as e:
            logger.error(f"Embedding error: {e}")
            CHAT_ERRORS.labels(provider="OpenAIService").inc()
            raise
