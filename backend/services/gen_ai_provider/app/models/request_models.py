from typing import List, Dict, Optional
from pydantic import BaseModel, Field
from config.constants import DEFAULT_MODEL_NAME


class ChatRequest(BaseModel):
    model: str = DEFAULT_MODEL_NAME
    messages: List[Dict[str, str]] = Field([{"role": "user", "content": "Hello"}])
    temperature: float = 0.5
