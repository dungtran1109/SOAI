from fastapi import FastAPI
from routers import router
from fastapi.middleware.cors import CORSMiddleware
from config.service_registration import ServiceRegistration
from config.log_config import LoggingConfig

LoggingConfig.setup_logging()

app = FastAPI(
    title="Endava Recruitment Agent API",
    version="1.0.0",
    docs_url="/api/v1/recruitment/docs",  # New Swagger UI endpoint
    redoc_url="/api/v1/recruitment/redoc",
    openapi_url="/api/v1/recruitment/openapi.json",
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
app.include_router(router, prefix="/api/v1/recruitment", tags=["recruitment agent"])
ServiceRegistration.register_service()
