import os
import logging
from anthropic import Anthropic
from services.base_ai_service import BaseAIService

logger = logging.getLogger(__file__)


class AnthropicAIService(BaseAIService):
    def __init__(self, model="claude-3-opus-20240229"):
        super().__init__(model)
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        self.client = Anthropic(api_key=api_key)

    def chat(self, messages: list) -> str:
        """
        Chat with Claude using user/assistant role structure.
        System instructions should be included in the first user message.
        """
        try:
            response = self.client.messages.create(
                model=self.model, messages=messages, max_tokens=128000
            )
            return response.content[0].text.strip()
        except Exception as e:
            logger.error(f"Anthropic chat error: {e}")
            return "Error querying Claude."

    def get_available_models(self):
        return [
            {"name": "claude-3-opus", "model": "claude-3-opus-20240229"},
            {"name": "claude-3-sonnet", "model": "claude-3-sonnet-20240229"},
            {"name": "claude-3-haiku", "model": "claude-3-haiku-20240307"},
        ]
