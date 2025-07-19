from typing import Optional
from services.openai_service import OpenAIService
from services.ollama_service import OllamaService
from services.gemini_service import GeminiAIService
from config.log_config import AppLogger

logger = AppLogger(__name__)


def get_ai_service(model: str) -> Optional[object]:
    """
    Returns an instance of the appropriate AI service class based on the model name.
    """
    # Define available services and their classes
    services = [OpenAIService, OllamaService, GeminiAIService]

    for ServiceClass in services:
        service_instance = ServiceClass(model)
        available_models = [m["model"] for m in service_instance.get_available_models()]
        logger.info(f"{ServiceClass.__name__} supports: {available_models}")

        if model in available_models:
            logger.info(f"Using {ServiceClass.__name__} for model: {model}")
            return service_instance

    logger.warn(f"No AI service found for model: {model}")
    return None
