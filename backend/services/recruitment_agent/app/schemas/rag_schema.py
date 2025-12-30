from typing import Optional, Dict, List
from pydantic import BaseModel

class RAGQueryRequest(BaseModel):
    question: str
    position: Optional[str] = None
    collection_name: Optional[str] = None  # defaults fallback to cv_embeddings
    top_k: int = 5

class Citation(BaseModel):
    id: str
    text: str
    score: float
    payload: Dict

class RAGQueryResponse(BaseModel):
    answer: str
    citations: List[Citation]
    metadata: Dict
