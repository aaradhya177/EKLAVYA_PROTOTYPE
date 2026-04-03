from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.files.models import FileAccessLevel, FileType, FileUploadStatus


class FileUploadRequest(BaseModel):
    athlete_id: UUID
    file_type: FileType
    filename: str
    mime_type: str
    size_bytes: int
    access_level: FileAccessLevel = FileAccessLevel.private


class FileUploadUrlResponse(BaseModel):
    file_id: UUID
    upload_url: str


class FileConfirmResponse(BaseModel):
    file_id: UUID
    upload_status: FileUploadStatus


class FileRecordRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    uploader_id: UUID
    athlete_id: UUID
    file_type: FileType
    original_filename: str
    stored_key: str
    mime_type: str
    size_bytes: int
    access_level: FileAccessLevel
    upload_status: FileUploadStatus
    metadata_json: dict[str, Any] = Field(alias="metadata")
    created_at: datetime
    tags: list[str] = Field(default_factory=list)


class FileTagUpdate(BaseModel):
    tags: list[str]


class FileStatusRead(BaseModel):
    file_id: UUID
    upload_status: FileUploadStatus
    metadata: dict[str, Any]


class DownloadUrlRead(BaseModel):
    file_id: UUID
    download_url: str
