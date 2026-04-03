from __future__ import annotations

import mimetypes
from io import BytesIO
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID, uuid4

import fitz
import yaml
from fastapi import HTTPException
from PIL import Image, ImageOps
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User, UserRole
from app.core.auth import require_athlete_access
from app.core.config import settings
from app.files.models import FileAccessLevel, FileRecord, FileTag, FileType, FileUploadStatus
from app.files.schemas import FileTagUpdate, FileUploadRequest
from app.files.storage import ObjectStorage
from app.notifications.models import Notification, NotificationChannel, NotificationPriority
from app.uadp.models import Athlete, EventLog, EventSource

MAX_FILE_BYTES = 100 * 1024 * 1024
ALLOWED_MIME_TYPES = {
    "video/mp4",
    "video/quicktime",
    "application/pdf",
    "text/plain",
    "image/jpeg",
    "image/png",
}


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _extension_for(filename: str) -> str:
    suffix = Path(filename).suffix.strip(".")
    return suffix or "bin"


def _key_for(athlete_id: UUID, file_type: FileType, filename: str) -> str:
    return f"{athlete_id}/{file_type.value}/{uuid4().hex}.{_extension_for(filename)}"


def _load_injury_keywords() -> list[str]:
    path = Path(settings.injury_keywords_config)
    if not path.exists():
        return []
    payload = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    return [str(item).lower() for item in payload.get("injury_keywords", [])]


async def _get_file_or_404(session: AsyncSession, file_id: UUID) -> FileRecord:
    record = await session.get(FileRecord, file_id)
    if record is None:
        raise HTTPException(status_code=404, detail="File not found")
    return record


async def _get_athlete_or_404(session: AsyncSession, athlete_id: UUID) -> Athlete:
    athlete = await session.get(Athlete, athlete_id)
    if athlete is None:
        raise HTTPException(status_code=404, detail="Athlete not found")
    return athlete


async def can_access_file(session: AsyncSession, record: FileRecord, current_user: User) -> bool:
    if current_user.role == UserRole.sys_admin:
        return True
    if record.uploader_id == current_user.id:
        return True
    if current_user.role == UserRole.athlete and current_user.athlete_id == record.athlete_id:
        return True
    if record.access_level == FileAccessLevel.public:
        return True
    if record.access_level == FileAccessLevel.private:
        return False
    if current_user.role == UserRole.coach:
        await require_athlete_access(record.athlete_id, session, current_user)
        return True
    if current_user.role == UserRole.federation_admin and record.access_level == FileAccessLevel.federation_visible:
        return True
    return False


async def can_manage_file(session: AsyncSession, record: FileRecord, current_user: User) -> bool:
    if current_user.role in {UserRole.sys_admin, UserRole.federation_admin}:
        return True
    if record.uploader_id == current_user.id:
        return True
    if current_user.role == UserRole.athlete and current_user.athlete_id == record.athlete_id:
        return True
    return False


async def request_upload_url(session: AsyncSession, current_user: User, payload: FileUploadRequest) -> tuple[FileRecord, str]:
    await _get_athlete_or_404(session, payload.athlete_id)
    await require_athlete_access(payload.athlete_id, session, current_user)
    if payload.mime_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported mime_type")
    if payload.size_bytes > MAX_FILE_BYTES:
        raise HTTPException(status_code=400, detail="File exceeds 100MB limit")

    key = _key_for(payload.athlete_id, payload.file_type, payload.filename)
    record = FileRecord(
        uploader_id=current_user.id,
        athlete_id=payload.athlete_id,
        file_type=payload.file_type,
        original_filename=payload.filename,
        stored_key=key,
        mime_type=payload.mime_type,
        size_bytes=payload.size_bytes,
        access_level=payload.access_level,
        upload_status=FileUploadStatus.pending,
        metadata_json={},
        created_at=_utcnow(),
    )
    session.add(record)
    await session.commit()
    await session.refresh(record)
    upload_url = ObjectStorage().generate_presigned_upload_url(key, payload.mime_type)
    return record, upload_url


async def confirm_upload(session: AsyncSession, file_id: UUID, current_user: User) -> FileRecord:
    record = await _get_file_or_404(session, file_id)
    if not await can_manage_file(session, record, current_user):
        raise HTTPException(status_code=403, detail="Cannot confirm this file")
    storage = ObjectStorage()
    if not storage.exists(record.stored_key):
        raise HTTPException(status_code=400, detail="Uploaded object not found")
    record.upload_status = FileUploadStatus.ready
    await session.commit()
    await session.refresh(record)
    return record


