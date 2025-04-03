from fastapi import FastAPI
from routers import router
from fastapi.middleware.cors import CORSMiddleware
from config.service_registration import ServiceRegistration
from config.log_config import *
app = FastAPI(
    title="Endava Document API",
    version="1.0.0",
    docs_url="/api/v1/document/docs",  # New Swagger UI endpoint
    redoc_url="/api/v1/document/redoc",
    openapi_url="/api/v1/document/openapi.json",
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
app.include_router(router, prefix="/api/v1/document", tags=["Document Parser"])
ServiceRegistration.register_service()
