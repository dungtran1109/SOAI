import logging
import os
from typing import List, Optional

from openai import OpenAI  # pip install openai

logger = logging.getLogger(__file__)

class OpenAIEmbeddingAdapter:
    def __init__(self, client: OpenAI, model: str):
        self._client = client
        self._model = model

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        resp = self._client.embeddings.create(model=self._model, input=texts)
        return [item.embedding for item in resp.data]

    def embed_query(self, text: str) -> List[float]:
        resp = self._client.embeddings.create(model=self._model, input=text)
        return resp.data[0].embedding

class Embedding:
    """OpenAI-only embeddings with lazy initialization and a LangChain-like adapter."""

    def __init__(self, model_name: str = "text-embedding-3-small"):
        self._model_name = model_name
        self._embedding_model: Optional[OpenAIEmbeddingAdapter] = None

    def get_model_name(self) -> str:
        return self._model_name

    def set_model_name(self, new_model_name: str) -> None:
        if not isinstance(new_model_name, str) or not new_model_name.strip():
            raise ValueError("Model name must be a non-empty string.")
        self._model_name = new_model_name.strip()
        self._embedding_model = None
        logger.info(f"Model name updated to: {self._model_name}")

    def get_embedding_model(self) -> OpenAIEmbeddingAdapter:
        """Initializes and retrieves the OpenAI embedding adapter lazily."""
        if self._embedding_model is None:
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise RuntimeError("Missing OPENAI_API_KEY environment variable.")
            logger.info(f"Loading OpenAI embedding model: {self._model_name}")
            client = OpenAI()  # reads OPENAI_API_KEY from environment
            self._embedding_model = OpenAIEmbeddingAdapter(client, self._model_name)
        return self._embedding_model