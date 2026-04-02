from collections import defaultdict
from collections.abc import Iterable
from datetime import datetime, timedelta, timezone
from numbers import Number
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.uadp.models import Athlete, ConsentLedger, DataCategory, EventLog, FeatureSnapshot, FeatureWindow, Sport
from app.uadp.schemas import AthleteCreate, ConsentUpsert, EventCreate


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _ensure_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _flatten_numeric_payload(payload: dict, prefix: str = "") -> Iterable[tuple[str, float]]:
    for key, value in payload.items():
        current_key = f"{prefix}.{key}" if prefix else key
        if isinstance(value, bool):
            continue
        if isinstance(value, Number):
            yield current_key, float(value)
        elif isinstance(value, dict):
            yield from _flatten_numeric_payload(value, current_key)


def _feature_window_delta(window: FeatureWindow) -> timedelta:
    return {
        FeatureWindow.d7: timedelta(days=7),
        FeatureWindow.d28: timedelta(days=28),
        FeatureWindow.d90: timedelta(days=90),
    }[window]


async def register_athlete(session: AsyncSession, payload: AthleteCreate) -> Athlete:
    sport = await session.get(Sport, payload.sport_id)
    if not sport:
        raise HTTPException(status_code=404, detail="Sport not found")

    athlete = Athlete(**payload.model_dump())
    session.add(athlete)
    await session.commit()
    await session.refresh(athlete)
    return athlete


async def get_athlete_or_404(session: AsyncSession, athlete_id: UUID) -> Athlete:
    athlete = await session.get(Athlete, athlete_id)
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")
    return athlete


async def create_event(session: AsyncSession, athlete_id: UUID, payload: EventCreate) -> EventLog:
    await get_athlete_or_404(session, athlete_id)
    event = EventLog(
        athlete_id=athlete_id,
        event_type=payload.event_type,
        payload=payload.payload,
        source=payload.source,
        recorded_at=_ensure_utc(payload.recorded_at) if payload.recorded_at else _utcnow(),
    )
    session.add(event)
    await session.commit()
    await session.refresh(event)
    return event


async def list_events(
    session: AsyncSession,
    athlete_id: UUID,
    page: int = 1,
    page_size: int = 50,
    event_type: str | None = None,
    start_at: datetime | None = None,
    end_at: datetime | None = None,
    data_category: str | None = None,
) -> tuple[list[EventLog], int]:
    await get_athlete_or_404(session, athlete_id)
    stmt = select(EventLog).where(EventLog.athlete_id == athlete_id)
    count_stmt = select(func.count(EventLog.id)).where(EventLog.athlete_id == athlete_id)

    if event_type:
        stmt = stmt.where(EventLog.event_type == event_type)
        count_stmt = count_stmt.where(EventLog.event_type == event_type)
    if start_at:
        stmt = stmt.where(EventLog.recorded_at >= start_at)
        count_stmt = count_stmt.where(EventLog.recorded_at >= start_at)
    if end_at:
        stmt = stmt.where(EventLog.recorded_at <= end_at)
        count_stmt = count_stmt.where(EventLog.recorded_at <= end_at)

    stmt = stmt.order_by(EventLog.recorded_at.desc())
    events = list((await session.execute(stmt)).scalars().all())
    if data_category:
        events = [
            event
            for event in events
            if isinstance(event.payload, dict) and event.payload.get("data_category") == data_category
        ]
        total = len(events)
    else:
        total = int((await session.execute(count_stmt)).scalar_one())

    offset = (page - 1) * page_size
    return events[offset : offset + page_size], total


async def upsert_consent(session: AsyncSession, athlete_id: UUID, payload: ConsentUpsert) -> ConsentLedger:
    await get_athlete_or_404(session, athlete_id)
    stmt = select(ConsentLedger).where(
        ConsentLedger.athlete_id == athlete_id,
        ConsentLedger.data_category == payload.data_category,
    )
    record = (await session.execute(stmt)).scalar_one_or_none()
    now = _utcnow()

    if record:
        record.consented = payload.consented
        record.consented_at = now if payload.consented else record.consented_at
        record.revoked_at = None if payload.consented else now
    else:
        record = ConsentLedger(
            athlete_id=athlete_id,
            data_category=payload.data_category,
            consented=payload.consented,
            consented_at=now if payload.consented else None,
            revoked_at=None if payload.consented else now,
        )
        session.add(record)

    await session.commit()
    await session.refresh(record)
    return record


