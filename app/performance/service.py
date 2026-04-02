from collections import defaultdict
from datetime import datetime, timedelta, timezone
from math import sqrt
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.performance.models import PerformanceIndex, SessionLog
from app.performance.schemas import MetricPoint, SessionCreate
from app.uadp.models import Athlete, AthleteTier, EventLog, EventSource
from app.users.models import User


def _ensure_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _duration_minutes(start_time: datetime, end_time: datetime | None) -> float:
    if not end_time:
        return 0.0
    seconds = (_ensure_utc(end_time) - _ensure_utc(start_time)).total_seconds()
    return max(seconds / 60.0, 0.0)


async def _get_athlete_or_404(session: AsyncSession, athlete_id: UUID) -> Athlete:
    athlete = await session.get(Athlete, athlete_id)
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")
    return athlete


async def _get_session_or_404(session: AsyncSession, session_id: int) -> SessionLog:
    session_log = await session.get(SessionLog, session_id)
    if not session_log:
        raise HTTPException(status_code=404, detail="Session not found")
    return session_log


async def create_session(session: AsyncSession, payload: SessionCreate) -> SessionLog:
    athlete = await _get_athlete_or_404(session, payload.athlete_id)
    if athlete.sport_id != payload.sport_id:
        raise HTTPException(status_code=400, detail="Sport mismatch for athlete")
    if payload.coach_id:
        coach = await session.get(User, payload.coach_id)
        if not coach:
            raise HTTPException(status_code=404, detail="Coach not found")

    session_log = SessionLog(
        athlete_id=payload.athlete_id,
        sport_id=payload.sport_id,
        session_type=payload.session_type,
        start_time=_ensure_utc(payload.start_time),
        end_time=_ensure_utc(payload.end_time) if payload.end_time else None,
        rpe=payload.rpe,
        notes=payload.notes,
        raw_metrics=payload.raw_metrics,
        computed_metrics=payload.computed_metrics,
        coach_id=payload.coach_id,
    )
    session.add(session_log)
    await session.commit()
    await session.refresh(session_log)
    return session_log


async def list_sessions_for_athlete(
    session: AsyncSession, athlete_id: UUID, page: int, page_size: int
) -> tuple[list[SessionLog], int]:
    await _get_athlete_or_404(session, athlete_id)
    stmt = select(SessionLog).where(SessionLog.athlete_id == athlete_id).order_by(SessionLog.start_time.desc())
    total = int(
        (
            await session.execute(
                select(func.count(SessionLog.id)).where(SessionLog.athlete_id == athlete_id)
            )
        ).scalar_one()
    )
    items = list((await session.execute(stmt)).scalars().all())
    offset = (page - 1) * page_size
    return items[offset : offset + page_size], total


async def append_session_metrics(
    session: AsyncSession, session_id: int, metric_points: list[MetricPoint]
) -> SessionLog:
    session_log = await _get_session_or_404(session, session_id)
    raw_metrics = dict(session_log.raw_metrics or {})
    wearable_metrics = list(raw_metrics.get("wearable_metrics", []))

    for point in metric_points:
        wearable_metrics.append(
            {
                "timestamp": _ensure_utc(point.timestamp).isoformat().replace("+00:00", "Z"),
                "metric_name": point.metric_name,
                "value": point.value,
            }
        )
        session.add(
            EventLog(
                athlete_id=session_log.athlete_id,
                event_type=f"session.metric.{point.metric_name}",
                payload={
                    "data_category": "performance",
                    "session_id": session_id,
                    "metric_name": point.metric_name,
                    "value": point.value,
                },
                source=EventSource.wearable,
                recorded_at=_ensure_utc(point.timestamp),
            )
        )

    raw_metrics["wearable_metrics"] = wearable_metrics
    session_log.raw_metrics = raw_metrics
    await session.commit()
    await session.refresh(session_log)
    return session_log


async def recompute_session_computed_metrics(session: AsyncSession, session_log: SessionLog) -> SessionLog:
    wearable_metrics = list((session_log.raw_metrics or {}).get("wearable_metrics", []))
    grouped: dict[str, list[float]] = defaultdict(list)
    for point in wearable_metrics:
        metric_name = point.get("metric_name")
        value = point.get("value")
        if isinstance(metric_name, str) and isinstance(value, (int, float)):
            grouped[metric_name].append(float(value))

    computed_metrics = dict(session_log.computed_metrics or {})
    for metric_name, values in grouped.items():
        computed_metrics[metric_name] = {
            "avg": sum(values) / len(values),
            "min": min(values),
            "max": max(values),
            "count": len(values),
        }
    session_log.computed_metrics = computed_metrics
    await session.commit()
    await session.refresh(session_log)
    return session_log


