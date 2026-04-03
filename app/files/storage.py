from __future__ import annotations

import base64
from pathlib import Path

import boto3
from botocore.client import BaseClient

from app.core.config import settings


class ObjectStorage:
    def __init__(self):
        self.local_root = Path(settings.file_storage_path)
        self.local_root.mkdir(parents=True, exist_ok=True)
        self.bucket = settings.s3_bucket
        self.client: BaseClient | None = None
        if settings.s3_endpoint_url:
            self.client = boto3.client(
                "s3",
                endpoint_url=settings.s3_endpoint_url,
                aws_access_key_id=settings.s3_access_key_id,
                aws_secret_access_key=settings.s3_secret_access_key,
                region_name=settings.aws_region,
            )

    @property
    def is_s3(self) -> bool:
        return self.client is not None

    def _local_path(self, key: str) -> Path:
        path = self.local_root / key
        path.parent.mkdir(parents=True, exist_ok=True)
        return path

    def upload(self, key: str, file_bytes: bytes, content_type: str) -> str:
        if self.client:
            self.client.put_object(Bucket=self.bucket, Key=key, Body=file_bytes, ContentType=content_type)
            return f"{settings.s3_endpoint_url}/{self.bucket}/{key}"
        path = self._local_path(key)
        path.write_bytes(file_bytes)
        return path.as_uri()

    def download(self, key: str) -> bytes:
        if self.client:
            response = self.client.get_object(Bucket=self.bucket, Key=key)
            return response["Body"].read()
        path = self._local_path(key)
        return path.read_bytes()

    def delete(self, key: str) -> None:
        if self.client:
            self.client.delete_object(Bucket=self.bucket, Key=key)
            return
        path = self._local_path(key)
        if path.exists():
            path.unlink()

    def exists(self, key: str) -> bool:
        if self.client:
            try:
                self.client.head_object(Bucket=self.bucket, Key=key)
                return True
            except Exception:
                return False
        return self._local_path(key).exists()

    def generate_presigned_url(self, key: str, expires_in: int = 3600) -> str:
        if self.client:
            return self.client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket, "Key": key},
                ExpiresIn=expires_in,
            )
        token = base64.urlsafe_b64encode(key.encode("utf-8")).decode("utf-8")
        return f"local://download/{token}?expires_in={expires_in}"

    def generate_presigned_upload_url(self, key: str, content_type: str, expires_in: int = 3600) -> str:
        if self.client:
            return self.client.generate_presigned_url(
                "put_object",
                Params={"Bucket": self.bucket, "Key": key, "ContentType": content_type},
                ExpiresIn=expires_in,
            )
        token = base64.urlsafe_b64encode(key.encode("utf-8")).decode("utf-8")
        return f"local://upload/{token}?expires_in={expires_in}"
