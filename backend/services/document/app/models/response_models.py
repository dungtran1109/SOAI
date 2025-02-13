from typing import List
from pydantic import BaseModel, validator
from config.constants import DEFAULT_COLLECTION_NAME, DEFAULT_EMBEDDING_MODEL


class QueryRequest(BaseModel):
    query: str
    collection_name: str = DEFAULT_COLLECTION_NAME
    embedding_model: str = DEFAULT_EMBEDDING_MODEL
    top_k: int = 3

    @validator("top_k")
    def top_k_must_be_positive(cls, value):
        if value <= 0:
            raise ValueError("top_k must be a positive integer")
        return value


class AddDocumentRequest(BaseModel):
    texts: List[str]
    collection_name: str = DEFAULT_COLLECTION_NAME
    embedding_model: str = DEFAULT_EMBEDDING_MODEL
