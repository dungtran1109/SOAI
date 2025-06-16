from pydantic import BaseModel
from datetime import datetime

class InterviewScheduleCreateSchema(BaseModel):
    candidate_name: str
    interviewer_name: str
    interview_datetime: datetime

class InterviewAcceptSchema(BaseModel):
    candidate_id: int