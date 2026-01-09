import ssl
import threading
import httpx
from config.log_config import AppLogger
from config.constants import *

logger = AppLogger(__name__)

# Thread-safe reusable sync client with connection pooling
_http_client = None
_http_client_lock = threading.Lock()


def get_sync_http_client() -> httpx.Client:
    """Get or create a reusable sync HTTP client with connection pooling (thread-safe)."""
    global _http_client
    if _http_client is None:
        with _http_client_lock:
            # Double-check after acquiring lock
            if _http_client is None:
                ssl_context = None
                if TLS_ENABLED and CA_PATH:
                    ssl_context = ssl.create_default_context(cafile=CA_PATH)

                _http_client = httpx.Client(
                    timeout=httpx.Timeout(60.0, connect=10.0),
                    limits=httpx.Limits(max_keepalive_connections=20, max_connections=100),
                    verify=ssl_context if ssl_context else True,
                )
    return _http_client


class GenAI:
    def __init__(self, model=DEFAULT_MODEL, temperature=0.5):
        self.model = model
        self.temperature = temperature

    def invoke(self, message) -> str:
        """
        Send a message to the GenAI agent and return the response.
        Uses httpx with connection pooling for better performance.
        """
        messages = [{"role": "user", "content": message}]

        url = f"{SCHEMA}://{GENAI_HOST}/api/v1/gen-ai/chat"
        payload = {
            "messages": messages,
            "model": self.model,
            "temperature": self.temperature,
        }
        headers = {"Content-Type": "application/json"}

        try:
            client = get_sync_http_client()
            response = client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            logger.debug(f"GenAI response: {data}")
            return data.get("data", "")
        except httpx.TimeoutException as timeout_err:
            logger.error(f"Timeout Error: {timeout_err}")
            raise
        except httpx.HTTPStatusError as http_err:
            logger.error(f"HTTP Error: {http_err}")
            raise
        except httpx.RequestError as req_err:
            logger.error(f"Request Error: {req_err}")
            raise
