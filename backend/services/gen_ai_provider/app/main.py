from fastapi import FastAPI
from routers import router
from fastapi.middleware.cors import CORSMiddleware
from config.log_config import LoggingConfig, AppLogger
import uvicorn
from config.constants import *
# === OpenTelemetry setup ===
from metrics.otel_setup import setup_otel
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response

logger = AppLogger(__name__)

LoggingConfig.setup_logging(json_format=True)

app = FastAPI(
    title="Endava GenAI Provider API",
    version="1.0.0",
    docs_url="/api/v1/gen-ai/docs",  # New Swagger UI endpoint
    redoc_url="/api/v1/gen-ai/redoc",
    openapi_url="/api/v1/gen-ai/openapi.json",
)


@app.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Setup OpenTelemetry
setup_otel(app=app, service_name=SERVICE_NAME)

# Include all routers
app.include_router(router, prefix="/api/v1/gen-ai", tags=["gen-ai"])

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