async def list_files_for_athlete(session: AsyncSession, athlete_id: UUID, current_user: User) -> list[FileRecord]:
    await _get_athlete_or_404(session, athlete_id)
    stmt = select(FileRecord).where(FileRecord.athlete_id == athlete_id).order_by(FileRecord.created_at.desc())
    rows = list((await session.execute(stmt)).scalars().all())
    return [row for row in rows if row.upload_status != FileUploadStatus.deleted and await can_access_file(session, row, current_user)]


async def get_download_url(session: AsyncSession, file_id: UUID, current_user: User) -> str:
    record = await _get_file_or_404(session, file_id)
    if not await can_access_file(session, record, current_user):
        raise HTTPException(status_code=403, detail="Cannot access this file")
    return ObjectStorage().generate_presigned_url(record.stored_key)


async def soft_delete_file(session: AsyncSession, file_id: UUID, current_user: User) -> FileRecord:
    record = await _get_file_or_404(session, file_id)
    if not await can_manage_file(session, record, current_user):
        raise HTTPException(status_code=403, detail="Cannot delete this file")
    record.upload_status = FileUploadStatus.deleted
    await session.commit()
    await session.refresh(record)
    return record


async def replace_tags(session: AsyncSession, file_id: UUID, current_user: User, payload: FileTagUpdate) -> list[FileTag]:
    record = await _get_file_or_404(session, file_id)
    if not await can_manage_file(session, record, current_user):
        raise HTTPException(status_code=403, detail="Cannot tag this file")
    await session.execute(delete(FileTag).where(FileTag.file_id == file_id))
    tags = []
    for tag in payload.tags:
        item = FileTag(file_id=file_id, tag=tag)
        session.add(item)
        tags.append(item)
    await session.commit()
    return tags


async def list_tags(session: AsyncSession, file_id: UUID) -> list[str]:
    stmt = select(FileTag).where(FileTag.file_id == file_id).order_by(FileTag.tag.asc())
    return [row.tag for row in (await session.execute(stmt)).scalars().all()]


async def get_status(session: AsyncSession, file_id: UUID, current_user: User) -> FileRecord:
    record = await _get_file_or_404(session, file_id)
    if not await can_access_file(session, record, current_user):
        raise HTTPException(status_code=403, detail="Cannot access this file")
    return record


async def process_profile_photo(session: AsyncSession, record: FileRecord) -> FileRecord:
    storage = ObjectStorage()
    image = Image.open(BytesIO(storage.download(record.stored_key)))
    resized = ImageOps.fit(image.convert("RGB"), (400, 400))
    output = BytesIO()
    resized.save(output, format="JPEG")
    new_key = f"{Path(record.stored_key).with_suffix('').as_posix()}_400x400.jpg"
    storage.upload(new_key, output.getvalue(), "image/jpeg")
    storage.delete(record.stored_key)
    record.stored_key = new_key
    record.mime_type = "image/jpeg"
    record.metadata_json = {**(record.metadata_json or {}), "resized": {"width": 400, "height": 400}}
    record.upload_status = FileUploadStatus.ready
    await session.commit()
    await session.refresh(record)
    return record


async def _upsert_tag(session: AsyncSession, file_id: UUID, tag: str) -> None:
    existing = (
        await session.execute(select(FileTag).where(FileTag.file_id == file_id, FileTag.tag == tag))
    ).scalars().first()
    if existing is None:
        session.add(FileTag(file_id=file_id, tag=tag))
        await session.flush()


def _ffprobe_metadata(local_path: Path) -> dict:
    command = [
        "ffprobe",
        "-v",
        "error",
        "-print_format",
        "json",
        "-show_streams",
        "-show_format",
        str(local_path),
    ]
    result = subprocess.run(command, capture_output=True, text=True, check=False)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "ffprobe failed")
    payload = json.loads(result.stdout)
    streams = payload.get("streams", [])
    video_stream = next((stream for stream in streams if stream.get("codec_type") == "video"), {})
    width = video_stream.get("width")
    height = video_stream.get("height")
    fps_raw = video_stream.get("r_frame_rate", "0/1")
    numerator, denominator = fps_raw.split("/")
    fps = float(numerator) / float(denominator) if float(denominator) else 0.0
    return {
        "duration_seconds": float(payload.get("format", {}).get("duration", 0.0)),
        "resolution": f"{width}x{height}" if width and height else None,
        "fps": round(fps, 2),
        "codec": video_stream.get("codec_name"),
    }


