from __future__ import annotations

import shutil
import tempfile
from io import BytesIO
from pathlib import Path
from uuid import UUID, uuid4

import fitz
from PIL import Image
from sqlalchemy import select

from app.auth.service import create_access_token
from app.core import database
from app.core.config import settings
from app.files.models import FileRecord, FileTag, FileUploadStatus
from app.files.storage import ObjectStorage
from app.files.tasks import process_file
from app.performance.models import SessionLog
from app.uadp.models import EventLog
from app.users.models import User

TEST_FILE_DIR = Path(tempfile.gettempdir()) / "athleteos-file-tests"
TEST_FILE_DIR.mkdir(exist_ok=True)


def _png_bytes(size: tuple[int, int] = (900, 500)) -> bytes:
    image = Image.new("RGB", size, color=(12, 120, 200))
    output = BytesIO()
    image.save(output, format="PNG")
    return output.getvalue()


def _pdf_bytes(text: str) -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((72, 72), text)
    payload = doc.tobytes()
    doc.close()
    return payload


async def test_presigned_url_generation_local_filesystem_mode(client, monkeypatch):
    storage_root = TEST_FILE_DIR / f"storage-{uuid4().hex}"
    monkeypatch.setattr(settings, "s3_endpoint_url", None)
    monkeypatch.setattr(settings, "file_storage_path", str(storage_root))

    athlete = (
        await client.post(
            "/api/v1/uadp/athletes/",
            json={
                "name": "File Athlete",
                "dob": "2003-01-01",
                "gender": "female",
                "sport_id": 1,
                "state": "Maharashtra",
                "tier": "state",
            },
        )
    ).json()["data"]

    response = await client.post(
        "/api/v1/files/upload-url",
        json={
            "athlete_id": athlete["id"],
            "file_type": "document",
            "filename": "training-plan.pdf",
            "mime_type": "application/pdf",
            "size_bytes": 2048,
            "access_level": "coach_visible",
        },
    )
    data = response.json()["data"]
    assert response.status_code == 200
    assert data["upload_url"].startswith("local://upload/")
    assert data["file_id"]

    shutil.rmtree(storage_root, ignore_errors=True)


async def test_upload_confirm_flow_updates_status_correctly(client, monkeypatch):
    storage_root = TEST_FILE_DIR / f"storage-{uuid4().hex}"
    monkeypatch.setattr(settings, "s3_endpoint_url", None)
    monkeypatch.setattr(settings, "file_storage_path", str(storage_root))

    athlete = (
        await client.post(
            "/api/v1/uadp/athletes/",
            json={
                "name": "Confirm Athlete",
                "dob": "2003-01-01",
                "gender": "male",
                "sport_id": 1,
                "state": "Punjab",
                "tier": "state",
            },
        )
    ).json()["data"]
    upload = (
        await client.post(
            "/api/v1/files/upload-url",
            json={
                "athlete_id": athlete["id"],
                "file_type": "document",
                "filename": "plan.pdf",
                "mime_type": "application/pdf",
                "size_bytes": 1024,
                "access_level": "private",
            },
        )
    ).json()["data"]
    async with database.AsyncSessionLocal() as session:
        record = await session.get(FileRecord, UUID(upload["file_id"]))
        ObjectStorage().upload(record.stored_key, _pdf_bytes("Training plan"), record.mime_type)

    response = await client.post(f"/api/v1/files/{upload['file_id']}/confirm")
    assert response.status_code == 200
    assert response.json()["data"]["upload_status"] == "ready"

    shutil.rmtree(storage_root, ignore_errors=True)


async def test_profile_photo_resize_task_produces_400x400_output(client, monkeypatch):
    storage_root = TEST_FILE_DIR / f"storage-{uuid4().hex}"
    monkeypatch.setattr(settings, "s3_endpoint_url", None)
    monkeypatch.setattr(settings, "file_storage_path", str(storage_root))

    athlete = (
        await client.post(
            "/api/v1/uadp/athletes/",
            json={
                "name": "Photo Athlete",
                "dob": "2004-01-01",
                "gender": "female",
                "sport_id": 1,
                "state": "Haryana",
                "tier": "grassroots",
            },
        )
    ).json()["data"]
    upload = (
        await client.post(
            "/api/v1/files/upload-url",
            json={
                "athlete_id": athlete["id"],
                "file_type": "profile_photo",
                "filename": "photo.png",
                "mime_type": "image/png",
                "size_bytes": len(_png_bytes()),
                "access_level": "public",
            },
        )
    ).json()["data"]

    async with database.AsyncSessionLocal() as session:
        record = await session.get(FileRecord, UUID(upload["file_id"]))
        ObjectStorage().upload(record.stored_key, _png_bytes(), record.mime_type)

    process_file.run(upload["file_id"])

    async with database.AsyncSessionLocal() as session:
        record = await session.get(FileRecord, UUID(upload["file_id"]))
        image = Image.open(BytesIO(ObjectStorage().download(record.stored_key)))
        assert image.size == (400, 400)
        assert record.upload_status == FileUploadStatus.ready

    shutil.rmtree(storage_root, ignore_errors=True)


