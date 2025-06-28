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
        Send a message to the GenAI agent and return the response.
        """
        messages = [{"role": "user", "content": message}]

        request_kwargs = {
            "url": f"{SCHEMA}://{GENAI_HOST}/api/v1/gen-ai/chat",
            "json": {
                "messages": messages,
                "model": self.model,
                "temperature": self.temperature,
            },
            "headers": {"Content-Type": "application/json"},
        }

        # Only verify with CA cert if TLS is enabled
        # Query to genai server => Need to use CA certificate for validation
        if TLS_ENABLED:
            request_kwargs["verify"] = CA_PATH

        try:
            response = requests.post(**request_kwargs)
            logger.debug(response.json())
            response.raise_for_status()
            return response
        except requests.exceptions.SSLError as ssl_err:
            logger.error(f"SSL Error: {ssl_err}")
            raise
        except requests.exceptions.RequestException as req_err:
            logger.error(f"Request Error: {req_err}")
            raise
