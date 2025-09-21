from __future__ import annotations
from typing import Optional, Tuple, BinaryIO
from fastapi import HTTPException, UploadFile
import boto3
import logging
import uuid
import asyncio
from concurrent.futures import ThreadPoolExecutor
from botocore.config import Config
import mimetypes
from mypy_boto3_s3.client import S3Client
import os
from pathlib import Path
from io import BytesIO
from PIL import Image


class StorageConfig:
    def __init__(
        self,
        endpoint: str,
        access_key: str,
        secret_key: str,
        bucket_name: str,
        public_url: str,
        debug_url: str,
        region_name: Optional[str] = None,
    ) -> None:
        if not endpoint.startswith(("http://", "https://")):
            raise ValueError("Invalid endpoint URL. Must start with http:// or https://")
        self.endpoint = endpoint.rstrip("/")
        self.access_key = access_key
        self.secret_key = secret_key
        self.bucket_name = bucket_name
        self.public_url = public_url.rstrip("/")
        self.debug_url = debug_url.rstrip("/")
        self.region_name = region_name or "auto"


class StorageManager:
    """Manages file storage operations using S3-compatible storage"""

    def __init__(self, config: StorageConfig) -> None:
        self.logger = logging.getLogger(__name__)
        self.config = config
        self.s3_client: Optional[S3Client] = None
        self._upload_executor: ThreadPoolExecutor = ThreadPoolExecutor(
            max_workers=10, thread_name_prefix="s3-upload"
        )
        self._convertor_executor = ThreadPoolExecutor(max_workers=10)
        self._initialize_client()

    def _initialize_client(self) -> None:
        """Initialize the S3 client with optimized settings"""
        try:
            config = Config(
                retries={'max_attempts': 3, 'mode': 'adaptive'},
                max_pool_connections=50,
                connect_timeout=10,
                read_timeout=30
            )
            self.s3_client = boto3.client(
                "s3",
                endpoint_url=self.config.endpoint,
                aws_access_key_id=self.config.access_key,
                aws_secret_access_key=self.config.secret_key,
                region_name=self.config.region_name,
                config=config
            )  # type: ignore
        except Exception as e:
            self.logger.error(f"Failed to initialize S3 client: {str(e)}")
            self.s3_client = None

    async def upload_file(self, file: BytesIO, filename: str, prefix: str = "", unique_name: bool = True) -> Tuple[str, str, str, str]:
        """Upload a file to storage"""
        if not self.s3_client:
            raise HTTPException(status_code=500, detail="Storage not initialized")

        try:
            unique_filename = f"{prefix}/{uuid.uuid4()}-{filename}" if unique_name else f"{prefix}/{filename}"
            file.seek(0)
            await self._upload_fileobj(file, unique_filename)
            return (
                f"{self.config.public_url}/{unique_filename}",
                f"{self.config.endpoint}/{self.config.bucket_name}/{unique_filename}",
                f"{self.config.debug_url}/{unique_filename}",
                unique_filename
            )
        except Exception as e:
            self.logger.error(f"Failed to upload file: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to upload file")

    async def _upload_fileobj(self, file: BinaryIO, key: str) -> None:
        """Upload a file object to storage using a thread executor"""
        if not self.s3_client:
            raise HTTPException(status_code=500, detail="Storage not initialized")
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(self._upload_executor, self._sync_upload, file, key)

    def _sync_upload(self, file: BinaryIO, key: str) -> None:
        """Synchronous upload method"""
        if not self.s3_client:
            raise Exception("s3_client isn't initialized")
        try:
            self.s3_client.upload_fileobj(
                file,
                self.config.bucket_name,
                key,
                ExtraArgs={
                    'ContentType': self._get_content_type(key),
                    'ACL': 'public-read'
                }
            )
        except Exception as e:
            self.logger.error(f"S3 upload failed: {str(e)}")
            raise

    def _get_content_type(self, filename: str) -> str:
        """Determine content type using mimetypes"""
        content_type = mimetypes.guess_type(filename)[0]
        return content_type or 'application/octet-stream'

    async def delete_file(self, filename: str) -> None:
        """Delete a file from storage asynchronously"""
        if not self.s3_client:
            raise HTTPException(status_code=500, detail="Storage not initialized")
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(self._upload_executor, self._sync_delete, filename)

    def _sync_delete(self, filename: str) -> None:
        """Synchronous delete helper"""
        if not self.s3_client:
            raise Exception("s3_client isn't initialized")
        try:
            self.s3_client.delete_object(Bucket=self.config.bucket_name, Key=filename)
        except Exception as e:
            self.logger.error(f"Failed to delete file: {str(e)}")
            raise

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.s3_client:
            # Close S3 client if boto3 supports it
            try:
                self.s3_client.close()
            except AttributeError:
                pass
            self.s3_client = None
        self._upload_executor.shutdown(wait=True)

async def convert_to_webp(file: UploadFile) -> BytesIO:
    """Convert any uploaded image to WebP in memory"""
    try:
        image = Image.open(file.file)
        output = BytesIO()
        # save as lossy webp at quality 85 (tweak as you like)
        image.save(output, format="WEBP", quality=85)
        output.seek(0)
        return output
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image conversion failed: {e}")
    
# webp_bytes = await loop.run_in_executor(executor, convert_to_webp, file_path)