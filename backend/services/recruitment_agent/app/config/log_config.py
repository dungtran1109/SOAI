import logging

class LoggingConfig:
    @staticmethod
    def setup_logging():
        logging.basicConfig(
            level=logging.DEBUG,
            format="%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s",
            handlers=[
                logging.StreamHandler()
            ]
        )

        # Set specific log levels for different loggers if needed
        logging.getLogger("uvicorn").setLevel(logging.INFO)
        logging.getLogger("uvicorn.error").setLevel(logging.ERROR)
        logging.getLogger("uvicorn.access").setLevel(logging.INFO)

# Call the setup_logging method to configure logging
LoggingConfig.setup_logging()