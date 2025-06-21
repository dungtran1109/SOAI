import os
import requests
import httpx
from typing import Optional, List, Generator

from services.base_ai_service import BaseAIService
from config.constants import MAPPING_AI_PROVIDER_TO_MODEL, SCHEMA
from config.log_config import AppLogger

logger = AppLogger(__name__)


class OllamaService(BaseAIService):
    def __init__(self, model: str = "mistral"):
        """
        Initializes the Ollama AI service with the provided model.
        """
        super().__init__(model)
        self.OLLAMA_URL = os.environ.get("OLLAMA_URL", f"{SCHEMA}://ollama:11434")

    async def chat_stream(
        self,
        messages: list,
        temperature: Optional[float] = 0.5,
    ) -> Generator[str, None, None]:
        """
        Asynchronous generator to stream responses from Ollama API.

        :param messages: Chat messages (list of dicts).
        :param temperature: Sampling temperature (default 0.5).
        :yield: Partial streamed response chunks.
        """
        try:
            async with httpx.AsyncClient(timeout=900.0) as client:
                async with client.stream(
                    "POST",
                    f"{self.OLLAMA_URL}/api/chat",
                    json={
                        "model": self.model,
                        "messages": messages,
                        "temperature": temperature,
                        "stream": True,
                    },
                ) as response:
                    async for chunk in response.aiter_text():
                        yield chunk
        except httpx.RequestError as e:
            logger.error(f"Streaming error with Ollama API: {e}")
            yield "Error during streaming."

    def chat(
        self,
        messages: list,
        temperature: Optional[float] = 0.5,
    ) -> str:
        """
        Synchronous chat request to Ollama API.

        :param messages: List of messages to send.
        :param temperature: Sampling temperature.
        :return: Response text.
        """
        url = f"{self.OLLAMA_URL}/api/chat"
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "stream": False,
        }

        try:
            response = requests.post(url, json=payload, timeout=900.0)
            response.raise_for_status()
            data = response.json()
            return data.get("message", {}).get("content", "")
        except requests.exceptions.RequestException as e:
            logger.error(f"Ollama API request failed: {e}")
            return "Error querying Ollama API."

    def get_available_models(self) -> List[dict]:
        """
        Retrieves the list of available models from the Ollama API.

        :return: List of dicts with model details.
        """
        try:
            response = requests.get(f"{self.OLLAMA_URL}/api/tags")
            response.raise_for_status()
            raw_models = response.json().get("models", [])
            return [
                {
                    "name": f"{MAPPING_AI_PROVIDER_TO_MODEL["ollama"]}:{model.get("name")}",
                    "model": model.get("name"),
                }
                for model in raw_models
            ]
        except requests.exceptions.RequestException as e:
            logger.exception(e)
        return []

