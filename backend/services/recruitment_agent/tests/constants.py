import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
HOST_NAME = os.getenv("HOST_NAME", "localhost")
TLS_ENABLED = os.getenv("TLS_ENABLED", "false").lower() == "true"
SCHEMA = "https" if TLS_ENABLED else "http"

# Allow WEBSERVER_PORT to be overridden by env, else use 8080 (HTTP) or 8443 (HTTPS)
if "WEBSERVER_PORT" in os.environ:
    WEBSERVER_PORT = int(os.getenv("WEBSERVER_PORT"))
else:
    WEBSERVER_PORT = 8443 if TLS_ENABLED else 8080

AUTH_URL = f"{SCHEMA}://{HOST_NAME}:{WEBSERVER_PORT}/api/v1/authentications"
BASE_URL = f"{SCHEMA}://{HOST_NAME}:{WEBSERVER_PORT}/api/v1/recruitment"
TIMEOUT = 60.0

JD_FILE_PATH = os.path.join(BASE_DIR, "test_data", "jd_sample.json")
CV_FILE_PATH = os.path.join(BASE_DIR, "test_data", "sampleCV.pdf")