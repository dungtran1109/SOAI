from contextlib import asynccontextmanager
from fastapi import FastAPI
from routers import router
from fastapi.middleware.cors import CORSMiddleware
from config.constants import API_PREFIX
from config.log_config import LoggingConfig, AppLogger, enable_otlp_logging
from config.constants import *
import uvicorn
from metrics.otel_setup import setup_otel
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response
from services.genai import close_http_client

logger = AppLogger(__name__)

LoggingConfig.setup_logging(json_format=True)
enable_otlp_logging(service_name=SERVICE_NAME, otlp_endpoint=OTEL_ENDPOINT)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Agent Controller starting up...")
    yield
    # Shutdown - cleanup HTTP client connections
    logger.info("Agent Controller shutting down, closing HTTP connections...")
    await close_http_client()


app = FastAPI(
    title="Agent Controller Service",
    version="1.0.0",
    docs_url=f"{API_PREFIX}/docs",
    redoc_url=f"{API_PREFIX}/redoc",
    openapi_url=f"{API_PREFIX}/openapi.json",
    lifespan=lifespan,
)

# Prometheus metrics endpoint
@app.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup OpenTelemetry
setup_otel(app=app, service_name=SERVICE_NAME, otlp_endpoint=OTEL_ENDPOINT)

# Mount router
app.include_router(router, prefix=API_PREFIX, tags=["Controller API"])

if __name__ == "__main__":
    if TLS_ENABLED:
        logger.info(f"Starting Agent Controller API over HTTPS on port {SERVICE_PORT}")
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
        logger.info(f"Starting Agent Controller API over HTTP on port {SERVICE_PORT}")
        uvicorn.run("main:app", host="0.0.0.0", port=SERVICE_PORT, reload=True)
