from fastapi import APIRouter, UploadFile
from typing import List
from models.response_models import APIResponse
from utils.file_handler import FileHandler

router = APIRouter()

@router.post("/upload/", response_model=APIResponse)
async def upload_file(files: List[UploadFile]):
    if not files:
        return {
            "data": None,
            "error": {"code": 400, "message": "No files provided for upload."},
        }

    try:
        uploaded_files = FileHandler.save_files(files)
        return {
            "data": {
                "message": "Files uploaded successfully.",
                "uploaded": uploaded_files,
            },
            "error": None,
        }
    except Exception as e:
        return {
            "data": None,
            "error": {"code": 500, "message": str(e)},
        }
