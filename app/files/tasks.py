from __future__ import annotations

from uuid import UUID

from app.core import database
from app.core.celery_app import celery_app
from app.files.service import process_file_record
from app.uadp.tasks import _run_sync


@celery_app.task(name="process_file")
def process_file(file_id: str) -> str:
    async def _inner() -> str:
        async with database.AsyncSessionLocal() as session:
            record = await process_file_record(session, UUID(file_id))
            return record.upload_status.value

    return _run_sync(_inner())
