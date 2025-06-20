import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
HOST_NAME = os.getenv("HOST_NAME", "localhost")
AUTH_URL = f"http://{HOST_NAME}:9090/api/v1/authentications"
BASE_URL = f"http://{HOST_NAME}:8003/api/v1/recruitment"
TIMEOUT = 60.0

JD_FILE_PATH = os.path.join(BASE_DIR, "test_data", "jd_sample.json")
CV_FILE_PATH = os.path.join(BASE_DIR, "test_data", "sampleCV.pdf")