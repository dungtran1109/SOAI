from typing import List, Any, Optional
from pydantic import BaseModel


class ErrorResponse(BaseModel):
    code: int
    message: str


class ChatRequest(BaseModel):
    message: str


class APIResponse(BaseModel):
    data: Optional[Any]
    error: Optional[ErrorResponse]


class ChatResponse(BaseModel):
    response: str
