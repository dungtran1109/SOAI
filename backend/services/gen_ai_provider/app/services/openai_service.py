import os
from openai import OpenAI
from services.base_ai_service import BaseAIService
from config.constants import (
    MAPPING_AI_PROVIDER_TO_MODEL,
)
from config.log_config import AppLogger

logger = AppLogger(__name__)


class OpenAIService(BaseAIService):
    def __init__(self, model: str = "gpt-4-turbo"):
        """
        Initializes the OpenAI chatbot handler using the latest OpenAI SDK.

        :param api_key: OpenAI API key
        :param model: OpenAI model to use (default: gpt-4-turbo)
        """
        super().__init__(model)
        api_key = os.environ.get("OPENAI_API_KEY")
        self.client = OpenAI(api_key=api_key)

    def chat(self, messages: list) -> str:
        """
        Sends a message to OpenAI API and returns the response.

        :param user_message: User input message
        :return: Chatbot response
        """
        response = self.client.chat.completions.create(
            model=self.model, messages=messages
        )

        return response.choices[0].message.content

    def get_available_models(self):
        """
        Returns a list of available OpenAI models.
        """
        try:
            models = self.client.models.list()
            return [
                {
                    "name": f"{MAPPING_AI_PROVIDER_TO_MODEL["openai"]}:{model.id}",
                    "model": model.id,
                }
                for model in models
            ]
        except Exception as e:
            logger.exception(e)
        return []
