from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from config.database import DeclarativeBase

class InterviewSchedule(DeclarativeBase):
    __tablename__ = "interview_schedules"

    id = Column(Integer, primary_key=True, index=True)
    candidate_name = Column(String(255))
    interviewer_name = Column(String(255))
    interview_datetime = Column(DateTime)
    status = Column(String(50), default="Pending")

    # Attach ON DELETE CASCADE to the ForeignKey constraint
    cv_application_id = Column(
        Integer,
        ForeignKey("cv_applications.id", ondelete="CASCADE"),
        nullable=False
    )
