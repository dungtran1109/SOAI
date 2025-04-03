import os
from typing import List
from fastapi import UploadFile


class FileHandler:
    """Class to handle file upload operations."""

    upload_dir: str = "uploads"

    @classmethod
    def save_files(cls, files: List[UploadFile]) -> List[str]:
        """Save uploaded files to the specified directory."""
        if not os.path.exists(cls.upload_dir):
            os.makedirs(
                cls.upload_dir
            )  # Create the upload directory if it doesn't exist

        uploaded_files = []
        for file in files:
            file_path = os.path.join(cls.upload_dir, file.filename)
            with open(file_path, "wb") as f:
                f.write(file.file.read())
            uploaded_files.append(file_path)
        return uploaded_files
