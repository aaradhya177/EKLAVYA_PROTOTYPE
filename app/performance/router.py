from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.responses import success_response
from app.performance.schemas import (
    AlertRead,
    PaginatedSessions,
    PerformanceIndexRead,
    SessionCreate,
    SessionMetricIngest,
    SessionRead,
)
from app.performance.service import (
    append_session_metrics,
    create_session,
    get_alerts,
    get_index_trend,
    list_sessions_for_athlete,
    recompute_session_computed_metrics,
    _get_session_or_404,
)
from app.performance.tasks import compute_performance_indices

router = APIRouter(tags=["performance"])


@router.post("/sessions/")
async def log_session(payload: SessionCreate, session: AsyncSession = Depends(get_db_session)):
    session_log = await create_session(session, payload)
    if session_log.end_time and session_log.rpe is not None:
        compute_performance_indices.delay(session_log.id)
    return success_response(SessionRead.model_validate(session_log).model_dump(mode="json"), "Session logged")


@router.get("/sessions/{athlete_id:uuid}")
async def list_sessions(
    athlete_id: UUID,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    session: AsyncSession = Depends(get_db_session),
):
    items, total = await list_sessions_for_athlete(session, athlete_id, page, page_size)
    payload = PaginatedSessions(
        items=[SessionRead.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )
    return success_response(payload.model_dump(mode="json"), "Sessions fetched")


@router.get("/sessions/{session_id:int}")
async def get_session_detail(session_id: int, session: AsyncSession = Depends(get_db_session)):
    session_log = await _get_session_or_404(session, session_id)
    return success_response(SessionRead.model_validate(session_log).model_dump(mode="json"), "Session fetched")


@router.post("/sessions/{session_id}/metrics")
async def push_session_metrics(
    session_id: int,
    payload: SessionMetricIngest,
    session: AsyncSession = Depends(get_db_session),
):
    session_log = await append_session_metrics(session, session_id, payload.metrics)
    session_log = await recompute_session_computed_metrics(session, session_log)
    if session_log.end_time and session_log.rpe is not None:
        compute_performance_indices.delay(session_log.id)
    return success_response(SessionRead.model_validate(session_log).model_dump(mode="json"), "Session metrics ingested")


@router.get("/performance/{athlete_id}/summary")
async def performance_summary(athlete_id: UUID, session: AsyncSession = Depends(get_db_session)):
    from app.performance.service import get_latest_indices

    items = await get_latest_indices(session, athlete_id)
    return success_response(
        [PerformanceIndexRead.model_validate(item).model_dump(mode="json") for item in items],
        "Performance summary fetched",
    )


@router.get("/performance/{athlete_id}/trend")
async def performance_trend(
    athlete_id: UUID,
    index_name: str,
    from_date: datetime | None = None,
    to_date: datetime | None = None,
    session: AsyncSession = Depends(get_db_session),
):
    items = await get_index_trend(session, athlete_id, index_name, from_date, to_date)
    return success_response(
        [PerformanceIndexRead.model_validate(item).model_dump(mode="json") for item in items],
        "Performance trend fetched",
    )


@router.get("/performance/{athlete_id}/alerts")
async def performance_alerts(athlete_id: UUID, session: AsyncSession = Depends(get_db_session)):
    alerts = await get_alerts(session, athlete_id)
    return success_response(
        [AlertRead.model_validate(item).model_dump(mode="json") for item in alerts],
        "Performance alerts fetched",
    )
