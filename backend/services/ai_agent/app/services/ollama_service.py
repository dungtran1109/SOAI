import aiohttp
import asyncio
import logging
import json
import requests
import httpx
from typing import Optional, List

from config.constants import MESSAGE_CHATBOT_DONT_UNDERSTAND


logger = logging.getLogger(__file__)


class OllamaService:
    OLLAMA_URL = "http://ollama:11434"

    def __init__(self):
        pass

    async def query(self, messages, model: str, temperature: Optional[float] = 0.5):
        """
        Generator function to stream responses from Ollama API
        """
        async with httpx.AsyncClient(timeout=900.0) as client:
            async with client.stream(
                "POST",
                self.OLLAMA_URL + "/api/chat",
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": temperature,
                    "stream": True,
                },
            ) as response:
                async for chunk in response.aiter_text():
                    yield chunk

    def list_models(self) -> List[str]:
        """
        List available models from the Ollama API.

        Returns:
            List[str]: A list of available model names.
        """
        try:
            response = requests.get(f"{self.OLLAMA_URL}/api/tags")
            response.raise_for_status()  # Raise an exception for HTTP errors
            models = response.json().get("models", [])
            logger.debug(f"Retrieved models: {models}")
            return models
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to retrieve models from Ollama API: {e}")
            return []
