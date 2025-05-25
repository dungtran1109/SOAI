import logging
import os
from logging.handlers import RotatingFileHandler
from config.constants import *

class LoggingConfig:
    @staticmethod
    def setup_logging():
        log_file_path = os.path.join(LOG_DIR, "gen-ai_agent.log")
        level_map = {
            "DEBUG": logging.DEBUG,
            "INFO": logging.INFO,
            "WARN": logging.WARN,
            "WARNING": logging.WARNING,
            "ERROR": logging.ERROR,
        }

        log_level = level_map.get(LOG_LEVEL, logging.INFO)
        logging.basicConfig(
            level=log_level,
            format="%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s",
            handlers=[logging.StreamHandler(),
                      RotatingFileHandler(log_file_path, maxBytes=5 * 1024 * 1024, backupCount=5)]
        )

        # Optional: Set log levels for specific components
        logging.getLogger("uvicorn").setLevel(logging.INFO)
        logging.getLogger("uvicorn.error").setLevel(logging.ERROR)
        logging.getLogger("uvicorn.access").setLevel(logging.INFO)

# Call setup once at startup
LoggingConfig.setup_logging()

class AppLogger:
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)

    def info(self, msg: str, *args, **kwargs):
        self.logger.info(msg, *args, **kwargs)

    def debug(self, msg: str, *args, **kwargs):
        self.logger.debug(msg, *args, **kwargs)

    def error(self, msg: str, *args, **kwargs):
        self.logger.error(msg, *args, **kwargs)

    def warn(self, msg: str, *args, **kwargs):
        self.logger.warning(msg, *args, **kwargs)

    def exception(self, msg: str, *args, **kwargs):
        self.logger.exception(msg, *args, **kwargs)