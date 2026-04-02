from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.responses import error_response, success_response
from app.uadp.schemas import (
    AthleteCreate,
    AthleteRead,
    ConsentRead,
    ConsentUpsert,
    EventCreate,
    EventRead,
    FeatureSnapshotRead,
    PaginatedEvents,
)
from app.uadp.service import (
    create_event,
    get_athlete_or_404,
    list_consents,
    list_events,
    list_latest_features,
    register_athlete,
    upsert_consent,
)
from app.uadp.tasks import compute_feature_snapshots

router = APIRouter(tags=["uadp"])


@router.post("/athletes/")
async def create_athlete(payload: AthleteCreate, session: AsyncSession = Depends(get_db_session)):
    athlete = await register_athlete(session, payload)
    return success_response(AthleteRead.model_validate(athlete).model_dump(mode="json"), "Athlete registered")


@router.get("/athletes/{athlete_id}")
async def get_athlete(athlete_id: UUID, session: AsyncSession = Depends(get_db_session)):
    athlete = await get_athlete_or_404(session, athlete_id)
    return success_response(AthleteRead.model_validate(athlete).model_dump(mode="json"), "Athlete profile fetched")


@router.post("/athletes/{athlete_id}/events")
async def ingest_event(
    athlete_id: UUID,
    payload: EventCreate,
    session: AsyncSession = Depends(get_db_session),
):
    event = await create_event(session, athlete_id, payload)
    compute_feature_snapshots.delay(str(athlete_id))
    return success_response(EventRead.model_validate(event).model_dump(mode="json"), "Event ingested")


@router.get("/athletes/{athlete_id}/events")
async def get_events(
    athlete_id: UUID,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    type: str | None = None,
    start_at: datetime | None = None,
    end_at: datetime | None = None,
    data_category: str | None = Query(default=None),
    session: AsyncSession = Depends(get_db_session),
):
    events, total = await list_events(
        session,
        athlete_id,
        page=page,
        page_size=page_size,
        event_type=type,
        start_at=start_at,
        end_at=end_at,
        data_category=data_category,
    )
    response = PaginatedEvents(
        items=[EventRead.model_validate(event) for event in events],
        total=total,
        page=page,
        page_size=page_size,
    )
    return success_response(response.model_dump(mode="json"), "Event history fetched")


@router.get("/athletes/{athlete_id}/features")
async def get_features(
    athlete_id: UUID,
    data_category: str | None = Query(default=None),
    session: AsyncSession = Depends(get_db_session),
):
    features = await list_latest_features(session, athlete_id, data_category=data_category)
    return success_response(
        [FeatureSnapshotRead.model_validate(feature).model_dump(mode="json") for feature in features],
        "Feature snapshots fetched",
    )


@router.post("/consent/{athlete_id}")
async def save_consent(
    athlete_id: UUID,
    payload: ConsentUpsert,
    session: AsyncSession = Depends(get_db_session),
):
    record = await upsert_consent(session, athlete_id, payload)
    return success_response(ConsentRead.model_validate(record).model_dump(mode="json"), "Consent updated")


@router.get("/consent/{athlete_id}")
async def get_consent_records(athlete_id: UUID, session: AsyncSession = Depends(get_db_session)):
    consents = await list_consents(session, athlete_id)
    return success_response(
        [ConsentRead.model_validate(record).model_dump(mode="json") for record in consents],
        "Consent records fetched",
    )
