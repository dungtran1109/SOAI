"""
Storage abstraction layer for CV file storage.
Supports MinIO S3 and local filesystem backends.
"""
import os
import shutil
import uuid
from abc import ABC, abstractmethod
from datetime import timedelta
from pathlib import Path
from typing import BinaryIO, Optional
from urllib.parse import urlparse

from minio import Minio
from minio.error import S3Error

from config.constants import (
    OBJECT_STORAGE_ENABLED,
    MINIO_ENDPOINT,
    MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY,
    MINIO_BUCKET_NAME,
    MINIO_SECURE,
    MINIO_PRESIGNED_URL_EXPIRY,
    MINIO_EXTERNAL_ENDPOINT,
    UPLOAD_DIR,
)
from config.log_config import AppLogger

logger = AppLogger(__name__)


class StorageBackend(ABC):
    """Abstract base class for storage backends."""

    @abstractmethod
    def upload(self, file_data: BinaryIO, object_name: str, content_type: str = "application/octet-stream") -> str:
        """
        Upload a file to storage.

        Args:
            file_data: File-like object to upload
            object_name: Name/path for the object in storage
            content_type: MIME type of the file

        Returns:
            Storage key for the uploaded object
        """
        pass

    @abstractmethod
    def download(self, object_name: str) -> bytes:
        """
        Download a file from storage.

        Args:
            object_name: Name/path of the object in storage

        Returns:
            File contents as bytes
        """
        pass

    @abstractmethod
    def download_to_file(self, object_name: str, file_path: str) -> None:
        """
        Download a file from storage to a local file.

        Args:
            object_name: Name/path of the object in storage
            file_path: Local path to save the file
        """
        pass

    @abstractmethod
    def get_presigned_url(self, object_name: str, expiry_seconds: int = None) -> str:
        """
        Generate a presigned URL for downloading a file.

        Args:
            object_name: Name/path of the object in storage
            expiry_seconds: URL expiry time in seconds (default from config)

        Returns:
            Presigned URL string
        """
        pass

    @abstractmethod
    def delete(self, object_name: str) -> bool:
        """
        Delete a file from storage.

        Args:
            object_name: Name/path of the object in storage

        Returns:
            True if deleted successfully
        """
        pass

    @abstractmethod
    def exists(self, object_name: str) -> bool:
        """
        Check if a file exists in storage.

        Args:
            object_name: Name/path of the object in storage

        Returns:
            True if the object exists
        """
        pass

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


class MinIOStorage(StorageBackend):
    """MinIO S3-compatible object storage backend."""

    def __init__(
        self,
        endpoint: str = MINIO_ENDPOINT,
        access_key: str = MINIO_ACCESS_KEY,
        secret_key: str = MINIO_SECRET_KEY,
        bucket_name: str = MINIO_BUCKET_NAME,
        secure: bool = MINIO_SECURE,
        external_endpoint: str = MINIO_EXTERNAL_ENDPOINT,
    ):
        self.bucket_name = bucket_name
        self.external_endpoint = external_endpoint
        self.client = Minio(
            endpoint,
            access_key=access_key,
            secret_key=secret_key,
            secure=secure,
        )
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self) -> None:
        """Create the bucket if it doesn't exist."""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                logger.info(f"Created MinIO bucket: {self.bucket_name}")
        except S3Error as e:
            logger.error(f"Failed to create bucket {self.bucket_name}: {e}")
            raise

    def upload(self, file_data: BinaryIO, object_name: str, content_type: str = "application/octet-stream") -> str:
        """Upload a file to MinIO."""
        try:
            # Get file size
            file_data.seek(0, 2)
            file_size = file_data.tell()
            file_data.seek(0)

            self.client.put_object(
                self.bucket_name,
                object_name,
                file_data,
                file_size,
                content_type=content_type,
            )
            logger.info(f"Uploaded file to MinIO: {object_name}")
            return object_name
        except S3Error as e:
            logger.error(f"Failed to upload to MinIO: {e}")
            raise

    def download(self, object_name: str) -> bytes:
        """Download a file from MinIO as bytes."""
        try:
            response = self.client.get_object(self.bucket_name, object_name)
            data = response.read()
            response.close()
            response.release_conn()
            return data
        except S3Error as e:
            logger.error(f"Failed to download from MinIO: {e}")
            raise

    def download_to_file(self, object_name: str, file_path: str) -> None:
        """Download a file from MinIO to a local file."""
        try:
            self.client.fget_object(self.bucket_name, object_name, file_path)
            logger.info(f"Downloaded file from MinIO to: {file_path}")
        except S3Error as e:
            logger.error(f"Failed to download from MinIO: {e}")
            raise

    def get_presigned_url(self, object_name: str, expiry_seconds: int = None) -> str:
        """Generate a presigned URL for downloading a file."""
        if expiry_seconds is None:
            expiry_seconds = MINIO_PRESIGNED_URL_EXPIRY

        try:
            url = self.client.presigned_get_object(
                self.bucket_name,
                object_name,
                expires=timedelta(seconds=expiry_seconds),
            )

            # If external endpoint is configured, replace the internal endpoint
            if self.external_endpoint:
                parsed = urlparse(url)
                # Replace host with external endpoint
                external_parsed = urlparse(f"http://{self.external_endpoint}")
                url = url.replace(
                    f"{parsed.scheme}://{parsed.netloc}",
                    f"{external_parsed.scheme}://{external_parsed.netloc}"
                )

            logger.debug(f"Generated presigned URL for: {object_name}")
            return url
        except S3Error as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            raise

    def delete(self, object_name: str) -> bool:
        """Delete a file from MinIO."""
        try:
            self.client.remove_object(self.bucket_name, object_name)
            logger.info(f"Deleted file from MinIO: {object_name}")
            return True
        except S3Error as e:
            logger.error(f"Failed to delete from MinIO: {e}")
            return False

    def exists(self, object_name: str) -> bool:
        """Check if a file exists in MinIO."""
        try:
            self.client.stat_object(self.bucket_name, object_name)
            return True
        except S3Error:
            return False


class LocalStorage(StorageBackend):
    """Local filesystem storage backend for backward compatibility."""

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

    def get_presigned_url(self, object_name: str, expiry_seconds: int = None) -> str:
        """
        For local storage, return a file:// URL or raise NotImplementedError.
        In production, this should be served through an API endpoint.
        """
        full_path = self._get_full_path(object_name)
        # Return the local path - the API layer should handle serving this
        return str(full_path)

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


# Singleton storage instance
_storage_instance: Optional[StorageBackend] = None


def get_storage() -> StorageBackend:
    """
    Factory function to get the configured storage backend.
    Returns a singleton instance.
    Uses OBJECT_STORAGE_ENABLED to determine MinIO (true) or local (false).
    """
    global _storage_instance

    if _storage_instance is None:
        if OBJECT_STORAGE_ENABLED:
            logger.info("Initializing MinIO storage backend (OBJECT_STORAGE_ENABLED=true)")
            _storage_instance = MinIOStorage()
        else:
            logger.info("Initializing local storage backend (OBJECT_STORAGE_ENABLED=false)")
            _storage_instance = LocalStorage()

    return _storage_instance


def is_object_storage_enabled() -> bool:
    """Check if object storage (MinIO) is enabled."""
    return OBJECT_STORAGE_ENABLED


def reset_storage() -> None:
    """Reset the storage singleton (useful for testing)."""
    global _storage_instance
    _storage_instance = None
