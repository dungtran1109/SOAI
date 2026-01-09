from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import QueuePool
from config.config import Settings
from config.constants import LOG_LEVEL

is_echo_db_logs = False
if LOG_LEVEL == "DEBUG":
    is_echo_db_logs = True

# Connection pool settings for improved performance
engine = create_engine(
    Settings.SQLALCHEMY_DATABASE_URI,
    echo=is_echo_db_logs,
    poolclass=QueuePool,
    pool_size=10,          # Number of permanent connections
    max_overflow=20,       # Additional connections when pool is exhausted
    pool_timeout=30,       # Seconds to wait for available connection
    pool_recycle=1800,     # Recycle connections after 30 minutes
    pool_pre_ping=True,    # Test connections before use (handles stale connections)
)
DatabaseSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
DeclarativeBase = declarative_base()