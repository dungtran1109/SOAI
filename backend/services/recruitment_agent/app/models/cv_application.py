from sqlalchemy import Column, Integer, String, Boolean, Text, Date
from config.database import DeclarativeBase
from datetime import date

class CVApplication(DeclarativeBase):
    """
    SQLAlchemy ORM model for storing candidate CV applications.
    """

    __tablename__ = "cv_applications"

    id = Column(Integer, primary_key=True, index=True)
    candidate_name = Column(String(255), nullable=False, index=True)  # Candidate full name (indexed for name search)
    username = Column(String(100), nullable=False, index=True) # Username from the login system
    matched_position = Column(String(255), nullable=True, index=True)  # Matched Job Position (indexed for filtering)
    status = Column(String(50), default="Pending", index=True)  # CV status: Pending / Approved / Rejected (indexed for filtering)
    email = Column(String(255), nullable=True)  # Candidate email address
    skills = Column(Text, nullable=True)  # List of skills extracted from CV (stored as JSON string)
    matched_jd_skills = Column(Text, nullable=True) # JD Match with candidate's skills
    matched_jd_experience_required = Column(Integer, nullable=True, default=0) # JD Match with candidate's years of experiences
    experience_years = Column(Integer, nullable=True)  # Candidate's years of experience
    is_matched = Column(Boolean, default=False, index=True)  # Whether candidate matched any JD (indexed for filtering)
    parsed_cv = Column(Text, nullable=True)  # Full parsed CV content as JSON string
    matched_score = Column(Integer, nullable=False, default=0) # LLM Score after Matching
    datetime = Column(Date(), default=date.today, nullable=True)
    justification = Column(Text, nullable=True)

    # Local storage fields
    storage_key = Column(String(512), nullable=True, index=True)  # File path in local storage
    original_filename = Column(String(255), nullable=True)  # Original uploaded filename