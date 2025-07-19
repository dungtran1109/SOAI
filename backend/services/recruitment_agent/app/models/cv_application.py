from sqlalchemy import Column, Integer, String, Boolean, Date, Text
from config.database import DeclarativeBase
from datetime import date

class CVApplication(DeclarativeBase):
    """
    SQLAlchemy ORM model for storing candidate CV applications.
    """

    __tablename__ = "cv_applications"

    id = Column(Integer, primary_key=True, index=True)
    candidate_name = Column(String(255), nullable=False)  # Candidate full name
    matched_position = Column(String(255), nullable=True)  # Matched Job Position
    status = Column(String(50), default="Pending")  # CV status: Pending / Approved / Rejected
    email = Column(String(255), nullable=True)  # Candidate email address
    skills = Column(Text, nullable=True)  # List of skills extracted from CV (stored as JSON string)
    matched_jd_skills = Column(Text, nullable=True) # JD Match with candidate's skills
    is_matched = Column(Boolean, default=False)  # Whether candidate matched any JD
    parsed_cv = Column(Text, nullable=True)  # Full parsed CV content as JSON string
    matched_score = Column(Integer, nullable=False, default=0) # LLM Score after Matching
    datetime = Column(Date(), default=date.today ,nullable=True)