async def test_pdf_preview_extraction(client, monkeypatch):
    storage_root = TEST_FILE_DIR / f"storage-{uuid4().hex}"
    monkeypatch.setattr(settings, "s3_endpoint_url", None)
    monkeypatch.setattr(settings, "file_storage_path", str(storage_root))

    athlete = (
        await client.post(
            "/api/v1/uadp/athletes/",
            json={
                "name": "PDF Athlete",
                "dob": "2002-01-01",
                "gender": "male",
                "sport_id": 1,
                "state": "Tamil Nadu",
                "tier": "national",
            },
        )
    ).json()["data"]
    upload = (
        await client.post(
            "/api/v1/files/upload-url",
            json={
                "athlete_id": athlete["id"],
                "file_type": "document",
                "filename": "doc.pdf",
                "mime_type": "application/pdf",
                "size_bytes": 4096,
                "access_level": "private",
            },
        )
    ).json()["data"]

    async with database.AsyncSessionLocal() as session:
        record = await session.get(FileRecord, UUID(upload["file_id"]))
        ObjectStorage().upload(record.stored_key, _pdf_bytes("This is a detailed report for review."), record.mime_type)

    process_file.run(upload["file_id"])

    async with database.AsyncSessionLocal() as session:
        record = await session.get(FileRecord, UUID(upload["file_id"]))
        assert "detailed report" in record.metadata_json["preview"].lower()

    shutil.rmtree(storage_root, ignore_errors=True)


async def test_injury_keyword_detection_auto_tags_file_and_emits_eventlog(client, monkeypatch):
    storage_root = TEST_FILE_DIR / f"storage-{uuid4().hex}"
    monkeypatch.setattr(settings, "s3_endpoint_url", None)
    monkeypatch.setattr(settings, "file_storage_path", str(storage_root))

    athlete = (
        await client.post(
            "/api/v1/uadp/athletes/",
            json={
                "name": "Medical Athlete",
                "dob": "2001-01-01",
                "gender": "female",
                "sport_id": 1,
                "state": "West Bengal",
                "tier": "state",
            },
        )
    ).json()["data"]
    upload = (
        await client.post(
            "/api/v1/files/upload-url",
            json={
                "athlete_id": athlete["id"],
                "file_type": "medical_report",
                "filename": "medical.pdf",
                "mime_type": "application/pdf",
                "size_bytes": 4096,
                "access_level": "private",
            },
        )
    ).json()["data"]

    async with database.AsyncSessionLocal() as session:
        record = await session.get(FileRecord, UUID(upload["file_id"]))
        ObjectStorage().upload(record.stored_key, _pdf_bytes("MRI shows ligament tear and strain."), record.mime_type)

    process_file.run(upload["file_id"])

    async with database.AsyncSessionLocal() as session:
        tags = list((await session.execute(select(FileTag).where(FileTag.file_id == UUID(upload["file_id"])))).scalars().all())
        event = (
            await session.execute(
                select(EventLog).where(
                    EventLog.athlete_id == UUID(athlete["id"]),
                    EventLog.event_type == "medical_document_uploaded",
                )
            )
        ).scalars().first()
        assert any(tag.tag == "injury_related" for tag in tags)
        assert event is not None

    shutil.rmtree(storage_root, ignore_errors=True)


async def test_access_control_coach_cannot_download_private_file_of_non_assigned_athlete(client, monkeypatch):
    storage_root = TEST_FILE_DIR / f"storage-{uuid4().hex}"
    monkeypatch.setattr(settings, "s3_endpoint_url", None)
    monkeypatch.setattr(settings, "file_storage_path", str(storage_root))

    athlete = (
        await client.post(
            "/api/v1/uadp/athletes/",
            json={
                "name": "Private Athlete",
                "dob": "2002-02-02",
                "gender": "male",
                "sport_id": 1,
                "state": "Punjab",
                "tier": "state",
            },
        )
    ).json()["data"]
    upload = (
        await client.post(
            "/api/v1/files/upload-url",
            json={
                "athlete_id": athlete["id"],
                "file_type": "document",
                "filename": "private.pdf",
                "mime_type": "application/pdf",
                "size_bytes": 1024,
                "access_level": "private",
            },
        )
    ).json()["data"]

    async with database.AsyncSessionLocal() as session:
        record = await session.get(FileRecord, UUID(upload["file_id"]))
        ObjectStorage().upload(record.stored_key, _pdf_bytes("Private document"), record.mime_type)
        coach = (await session.execute(select(User).where(User.email == "coach@example.com"))).scalars().first()
        assert coach is not None
        coach_token = create_access_token(coach)

    response = await client.get(
        f"/api/v1/files/{upload['file_id']}/download-url",
        headers={"Authorization": f"Bearer {coach_token}"},
    )
    assert response.status_code == 403

    shutil.rmtree(storage_root, ignore_errors=True)
