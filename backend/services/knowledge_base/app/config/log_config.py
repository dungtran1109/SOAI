import json
import logging
import os
import socket
from datetime import datetime
from logging import LogRecord
from logging.handlers import RotatingFileHandler
from config.constants import *
from opentelemetry.sdk.resources import Resource
from opentelemetry._logs import set_logger_provider
from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
from opentelemetry.exporter.otlp.proto.grpc._log_exporter import OTLPLogExporter
# Set default environment variables
CONTAINER_NAME = os.getenv("CONTAINER_NAME", "knowledge-base")
POD_NAME = os.getenv("POD_NAME", "knowledge-base-pod")
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
        log_file_path = os.path.join(LOG_DIR, "knowledge_base.log")

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

logger = AppLogger(__name__)

def is_otel_collector_up(host: str, port: int, timeout: float = 2.0) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except Exception:
        return False

def enable_otlp_logging(service_name: str, otlp_endpoint: str) -> bool:
    """
    If the OTEL Collector is reachable, attach an OLTP handler that ship logs.
    Includes rate limiting to prevent overwhelming the collector/ClickHouse.
    """
    logger = logging.getLogger(__name__)
    host, port_str = otlp_endpoint.split(":")
    port = int(port_str)

    if is_otel_collector_up(host, port):
        logger.info(f"OTLP logging enabled -> {otlp_endpoint}")
    else:
        logger.warning(f"OTLP logging disabled: collector '%s' unreachable", otlp_endpoint)
        return False
    lp = LoggerProvider(resource=Resource.create({"service.name": service_name}))
    set_logger_provider(lp)
    # Configure BatchLogRecordProcessor with rate limiting:
    # - max_queue_size: Buffer size before dropping logs (prevents memory issues)
    # - max_export_batch_size: Logs per batch (smaller = more frequent, less bursty)
    # - schedule_delay_millis: Time between exports (higher = less frequent writes)
    lp.add_log_record_processor(BatchLogRecordProcessor(
        OTLPLogExporter(endpoint=otlp_endpoint, insecure=True),
        max_queue_size=2048,
        max_export_batch_size=512,
        schedule_delay_millis=5000,  # Export every 5 seconds
    ))
    root = logging.getLogger()
    already = any(isinstance(h, LoggingHandler) for h in root.handlers)
    if not already:
        root.addHandler(LoggingHandler(level=root.level, logger_provider=lp))
    logging.getLogger(__name__).info("OTLP logging enabled -> %s", otlp_endpoint)
    return True
