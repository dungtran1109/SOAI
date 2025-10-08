from fastapi import FastAPI
from routers import router
from fastapi.middleware.cors import CORSMiddleware
from config.constants import API_PREFIX
from config.database import DeclarativeBase, engine
from config.service_registration import ServiceRegistration
from config.log_config import LoggingConfig, AppLogger, enable_otlp_logging
from config.constants import *
import uvicorn
from config.constants import *
# This is required because we need to include model for sqlachemy identify and create tables automatically 
import models.job_description
import models.cv_application
import models.interview_schedule
import models.interview_question
from fastapi.staticfiles import StaticFiles
from pathlib import Path
# === OpenTelemetry setup ===
from metrics.otel_setup import setup_otel
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response

logger = AppLogger(__name__)

LoggingConfig.setup_logging(json_format=True)
enable_otlp_logging(service_name=SERVICE_NAME, otlp_endpoint=OTEL_ENDPOINT)
# Create tables automatically
DeclarativeBase.metadata.create_all(bind=engine)

app = FastAPI(
    title="Recruitment ATS",
    version="1.0.0",
    docs_url=f"{API_PREFIX}/docs",
    redoc_url=f"{API_PREFIX}/redoc",
    openapi_url=f"{API_PREFIX}/openapi.json"
)

@app.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

# Mount static folder
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "cv_uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
logger.info(f"CV Upload directory initialized at: {UPLOAD_DIR}")
app.mount(f"{API_PREFIX}/static", StaticFiles(directory=str(UPLOAD_DIR)), name="static")

# Setup OpenTelemetry
setup_otel(app=app, service_name=SERVICE_NAME, otlp_endpoint=OTEL_ENDPOINT, engine=engine)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount router
app.include_router(router, prefix=API_PREFIX, tags=["Recruitment"])
# Include health check router
ServiceRegistration.register_service()

if __name__ == "__main__":
    if TLS_ENABLED:
        logger.info(f"Starting Recruitment API over HTTPS on port {SERVICE_PORT}")
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
        logger.info(f"Starting Recruitment API over HTTP on port {SERVICE_PORT}")
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=SERVICE_PORT,
            reload=True
        )