async def _notify_sys_admins(session: AsyncSession, title: str, body: str, metadata: dict) -> None:
    stmt = select(User).where(User.role == UserRole.sys_admin, User.is_active.is_(True))
    admins = list((await session.execute(stmt)).scalars().all())
    for admin in admins:
        session.add(
            Notification(
                recipient_id=admin.id,
                notification_type="FILE_MANUAL_REVIEW",
                title=title,
                body=body,
                channel=NotificationChannel.in_app,
                priority=NotificationPriority.high,
                is_read=False,
                sent_at=_utcnow(),
                created_at=_utcnow(),
                metadata_json=metadata,
            )
        )
    await session.flush()


async def process_video_file(session: AsyncSession, record: FileRecord) -> FileRecord:
    storage = ObjectStorage()
    metadata = dict(record.metadata_json or {})
    if storage.is_s3:
        local_bytes = storage.download(record.stored_key)
        local_path = Path(settings.file_storage_path) / "tmp_video_probe" / Path(record.stored_key).name
        local_path.parent.mkdir(parents=True, exist_ok=True)
        local_path.write_bytes(local_bytes)
    else:
        local_path = storage._local_path(record.stored_key)

    try:
        metadata.update(_ffprobe_metadata(local_path))
    except Exception as exc:
        metadata["ffprobe_error"] = str(exc)
    finally:
        if storage.is_s3 and local_path.exists():
            local_path.unlink()

    record.metadata_json = metadata
    duration = float(metadata.get("duration_seconds", 0.0) or 0.0)
    if duration > 300:
        record.upload_status = FileUploadStatus.flagged
        await _notify_sys_admins(
            session,
            "Video flagged for manual review",
            f"{record.original_filename} exceeds the 5 minute review threshold.",
            {"file_id": str(record.id), "athlete_id": str(record.athlete_id), "duration_seconds": duration},
        )
    else:
        record.upload_status = FileUploadStatus.ready
    await session.commit()
    await session.refresh(record)
    return record


async def process_document_file(session: AsyncSession, record: FileRecord) -> FileRecord:
    storage = ObjectStorage()
    metadata = dict(record.metadata_json or {})
    file_bytes = storage.download(record.stored_key)
    preview = ""
    if record.mime_type == "application/pdf" or record.original_filename.lower().endswith(".pdf"):
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        preview = "\n".join(page.get_text("text") for page in doc).strip()
        doc.close()
    else:
        preview = file_bytes.decode("utf-8", errors="ignore")
    metadata["preview"] = preview[:500]
    record.metadata_json = metadata

    if record.file_type == FileType.medical_report:
        lowered = preview.lower()
        if any(keyword in lowered for keyword in _load_injury_keywords()):
            await _upsert_tag(session, record.id, "injury_related")
            session.add(
                EventLog(
                    athlete_id=record.athlete_id,
                    event_type="medical_document_uploaded",
                    payload={
                        "data_category": "health",
                        "file_id": str(record.id),
                        "file_type": record.file_type.value,
                        "tags": ["injury_related"],
                    },
                    source=EventSource.api,
                    recorded_at=_utcnow(),
                )
            )
    record.upload_status = FileUploadStatus.ready
    await session.commit()
    await session.refresh(record)
    return record


async def process_file_record(session: AsyncSession, file_id: UUID) -> FileRecord:
    record = await _get_file_or_404(session, file_id)
    record.upload_status = FileUploadStatus.processing
    await session.commit()
    await session.refresh(record)
    try:
        if record.file_type == FileType.profile_photo:
            return await process_profile_photo(session, record)
        if record.file_type == FileType.video:
            return await process_video_file(session, record)
        if record.file_type in {FileType.medical_report, FileType.document, FileType.training_plan}:
            return await process_document_file(session, record)
        record.upload_status = FileUploadStatus.ready
        await session.commit()
        await session.refresh(record)
        return record
    except Exception as exc:
        record.upload_status = FileUploadStatus.failed
        record.metadata_json = {**(record.metadata_json or {}), "processing_error": str(exc)}
        await session.commit()
        await session.refresh(record)
        return record
