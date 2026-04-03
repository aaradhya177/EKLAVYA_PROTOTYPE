from __future__ import annotations

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.core.auth import get_current_user
from app.core.database import get_db_session
from app.core.responses import success_response
from app.files.schemas import (
    DownloadUrlRead,
    FileConfirmResponse,
    FileRecordRead,
    FileStatusRead,
    FileTagUpdate,
    FileUploadRequest,
    FileUploadUrlResponse,
)
from app.files.service import (
    confirm_upload,
    get_download_url,
    get_status,
    list_files_for_athlete,
    list_tags,
    replace_tags,
    request_upload_url,
    soft_delete_file,
)
from app.files.tasks import process_file

router = APIRouter(tags=["files"])


async def _serialize_record(record, session: AsyncSession) -> dict:
    payload = FileRecordRead.model_validate(record).model_dump(mode="json", by_alias=False)
    payload["metadata"] = payload.pop("metadata_json")
    payload["tags"] = await list_tags(session, record.id)
    return payload


@router.post("/upload-url")
async def create_upload_url(
    request: Request,
    payload: FileUploadRequest,
    session: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    record, upload_url = await request_upload_url(session, current_user, payload)
    response = FileUploadUrlResponse(file_id=record.id, upload_url=upload_url)
    return success_response(response.model_dump(mode="json"), "Upload URL created")


@router.post("/{file_id}/confirm")
async def confirm_file_upload(
    request: Request,
    file_id: UUID,
    session: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    record = await confirm_upload(session, file_id, current_user)
    process_file.delay(str(file_id))
    response = FileConfirmResponse(file_id=record.id, upload_status=record.upload_status)
    return success_response(response.model_dump(mode="json"), "File upload confirmed")


@router.get("/{athlete_id}/")
async def list_athlete_files(
    request: Request,
    athlete_id: UUID,
    session: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    records = await list_files_for_athlete(session, athlete_id, current_user)
    return success_response([await _serialize_record(record, session) for record in records], "Files fetched")


@router.get("/{file_id}/download-url")
async def download_url(
    request: Request,
    file_id: UUID,
    session: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    url = await get_download_url(session, file_id, current_user)
    return success_response(DownloadUrlRead(file_id=file_id, download_url=url).model_dump(mode="json"), "Download URL created")


@router.delete("/{file_id}/")
async def delete_file(
    request: Request,
    file_id: UUID,
    session: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    record = await soft_delete_file(session, file_id, current_user)
    return success_response(await _serialize_record(record, session), "File deleted")


@router.put("/{file_id}/tags")
async def update_tags(
    request: Request,
    file_id: UUID,
    payload: FileTagUpdate,
    session: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    await replace_tags(session, file_id, current_user, payload)
    record = await get_status(session, file_id, current_user)
    return success_response(await _serialize_record(record, session), "File tags updated")


@router.get("/{file_id}/status")
async def file_status(
    request: Request,
    file_id: UUID,
    session: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    record = await get_status(session, file_id, current_user)
    response = FileStatusRead(file_id=record.id, upload_status=record.upload_status, metadata=record.metadata_json)
    return success_response(response.model_dump(mode="json"), "File status fetched")
