from io import BytesIO
import os
import shutil
import logging
from fastapi import APIRouter, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from config.constants import *
from services.process_file import ProcessFile

router = APIRouter()

logger = logging.getLogger(__file__)


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...), background_tasks: BackgroundTasks = BackgroundTasks()
):
    try:
        file_extension = file.filename.split(".")[-1].lower()
        if file_extension not in SUPPORT_FILE_EXTENSIONS:
            return JSONResponse(
                {"message": f"Don't support {file_extension}"}, status_code=400
            )
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)

        # Save the file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Run processing in the background
        background_tasks.add_task(ProcessFile.process_file, file_path, file_extension)
        return {
            "message": f"File {file.filename} is uploaded successfully",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
