from __future__ import annotations

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


json_type = JSON().with_variant(JSONB, "postgresql")


class FileType(str, enum.Enum):
    video = "video"
    medical_report = "medical_report"
    document = "document"
    profile_photo = "profile_photo"
    training_plan = "training_plan"


class FileAccessLevel(str, enum.Enum):
    private = "private"
    coach_visible = "coach_visible"
    federation_visible = "federation_visible"
    public = "public"


class FileUploadStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    ready = "ready"
    failed = "failed"
    flagged = "flagged"
    deleted = "deleted"


class FileRecord(Base):
    __tablename__ = "file_records"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    uploader_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    athlete_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("athletes.id"), nullable=False, index=True)
    file_type: Mapped[FileType] = mapped_column(Enum(FileType), nullable=False, index=True)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    stored_key: Mapped[str] = mapped_column(String(1024), nullable=False, unique=True)
    mime_type: Mapped[str] = mapped_column(String(255), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    access_level: Mapped[FileAccessLevel] = mapped_column(Enum(FileAccessLevel), nullable=False, default=FileAccessLevel.private)
    upload_status: Mapped[FileUploadStatus] = mapped_column(Enum(FileUploadStatus), nullable=False, default=FileUploadStatus.pending, index=True)
    metadata_json: Mapped[dict] = mapped_column("metadata", json_type, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow, index=True)


class FileTag(Base):
    __tablename__ = "file_tags"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    file_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("file_records.id"), nullable=False, index=True)
    tag: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
