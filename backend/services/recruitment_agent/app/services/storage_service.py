"""
Storage service for CV file storage using local filesystem.
"""
import os
import shutil
import uuid
from pathlib import Path
from typing import BinaryIO, Optional

from config.constants import UPLOAD_DIR
from config.log_config import AppLogger

logger = AppLogger(__name__)


class LocalStorage:
    """Local filesystem storage for CV files."""

    def __init__(self, base_path: str = UPLOAD_DIR):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)

    def _get_full_path(self, object_name: str) -> Path:
        """Get the full local path for an object."""
        return self.base_path / object_name

    def upload(self, file_data: BinaryIO, object_name: str, content_type: str = "application/octet-stream") -> str:
        """Save a file to local filesystem."""
        full_path = self._get_full_path(object_name)
        full_path.parent.mkdir(parents=True, exist_ok=True)

        with open(full_path, "wb") as f:
            shutil.copyfileobj(file_data, f)

        logger.info(f"Saved file locally: {full_path}")
        return object_name

    def download(self, object_name: str) -> bytes:
        """Read a file from local filesystem."""
        full_path = self._get_full_path(object_name)
        with open(full_path, "rb") as f:
            return f.read()

    def download_to_file(self, object_name: str, file_path: str) -> None:
        """Copy a file from storage to another local path."""
        full_path = self._get_full_path(object_name)
        shutil.copy2(full_path, file_path)
        logger.info(f"Copied file to: {file_path}")

    def delete(self, object_name: str) -> bool:
        """Delete a file from local filesystem."""
        try:
            full_path = self._get_full_path(object_name)
            full_path.unlink()
            logger.info(f"Deleted local file: {full_path}")
            return True
        except FileNotFoundError:
            return False

    def exists(self, object_name: str) -> bool:
        """Check if a file exists locally."""
        return self._get_full_path(object_name).exists()

    @staticmethod
    def generate_storage_key(original_filename: str, prefix: str = "cvs") -> str:
        """
        Generate a unique storage key for a file.

        Args:
            original_filename: Original filename
            prefix: Directory prefix in storage

        Returns:
            Unique storage key
        """
        ext = Path(original_filename).suffix
        unique_id = str(uuid.uuid4())
        return f"{prefix}/{unique_id}{ext}"


# Singleton storage instance
_storage_instance: Optional[LocalStorage] = None


def get_storage() -> LocalStorage:
    """
    Get the local storage instance (singleton).
    """
    global _storage_instance

    if _storage_instance is None:
        logger.info("Initializing local storage backend")
        _storage_instance = LocalStorage()

    return _storage_instance


def reset_storage() -> None:
    """Reset the storage singleton (useful for testing)."""
    global _storage_instance
    _storage_instance = None
