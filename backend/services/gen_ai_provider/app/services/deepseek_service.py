import os
from openai import OpenAI
from services.base_ai_service import BaseAIService
from config.log_config import AppLogger

logger = AppLogger(__name__)


class DeepSeekAIService(BaseAIService):
    def __init__(self, model: str = "deepseek-chat"):
        """
        Initializes the DeepSeek AI service using OpenAI-compatible SDK.

        :param model: DeepSeek model to use (default: deepseek-chat)
        """
        super().__init__(model)
        api_key = os.environ.get("DEEPSEEK_API_KEY")
        base_url = os.environ.get("DEEPSEEK_API_BASE", "https://api.deepseek.com/v1")

        self.client = OpenAI(api_key=api_key, base_url=base_url)

    def chat(self, messages: list) -> str:
        """
        Sends a message to DeepSeek API and returns the response.

        :param messages: List of chat messages (role + content)
        :return: Model-generated reply
        """
        try:
            response = self.client.chat.completions.create(
                model=self.model, messages=messages, max_tokens=2048, temperature=0.7
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"DeepSeek chat error: {e}")
            return "Error querying DeepSeek model."

    def get_available_models(self):
        """
        Returns a list of DeepSeek models (manually defined since listing is not supported).
        """
        return [
            {"name": "deepseek-chat", "model": "deepseek-chat"},
            {"name": "deepseek-coder", "model": "deepseek-coder"},
        ]
