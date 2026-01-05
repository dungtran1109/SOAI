from typing import List, Dict, Optional, Union
from pydantic import BaseModel, Field
from config.constants import DEFAULT_MODEL_NAME, DEFAULT_EMBEDDING_MODEL


class ChatRequest(BaseModel):
    model: str = DEFAULT_MODEL_NAME
    messages: List[Dict[str, str]] = Field([{"role": "user", "content": "Hello"}])
    temperature: float = 0.5


class EmbeddingRequest(BaseModel):
    model: str = DEFAULT_EMBEDDING_MODEL
    input: Union[str, List[str]] = Field(..., description="Text or list of texts to embed")
