from sqlalchemy import Column, Integer, String, DateTime
from config.database import DeclarativeBase

class InterviewSchedule(DeclarativeBase):
    __tablename__ = "interview_schedules"

    id = Column(Integer, primary_key=True, index=True)
    candidate_name = Column(String(255))
    interviewer_name = Column(String(255))
    interview_datetime = Column(DateTime)
    status = Column(String(50), default="Pending")
