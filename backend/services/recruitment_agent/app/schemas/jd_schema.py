from pydantic import BaseModel, validator
from typing import List, Optional
from datetime import date
from typing import Any

class JobDescriptionUploadSchema(BaseModel):
    # Basic info
    position: str
    skills_required: List[str]
    location: Optional[str] = "Ho Chi Minh City, Vietnam"
    datetime: Optional[date] = date.today()

    # Experience and level
    experience_required: int
    level: Optional[str] = "Mid"

    # Referral fields
    referral: bool = False
    referral_code: Optional[str] = None

    # Descriptions
    company_description: Optional[str] = None
    job_description: Optional[str] = None

    # Lists
    responsibilities: Optional[List[str]] = None
    qualifications: Optional[List[str]] = None
    additional_information: Optional[Any] = None

    # Hiring Names
    hiring_manager: Optional[str] = None
    recruiter: Optional[str] = None

    @validator('position')
    def position_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Position cannot be empty')
        return v

    @validator('experience_required')
    def experience_positive(cls, v):
        if v < 0:
            raise ValueError('Experience must be a non-negative integer')
        return v
