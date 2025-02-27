from fastapi import FastAPI
from routers import router
from fastapi.middleware.cors import CORSMiddleware
from config.service_registration import ServiceRegistration
from config.logging import LoggingConfig

LoggingConfig.setup_logging()

app = FastAPI(
    title="Endava AI Agent API",
    version="1.0.0",
    docs_url="/api/v1/ai-agents/docs",  # New Swagger UI endpoint
    redoc_url="/api/v1/ai-agents/redoc",
    openapi_url="/api/v1/ai-agents/openapi.json",
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
app.include_router(router, prefix="/api/v1/ai-agents", tags=["ai agents"])
ServiceRegistration.register_service()
