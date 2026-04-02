from uuid import UUID

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.core.auth import get_current_user
from app.core.database import get_db_session
from app.core.responses import success_response
from app.uadp.models import EventLog, EventSource

router = APIRouter(tags=["integrations"])


@router.post("/sai-sync")
async def sai_sync(
    request: Request,
    payload: dict,
    session: AsyncSession = Depends(get_db_session),
    _: User = Depends(get_current_user),
):
    athlete_id = payload.get("athlete_id")
    event = EventLog(
        athlete_id=UUID(athlete_id),
        event_type="integration.sai_sync",
        payload={"data_category": "performance", "raw_payload": payload},
        source=EventSource.api,
    )
    session.add(event)
    await session.commit()
    return JSONResponse(status_code=202, content=success_response(data=None, message="SAI payload accepted"))