def _mean(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def _std(values: list[float]) -> float:
    if not values:
        return 0.0
    avg = _mean(values)
    variance = sum((value - avg) ** 2 for value in values) / len(values)
    return sqrt(variance)


def _percentile_rank(value: float, cohort: list[float]) -> float:
    if not cohort:
        return 100.0
    less_than = sum(1 for cohort_value in cohort if cohort_value < value)
    equal_to = sum(1 for cohort_value in cohort if cohort_value == value)
    return ((less_than + 0.5 * equal_to) / len(cohort)) * 100.0


async def compute_session_indices(session: AsyncSession, session_id: int) -> list[PerformanceIndex]:
    session_log = await _get_session_or_404(session, session_id)
    athlete = await _get_athlete_or_404(session, session_log.athlete_id)
    if not session_log.end_time or session_log.rpe is None:
        return []

    now = _ensure_utc(session_log.end_time)
    load_by_day: dict[datetime.date, float] = defaultdict(float)
    stmt = select(SessionLog).where(
        SessionLog.athlete_id == session_log.athlete_id,
        SessionLog.end_time.is_not(None),
        SessionLog.rpe.is_not(None),
        SessionLog.end_time <= now,
        SessionLog.end_time >= now - timedelta(days=28),
    )
    historical_sessions = list((await session.execute(stmt)).scalars().all())

    acute_load = 0.0
    for historical_session in historical_sessions:
        duration = _duration_minutes(historical_session.start_time, historical_session.end_time)
        session_load = float(historical_session.rpe or 0) * duration
        end_time = _ensure_utc(historical_session.end_time)
        load_by_day[end_time.date()] += session_load
        if end_time >= now - timedelta(days=7):
            acute_load += session_load

    chronic = sum(load_by_day.values()) / 4.0 if load_by_day else 0.0

    daily_loads = [
        load_by_day.get((now - timedelta(days=offset)).date(), 0.0)
        for offset in range(6, -1, -1)
    ]
    daily_mean = _mean(daily_loads)
    daily_std = _std(daily_loads)
    monotony = daily_mean / daily_std if daily_std else 0.0
    strain = monotony * sum(daily_loads)
    acwr = acute_load / chronic if chronic else 0.0

    results = {
        "acwr": acwr,
        "monotony": monotony,
        "strain": strain,
    }

    saved_indices: list[PerformanceIndex] = []
    for index_name, value in results.items():
        performance_index = PerformanceIndex(
            athlete_id=session_log.athlete_id,
            session_id=session_log.id,
            index_name=index_name,
            value=value,
            percentile_in_sport=0.0,
            computed_at=now,
        )
        session.add(performance_index)
        saved_indices.append(performance_index)

    await session.flush()

    for index_name in results:
        await refresh_percentiles_for_index(session, athlete.sport_id, athlete.tier, index_name)

    await session.commit()
    for index in saved_indices:
        await session.refresh(index)
    return saved_indices


async def refresh_percentiles_for_index(
    session: AsyncSession, sport_id: int, tier: AthleteTier, index_name: str
) -> None:
    latest_stmt = (
        select(PerformanceIndex)
        .join(Athlete, Athlete.id == PerformanceIndex.athlete_id)
        .where(
            Athlete.sport_id == sport_id,
            Athlete.tier == tier,
            PerformanceIndex.index_name == index_name,
        )
        .order_by(PerformanceIndex.athlete_id, PerformanceIndex.computed_at.desc(), PerformanceIndex.id.desc())
    )
    ordered = list((await session.execute(latest_stmt)).scalars().all())
    latest_by_athlete: dict[UUID, PerformanceIndex] = {}
    for item in ordered:
        latest_by_athlete.setdefault(item.athlete_id, item)

    cohort = list(latest_by_athlete.values())
    cohort_values = [item.value for item in cohort]
    for item in cohort:
        item.percentile_in_sport = _percentile_rank(item.value, cohort_values)


async def get_latest_indices(session: AsyncSession, athlete_id: UUID) -> list[PerformanceIndex]:
    await _get_athlete_or_404(session, athlete_id)
    stmt = select(PerformanceIndex).where(PerformanceIndex.athlete_id == athlete_id).order_by(
        PerformanceIndex.computed_at.desc(), PerformanceIndex.id.desc()
    )
    all_indices = list((await session.execute(stmt)).scalars().all())
    latest_by_name: dict[str, PerformanceIndex] = {}
    for item in all_indices:
        latest_by_name.setdefault(item.index_name, item)
    return list(latest_by_name.values())


async def get_index_trend(
    session: AsyncSession,
    athlete_id: UUID,
    index_name: str,
    from_date: datetime | None,
    to_date: datetime | None,
) -> list[PerformanceIndex]:
    await _get_athlete_or_404(session, athlete_id)
    stmt = select(PerformanceIndex).where(
        PerformanceIndex.athlete_id == athlete_id,
        PerformanceIndex.index_name == index_name,
    )
    if from_date:
        stmt = stmt.where(PerformanceIndex.computed_at >= _ensure_utc(from_date))
    if to_date:
        stmt = stmt.where(PerformanceIndex.computed_at <= _ensure_utc(to_date))
    stmt = stmt.order_by(PerformanceIndex.computed_at.asc(), PerformanceIndex.id.asc())
    return list((await session.execute(stmt)).scalars().all())


async def get_alerts(session: AsyncSession, athlete_id: UUID) -> list[dict]:
    alerts: list[dict] = []
    for index in await get_latest_indices(session, athlete_id):
        if index.index_name != "acwr":
            continue
        if index.value > 1.5:
            level = "red"
            threshold = "ACWR > 1.5"
        elif 1.3 <= index.value <= 1.5:
            level = "yellow"
            threshold = "1.3 <= ACWR <= 1.5"
        else:
            continue
        alerts.append(
            {
                "athlete_id": athlete_id,
                "index_name": index.index_name,
                "value": index.value,
                "level": level,
                "threshold": threshold,
                "computed_at": index.computed_at,
            }
        )
    return alerts
