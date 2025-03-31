from typing import List, Any, Optional
from pydantic import BaseModel
class StandardResponse(BaseModel):
    status: str
    message: Optional[str] = None
    data: Optional[Any] = None
    error: Optional[Any] = None
