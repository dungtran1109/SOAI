import logging
import requests
from typing import List, Optional

from config.constants import GENAI_HOST, SCHEMA, TLS_ENABLED, CA_PATH

logger = logging.getLogger(__file__)


class GenAIEmbeddingAdapter:
    """Adapter that calls gen_ai_provider service for embeddings."""

    def __init__(self, model: str):
        self._model = model

    def _call_embedding_api(self, input_data) -> List[List[float]]:
        """Calls the gen_ai_provider embedding endpoint."""
        request_kwargs = {
            "url": f"{SCHEMA}://{GENAI_HOST}/api/v1/gen-ai/embeddings",
            "json": {
                "model": self._model,
                "input": input_data,
            },
            "headers": {"Content-Type": "application/json"},
        }

        # Use CA certificate for TLS validation if enabled
        if TLS_ENABLED:
            request_kwargs["verify"] = CA_PATH

        try:
            response = requests.post(**request_kwargs)
            response.raise_for_status()
            result = response.json()
            if result.get("status") == "success":
                return result["data"]["embeddings"]
            else:
                raise RuntimeError(f"Embedding API error: {result.get('message')}")
        except requests.exceptions.SSLError as ssl_err:
            logger.error(f"SSL Error: {ssl_err}")
            raise
        except requests.exceptions.RequestException as req_err:
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
