import os

CONSUL_HOST = os.getenv("CONSUL_HOST", "localhost")
SERVICE_NAME = os.getenv("SERVICE_NAME", "document-service")
SERVICE_PORT = int(os.getenv("SERVICE_PORT", 8002))

UPLOAD_FOLDER = "/uploads"
SUPPORT_FILE_EXTENSIONS = ["pdf", "docx", "txt", "csv"]