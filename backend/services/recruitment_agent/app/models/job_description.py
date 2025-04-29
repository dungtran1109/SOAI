from sqlalchemy import Column, Integer, String, JSON
from config.database import DeclarativeBase

class JobDescription(DeclarativeBase):
    __tablename__ = "job_descriptions"

    id = Column(Integer, primary_key=True, index=True)
    position = Column(String(255), nullable=False)
    skills_required = Column(JSON, nullable=False)
    experience_required = Column(Integer, nullable=False)
    level = Column(String(50), default="Mid")