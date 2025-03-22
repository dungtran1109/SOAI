import logging

class LoggingConfig:
    @staticmethod
    def setup_logging():
        logging.basicConfig(
            level=logging.DEBUG,
            format="%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s",
            handlers=[logging.StreamHandler()]
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
