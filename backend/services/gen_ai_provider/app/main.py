from fastapi import FastAPI
from routers import router
from fastapi.middleware.cors import CORSMiddleware
from config.service_registration import ServiceRegistration
from config.log_config import LoggingConfig

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
