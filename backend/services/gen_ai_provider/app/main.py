from fastapi import FastAPI
from routers import router
from fastapi.middleware.cors import CORSMiddleware
from config.service_registration import ServiceRegistration
from config.log_config import LoggingConfig, AppLogger
import uvicorn
from config.constants import *

logger = AppLogger(__name__)

LoggingConfig.setup_logging(json_format=True)

app = FastAPI(
    title="Endava GenAI Provider API",
    version="1.0.0",
    docs_url="/api/v1/gen-ai/docs",  # New Swagger UI endpoint
    redoc_url="/api/v1/gen-ai/redoc",
    openapi_url="/api/v1/gen-ai/openapi.json",
)


# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(router, prefix="/api/v1/gen-ai", tags=["gen-ai"])
# Include health check router
ServiceRegistration.register_service()

if __name__ == "__main__":
    logger.info(f"Starting GenAI Provider API with TLS enabled: {TLS_ENABLED}")
    if TLS_ENABLED:
        if not CERT_PATH or not KEY_PATH:
            logger.error("TLS is enabled but CERT_PATH or KEY_PATH is not set.")
            raise RuntimeError("TLS configuration is incomplete.")
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=SERVICE_PORT,
            ssl_certfile=CERT_PATH,
            ssl_keyfile=KEY_PATH,
            reload=True
        )
    else:
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=SERVICE_PORT,
            reload=True
        )