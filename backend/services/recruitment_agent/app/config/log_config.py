import json
import logging
import os
from datetime import datetime
from logging import LogRecord
from logging.handlers import RotatingFileHandler
from config.constants import *

# Set default environment variables
CONTAINER_NAME = os.getenv("CONTAINER_NAME", "recruitment")
POD_NAME = os.getenv("POD_NAME", "recruitment-pod")
NAMESPACE = os.getenv("NAMESPACE", "default")

class JSONFormatter(logging.Formatter):
    def format(self, record: LogRecord) -> str:
        log_entry = {
            "version": LOG_VERSION,
            "timestamp": datetime.now().isoformat(),
            "severity": record.levelname.lower(),
            "service_id": SERVICE_ID,
            "message": record.getMessage(),
            "metadata": {
                "container_name": CONTAINER_NAME,
                "pod_name": POD_NAME,
                "namespace": NAMESPACE
            }
        }
        return json.dumps(log_entry, ensure_ascii=False)


class LoggingConfig:
    @staticmethod
    def setup_logging(json_format=True):
        if not os.path.exists(LOG_DIR):
            os.makedirs(LOG_DIR, exist_ok=True)
        log_file_path = os.path.join(LOG_DIR, "recruitment_agent.log")

        level_map = {
            "DEBUG": logging.DEBUG,
            "INFO": logging.INFO,
            "WARN": logging.WARN,
            "WARNING": logging.WARNING,
            "ERROR": logging.ERROR,
        }
        log_level = level_map.get(LOG_LEVEL.upper(), logging.INFO)

        # Clear existing handlers
        root_logger = logging.getLogger()
        root_logger.setLevel(log_level)
        root_logger.handlers = []

        # Create handlers
        stream_handler = logging.StreamHandler()
        file_handler = RotatingFileHandler(
            log_file_path, maxBytes=5 * 1024 * 1024, backupCount=5
        )

        # Format
        if json_format:
            formatter = JSONFormatter()
        else:
            formatter = logging.Formatter(
                "%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s"
            )

        stream_handler.setFormatter(formatter)
        file_handler.setFormatter(formatter)

        root_logger.addHandler(stream_handler)
        root_logger.addHandler(file_handler)

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