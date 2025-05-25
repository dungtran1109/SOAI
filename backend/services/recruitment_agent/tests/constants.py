import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
AUTH_URL = "http://localhost:9090/api/v1/authentications"
BASE_URL = "http://localhost:8003/api/v1/recruitment"
TIMEOUT = 60.0

JD_FILE_PATH = os.path.join(BASE_DIR, "test_data", "jd_sample.json")
CV_FILE_PATH = os.path.join(BASE_DIR, "test_data", "sampleCV.pdf")