from sqlalchemy import Column, Integer, String, JSON, Date, Boolean, Text
from config.database import DeclarativeBase
from datetime import date

class JobDescription(DeclarativeBase):
    __tablename__ = "job_descriptions"

    id = Column(Integer, primary_key=True, index=True)
    # Basic info
    position = Column(String(255), nullable=False)
    skills_required = Column(JSON, nullable=False)
    location = Column(String(50), default="Ho Chi Minh City, Vietnam", nullable=True)
    datetime = Column(Date(), default=date.today ,nullable=True)

    # Experience and level
    experience_required = Column(Integer, nullable=False)
    level = Column(String(50), default="Mid", nullable=True)

    # Referral fields
    referral = Column(Boolean, default=False, nullable=False)
    referral_code = Column(String(50), nullable=True)

    # Description and requirements
    company_description = Column(Text, nullable=True)
    job_description = Column(Text, nullable=True)
    
    # Lists (stored as JSON)
    responsibilities = Column(JSON, nullable=True)
    qualifications = Column(JSON, nullable=True)
    additional_information = Column(JSON, nullable=True)
    
    # Hiring Names
    hiring_manager = Column(String(100), nullable=True)
    recruiter = Column(String(100), nullable=True)