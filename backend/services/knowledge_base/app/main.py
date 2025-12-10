from fastapi import FastAPI
from routers import router
from fastapi.middleware.cors import CORSMiddleware
from config.constants import API_PREFIX
from config.service_registration import ServiceRegistration
from config.log_config import LoggingConfig, AppLogger
from config.constants import *
import uvicorn
from config.constants import *

logger = AppLogger(__name__)

LoggingConfig.setup_logging(json_format=True)

app = FastAPI(
    title="Knowledge Base Service",
    version="1.0.0",
    docs_url=f"{API_PREFIX}/docs",
    redoc_url=f"{API_PREFIX}/redoc",
    openapi_url=f"{API_PREFIX}/openapi.json",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount router
app.include_router(router, prefix=API_PREFIX, tags=["Knowledge Base API"])
# Include health check router
ServiceRegistration.register_service()

if __name__ == "__main__":
    if TLS_ENABLED:
        logger.info(f"Starting Knowledge Base API over HTTPS on port {SERVICE_PORT}")
        if not CERT_PATH or not KEY_PATH:
            logger.error("TLS is enabled but CERT_PATH or KEY_PATH is not set.")
            raise RuntimeError("TLS configuration is incomplete.")
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=SERVICE_PORT,
            ssl_certfile=CERT_PATH,
            ssl_keyfile=KEY_PATH,
            reload=True,
        )
    else:
        logger.info(f"Starting Knowledge Base API over HTTP on port {SERVICE_PORT}")
        uvicorn.run("main:app", host="0.0.0.0", port=SERVICE_PORT, reload=True)
