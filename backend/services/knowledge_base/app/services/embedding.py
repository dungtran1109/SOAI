import logging
import ssl
import threading
import httpx
from typing import List, Optional

from config.constants import GENAI_HOST, SCHEMA, TLS_ENABLED, CA_PATH

logger = logging.getLogger(__file__)

# Thread-safe reusable sync HTTP client with connection pooling
_http_client = None
_http_client_lock = threading.Lock()


def _get_http_client() -> httpx.Client:
    """Get or create a reusable HTTP client with connection pooling (thread-safe)."""
    global _http_client
    if _http_client is None:
        with _http_client_lock:
            # Double-check after acquiring lock
            if _http_client is None:
                ssl_context = None
                if TLS_ENABLED and CA_PATH:
                    ssl_context = ssl.create_default_context(cafile=CA_PATH)

                _http_client = httpx.Client(
                    timeout=httpx.Timeout(120.0, connect=10.0),  # Longer timeout for embeddings
                    limits=httpx.Limits(max_keepalive_connections=20, max_connections=100),
                    verify=ssl_context if ssl_context else True,
                )
    return _http_client


class GenAIEmbeddingAdapter:
    """Adapter that calls gen_ai_provider service for embeddings."""

    def __init__(self, model: str):
        self._model = model

    def _call_embedding_api(self, input_data) -> List[List[float]]:
        """Calls the gen_ai_provider embedding endpoint using httpx with connection pooling."""
        url = f"{SCHEMA}://{GENAI_HOST}/api/v1/gen-ai/embeddings"
        payload = {
            "model": self._model,
            "input": input_data,
        }
        headers = {"Content-Type": "application/json"}

        try:
            client = _get_http_client()
            response = client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            result = response.json()
            if result.get("status") == "success":
                return result["data"]["embeddings"]
            else:
                raise RuntimeError(f"Embedding API error: {result.get('message')}")
        except httpx.TimeoutException as timeout_err:
            logger.error(f"Timeout Error calling embedding API: {timeout_err}")
            raise
        except httpx.HTTPStatusError as http_err:
            logger.error(f"HTTP Error: {http_err}")
            raise
        except httpx.RequestError as req_err:
            logger.error(f"Request Error: {req_err}")
            raise

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Embeds multiple documents."""
        return self._call_embedding_api(texts)

    def embed_query(self, text: str) -> List[float]:
        """Embeds a single query text."""
        embeddings = self._call_embedding_api(text)
        return embeddings[0]


class Embedding:
    """Embedding service that uses gen_ai_provider for embeddings."""

    def __init__(self, model_name: str = "text-embedding-3-large"):
        self._model_name = model_name
        self._embedding_model: Optional[GenAIEmbeddingAdapter] = None

    def get_model_name(self) -> str:
        return self._model_name

    def set_model_name(self, new_model_name: str) -> None:
        if not isinstance(new_model_name, str) or not new_model_name.strip():
            raise ValueError("Model name must be a non-empty string.")
        self._model_name = new_model_name.strip()
        self._embedding_model = None
        logger.info(f"Model name updated to: {self._model_name}")

    def get_embedding_model(self) -> GenAIEmbeddingAdapter:
        """Initializes and retrieves the GenAI embedding adapter lazily."""
        if self._embedding_model is None:
            logger.info(f"Loading GenAI embedding model: {self._model_name}")
            self._embedding_model = GenAIEmbeddingAdapter(self._model_name)
        return self._embedding_model
