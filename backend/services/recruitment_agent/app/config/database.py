from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config.config import Settings

engine = create_engine(Settings.SQLALCHEMY_DATABASE_URI, echo=True)
DatabaseSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
DeclarativeBase = declarative_base()