from pydantic import BaseModel
from typing import Optional

class InterviewQuestionSchema(BaseModel):
    id: int
    cv_application_id: int
    original_question: str
    answer: Optional[str] = None
    edited_question: Optional[str]
    is_edited: bool
    source: str

    class Config:
        from_attributes = True  # Pydantic v2 replacement for orm_mode
