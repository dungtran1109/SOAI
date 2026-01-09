import httpx
import ssl
from typing import Optional
from config.log_config import AppLogger
from config.constants import DEFAULT_MODEL, SCHEMA, GENAI_HOST, TLS_ENABLED, CA_PATH

logger = AppLogger(__name__)

# Reusable async client with connection pooling
_http_client: Optional[httpx.AsyncClient] = None


async def get_http_client() -> httpx.AsyncClient:
    """Get or create a reusable async HTTP client with connection pooling."""
    global _http_client
    if _http_client is None:
        # Configure SSL if TLS is enabled
        ssl_context = None
        if TLS_ENABLED and CA_PATH:
            ssl_context = ssl.create_default_context(cafile=CA_PATH)

        _http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(60.0, connect=10.0),
            limits=httpx.Limits(max_keepalive_connections=20, max_connections=100),
            verify=ssl_context if ssl_context else True,
        )
    return _http_client


async def close_http_client():
    """Close the HTTP client (call on shutdown)."""
    global _http_client
    if _http_client:
        await _http_client.aclose()
        _http_client = None


class GenAI:
    def __init__(self, model=DEFAULT_MODEL, temperature=0.5):
        self.model = model
        self.temperature = temperature

    async def invoke(self, messages) -> str:
        """
        Send a message to the GenAI agent and return the response.
        Uses async httpx for non-blocking HTTP requests.
        """
        url = f"{SCHEMA}://{GENAI_HOST}/api/v1/gen-ai/chat"
        payload = {
            "messages": messages,
            "model": self.model,
            "temperature": self.temperature,
        }
        headers = {"Content-Type": "application/json"}

        try:
            client = await get_http_client()
            response = await client.post(url, json=payload, headers=headers)
            logger.debug(f"GenAI response status: {response.status_code}")
            response.raise_for_status()
            return response.json().get("data", "")
        except httpx.HTTPStatusError as http_err:
            logger.error(f"HTTP Error: {http_err}")
            raise
        except httpx.RequestError as req_err:
            logger.error(f"Request Error: {req_err}")
            raise
