import requests
from config.log_config import AppLogger
from config.constants import *

logger = AppLogger(__name__)


class GenAI:
    def __init__(self, model=DEFAULT_MODEL, temperature=0.5):
        self.model = model
        self.temperature = temperature

    def invoke(self, message) -> str:
        """
        Send a message to the agent and return the response.
        """
        messages = [{"role": "user", "content": message}]
        response = requests.post(
            url=f"http://{GENAI_HOST}/api/v1/gen-ai/chat",
            json={
                "messages": messages,
                "model": self.model,
                "temperature": self.temperature,
            },
            headers={"Content-Type": "application/json"},
        )
        logger.debug(response.json())
        if response.status_code == 200:
            return response
        else:
            raise Exception(f"Error: {response.status_code} - {response.text}")