async def list_consents(session: AsyncSession, athlete_id: UUID) -> list[ConsentLedger]:
    await get_athlete_or_404(session, athlete_id)
    stmt = (
        select(ConsentLedger)
        .where(ConsentLedger.athlete_id == athlete_id)
        .order_by(ConsentLedger.data_category.asc())
    )
    return list((await session.execute(stmt)).scalars().all())


async def has_active_consent(session: AsyncSession, athlete_id: UUID, data_category: str) -> bool:
    stmt = select(ConsentLedger).where(
        ConsentLedger.athlete_id == athlete_id,
        ConsentLedger.data_category == DataCategory(data_category),
    )
    record = (await session.execute(stmt)).scalar_one_or_none()
    return bool(record and record.consented and record.revoked_at is None)


async def list_latest_features(
    session: AsyncSession,
    athlete_id: UUID,
    data_category: str | None = None,
) -> list[FeatureSnapshot]:
    await get_athlete_or_404(session, athlete_id)
    stmt = select(FeatureSnapshot).where(FeatureSnapshot.athlete_id == athlete_id)
    snapshots = list((await session.execute(stmt.order_by(FeatureSnapshot.computed_at.desc()))).scalars().all())
    latest_by_key: dict[tuple[str, FeatureWindow], FeatureSnapshot] = {}
    for snapshot in snapshots:
        if data_category and not snapshot.feature_name.startswith(f"{data_category}."):
            continue
        key = (snapshot.feature_name, snapshot.window)
        latest_by_key.setdefault(key, snapshot)
    return list(latest_by_key.values())


async def compute_feature_snapshots_for_athlete(
    athlete_id: UUID,
    session_factory: async_sessionmaker[AsyncSession],
) -> int:
    numeric_events_by_window: dict[FeatureWindow, dict[str, list[float]]] = {
        window: defaultdict(list) for window in FeatureWindow
    }
    now = _utcnow()

    async with session_factory() as session:
        await get_athlete_or_404(session, athlete_id)
        events = list(
            (
                await session.execute(
                    select(EventLog).where(EventLog.athlete_id == athlete_id).order_by(EventLog.recorded_at.desc())
                )
            )
            .scalars()
            .all()
        )

        for event in events:
            payload = event.payload if isinstance(event.payload, dict) else {}
            category = payload.get("data_category", "performance")
            recorded_at = _ensure_utc(event.recorded_at)
            for window in FeatureWindow:
                if recorded_at < now - _feature_window_delta(window):
                    continue
                for field_name, value in _flatten_numeric_payload(payload):
                    if field_name == "data_category":
                        continue
                    feature_name = f"{category}.{field_name}.avg"
                    numeric_events_by_window[window][feature_name].append(value)

        upserts = 0
        for window, features in numeric_events_by_window.items():
            for feature_name, values in features.items():
                if not values:
                    continue
                avg_value = sum(values) / len(values)
                stmt = select(FeatureSnapshot).where(
                    FeatureSnapshot.athlete_id == athlete_id,
                    FeatureSnapshot.feature_name == feature_name,
                    FeatureSnapshot.window == window,
                )
                snapshot = (await session.execute(stmt)).scalar_one_or_none()
                if snapshot:
                    snapshot.value = avg_value
                    snapshot.computed_at = now
                else:
                    snapshot = FeatureSnapshot(
                        athlete_id=athlete_id,
                        feature_name=feature_name,
                        value=avg_value,
                        window=window,
                        computed_at=now,
                    )
                    session.add(snapshot)
                upserts += 1

        await session.commit()
        return upserts
