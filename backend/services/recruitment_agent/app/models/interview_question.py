from sqlalchemy import Column, Integer, Text, ForeignKey, String, Boolean, DateTime
from config.database import DeclarativeBase
from datetime import datetime

class InterviewQuestion(DeclarativeBase):
    __tablename__ = "interview_questions"

    id = Column(Integer, primary_key=True, index=True)

    # Correct placement of ondelete="CASCADE" inside ForeignKey()
    cv_application_id = Column(
        Integer,
        ForeignKey("cv_applications.id", ondelete="CASCADE"),
        nullable=False
    )

    original_question = Column(Text, nullable=False)
    edited_question = Column(Text, nullable=True)
    is_edited = Column(Boolean, default=False)

    source = Column(String(50), default="LLM-GPT")
    edited_by = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    edited_at = Column(DateTime, nullable=True)
