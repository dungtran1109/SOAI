import os
import google.generativeai as genai
from services.base_ai_service import BaseAIService
from config.constants import MAPPING_AI_PROVIDER_TO_MODEL
from config.log_config import AppLogger

logger = AppLogger(__name__)


class GeminiAIService(BaseAIService):
    def __init__(self, model: str = "gemini-pro"):
        """
        Initializes the Gemini AI chatbot handler using the Google Generative AI SDK.

        :param model: Gemini model to use (default: gemini-pro)
        """
        super().__init__(model)
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            logger.error("GOOGLE_API_KEY environment variable is not set.")
            return
        genai.configure(api_key=api_key)
        self.client = genai.GenerativeModel(model)

    def chat(self, messages: list) -> str:
        """
        Sends messages to Gemini API and returns the assistant's reply.

        :param messages: A list of chat messages (each with 'role' and 'content')
        :return: Chatbot reply as string
        """
        try:
            prompt = "\n".join(
                f"{msg['role'].capitalize()}: {msg['content']}" for msg in messages
            )
            response = self.client.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"Error in Gemini chat: {e}")
            return "Error querying Gemini AI."

    def get_available_models(self):
        """
        Returns a list of available Gemini models.
        """
        try:
            models = genai.list_models()
            return [
                {
                    "name": f"{MAPPING_AI_PROVIDER_TO_MODEL["gemini"]}:{m.name}",
                    "model": m.name,
                }
                for m in models
            ]
        except Exception as e:
            logger.exception(e)
        return []
