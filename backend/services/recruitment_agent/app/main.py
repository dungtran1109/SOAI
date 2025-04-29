from fastapi import FastAPI
from routers import router
from fastapi.middleware.cors import CORSMiddleware
from config.constants import API_PREFIX
from config.database import DeclarativeBase, engine
from config.service_registration import ServiceRegistration
import uvicorn
from config.constants import *
# This is required because we need to include model for sqlachemy identify and create tables automatically 
import models.job_description
import models.cv_application
import models.interview_schedule

# Create tables automatically
DeclarativeBase.metadata.create_all(bind=engine)

app = FastAPI(
    title="Recruitment ATS",
    version="1.0.0",
    docs_url=f"{API_PREFIX}/docs",
    redoc_url=f"{API_PREFIX}/redoc",
    openapi_url=f"{API_PREFIX}/openapi.json"
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
app.include_router(router, prefix=API_PREFIX, tags=["Recruitment"])
# Include health check router
ServiceRegistration.register_service()
# Add this block to allow running by "python3 main.py"
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=SERVICE_PORT, reload=True)