import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
HOST_NAME = os.getenv("HOST_NAME", "localhost")
TLS_ENABLED = os.getenv("TLS_ENABLED", "false").lower() == "true"
SCHEMA = "https" if TLS_ENABLED else "http"

# Allow AUTH_PORT and SERVER_PORT to be overridden by environment variables
if "AUTH_PORT" in os.environ:
    AUTH_PORT = int(os.getenv("AUTH_PORT"))
else:
    AUTH_PORT = 9443 if TLS_ENABLED else 9090

if "RECRUITMENT_PORT" in os.environ:
    RECRUITMENT_PORT = int(os.getenv("RECRUITMENT_PORT"))
else:
    RECRUITMENT_PORT = 8433 if TLS_ENABLED else 8003

AUTH_URL = f"{SCHEMA}://{HOST_NAME}:{AUTH_PORT}/api/v1/authentications"
BASE_URL = f"{SCHEMA}://{HOST_NAME}:{RECRUITMENT_PORT}/api/v1/recruitment"
TIMEOUT = 60.0

JD_FILE_PATH = os.path.join(BASE_DIR, "test_data", "jd_sample.json")
CV_FILE_PATH = os.path.join(BASE_DIR, "test_data", "sampleCV.pdf")