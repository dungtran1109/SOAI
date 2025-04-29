from pydantic import BaseModel, validator
from typing import List

class JobDescriptionUploadSchema(BaseModel):
    position: str
    skills_required: List[str]
    experience_required: int
    level: str = "Mid"

    @validator('position')
    def position_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Position cannot be empty')
        return v
