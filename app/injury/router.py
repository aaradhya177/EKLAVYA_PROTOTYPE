from uuid import UUID

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.core.auth import get_current_user, require_athlete_access, require_role
from app.core.database import get_db_session
from app.core.responses import success_response
from app.injury.schemas import InjuryAlertRead, InjuryRecordCreate, InjuryRecordRead, RiskScoreRead
from app.injury.service import (
    compute_current_risk_score,
    create_injury_record,
    ensure_health_consent,
    get_latest_risk_score,
    list_high_risk_athletes,
    list_injury_records,
)
from app.injury.tasks import compute_injury_risk
from app.users.models import UserRole

router = APIRouter(tags=["injury"])


@router.post("/records/")
async def log_injury_record(
    request: Request,
    payload: InjuryRecordCreate,
    session: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    await require_athlete_access(payload.athlete_id, session, current_user)
    record = await create_injury_record(session, payload)
    return success_response(InjuryRecordRead.model_validate(record).model_dump(mode="json"), "Injury recorded")


@router.get("/records/{athlete_id}")
async def injury_history(
    request: Request,
    athlete_id: UUID,
    session: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    await require_athlete_access(athlete_id, session, current_user)
    await ensure_health_consent(session, athlete_id)
    records = await list_injury_records(session, athlete_id)
    return success_response(
        [InjuryRecordRead.model_validate(record).model_dump(mode="json") for record in records],
        "Injury history fetched",
    )


@router.get("/risk/{athlete_id}")
async def current_risk(
    request: Request,
    athlete_id: UUID,
    session: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    await require_athlete_access(athlete_id, session, current_user)
    await ensure_health_consent(session, athlete_id)
    risk_score = await get_latest_risk_score(session, athlete_id)
    if risk_score is None:
        risk_score = await compute_current_risk_score(session, athlete_id)
    return success_response(RiskScoreRead.model_validate(risk_score).model_dump(mode="json"), "Risk score fetched")


@router.post("/risk/{athlete_id}/compute")
async def recompute_risk(
    request: Request,
    athlete_id: UUID,
    session: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    await require_athlete_access(athlete_id, session, current_user)
    await ensure_health_consent(session, athlete_id)
    compute_injury_risk.delay(str(athlete_id))
    return success_response({"athlete_id": str(athlete_id)}, "Risk recompute queued")


@router.get("/alerts/")
async def injury_alerts(
    request: Request,
    _: User = Depends(require_role(UserRole.federation_admin)),
    session: AsyncSession = Depends(get_db_session),
):
    alerts = await list_high_risk_athletes(session)
    return success_response(
        [InjuryAlertRead.model_validate(item).model_dump(mode="json") for item in alerts],
        "Injury alerts fetched",
    )
