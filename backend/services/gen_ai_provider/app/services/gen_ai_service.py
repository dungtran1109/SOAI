from services.ollama_service import OllamaService
from services.openai_service import OpenAIService
from services.gemini_service import GeminiAIService
from services.service_factory import get_ai_service
from config.log_config import AppLogger
from metrics.prometheus_metrics import GET_MODELS_REQUESTS, GET_MODELS_ERRORS, GET_MODELS_DURATION, CHAT_REQUESTS, CHAT_ERRORS, CHAT_DURATION

logger = AppLogger(__name__)


class GenAIService:
    @staticmethod
    def get_available_models():
        services = [OllamaService(), OpenAIService(), GeminiAIService()]
        models = []
        for service in services:
            provider = service.__class__.__name__
            GET_MODELS_REQUESTS.labels(provider=provider).inc()
            with GET_MODELS_DURATION.labels(provider=provider).time():
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
            with CHAT_DURATION.labels(provider=provider).time():
                return service.chat(messages)
        except Exception as e:
            logger.error(f"Chat error with provider {provider}: {e}")
            CHAT_ERRORS.labels(provider=provider).inc()
        return "Error querying AI."
