from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config.config import Settings
from config.constants import LOG_LEVEL

is_echo_db_logs = False
if LOG_LEVEL == "DEBUG":
    is_echo_db_logs = True
engine = create_engine(Settings.SQLALCHEMY_DATABASE_URI, echo=is_echo_db_logs)
DatabaseSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
DeclarativeBase = declarative_base()