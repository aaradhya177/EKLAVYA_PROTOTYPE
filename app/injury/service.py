from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import distinct, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.injury.engine import RiskEngine
from app.injury.ml.predictor import InjuryMLPredictor
from app.injury.models import InjuryRecord, RiskLevel, RiskScore
from app.injury.schemas import InjuryRecordCreate
from app.performance.models import SessionLog
from app.uadp.models import Athlete
from app.uadp.service import has_active_consent


def _ensure_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


async def _get_athlete_or_404(session: AsyncSession, athlete_id: UUID) -> Athlete:
    athlete = await session.get(Athlete, athlete_id)
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")
    return athlete


async def ensure_health_consent(session: AsyncSession, athlete_id: UUID) -> None:
    if not await has_active_consent(session, athlete_id, "health"):
        raise HTTPException(status_code=451, detail="Data access restricted under DPDP Act")


async def create_injury_record(session: AsyncSession, payload: InjuryRecordCreate) -> InjuryRecord:
    await _get_athlete_or_404(session, payload.athlete_id)
    record = InjuryRecord(
        athlete_id=payload.athlete_id,
        body_part=payload.body_part,
        injury_type=payload.injury_type,
        severity=payload.severity,
        occurred_at=_ensure_utc(payload.occurred_at),
        returned_at=_ensure_utc(payload.returned_at) if payload.returned_at else None,
        reported_by=payload.reported_by,
        notes=payload.notes,
    )
    session.add(record)
    await session.commit()
    await session.refresh(record)
    return record


async def list_injury_records(session: AsyncSession, athlete_id: UUID) -> list[InjuryRecord]:
    await _get_athlete_or_404(session, athlete_id)
    stmt = (
        select(InjuryRecord)
        .where(InjuryRecord.athlete_id == athlete_id)
        .order_by(InjuryRecord.occurred_at.desc(), InjuryRecord.id.desc())
    )
    return list((await session.execute(stmt)).scalars().all())


async def get_latest_risk_score(session: AsyncSession, athlete_id: UUID) -> RiskScore | None:
    await _get_athlete_or_404(session, athlete_id)
    stmt = (
        select(RiskScore)
        .where(RiskScore.athlete_id == athlete_id)
        .order_by(RiskScore.computed_at.desc(), RiskScore.id.desc())
    )
    return (await session.execute(stmt)).scalars().first()


async def compute_current_risk_score(
    session: AsyncSession,
    athlete_id: UUID,
    model_path: str | Path | None = None,
) -> RiskScore:
    await _get_athlete_or_404(session, athlete_id)
    engine = RiskEngine(session)
    predictor = InjuryMLPredictor()
    predictor.load_model(model_path or Path(__file__).parent / "ml" / "injury_model.pkl")
    evaluation = await engine.evaluate(athlete_id)
    feature_vector = await engine.build_feature_vector(athlete_id)
    predicted_score = predictor.predict({**feature_vector, "_fallback_score": evaluation.score})
    score = min(max(float(predicted_score), 0.0), 1.0)

    risk_score = RiskScore(
        athlete_id=athlete_id,
        score=score,
        risk_level=evaluation.risk_level if predictor.model is None else engine._risk_level(score),
        contributing_factors=evaluation.contributing_factors,
        computed_at=_utcnow(),
        model_version=evaluation.model_version if predictor.model is None else "ml_model_v1",
    )
    session.add(risk_score)
    await session.commit()
    await session.refresh(risk_score)
    return risk_score


async def list_high_risk_athletes(session: AsyncSession) -> list[dict]:
    athletes = list((await session.execute(select(Athlete))).scalars().all())
    alerts: list[dict] = []
    for athlete in athletes:
        if not await has_active_consent(session, athlete.id, "health"):
            continue
        latest_score = await get_latest_risk_score(session, athlete.id)
        if latest_score is None or latest_score.risk_level not in {RiskLevel.high, RiskLevel.critical}:
            continue
        alerts.append(
            {
                "athlete_id": athlete.id,
                "athlete_name": athlete.name,
                "risk_score": latest_score.score,
                "risk_level": latest_score.risk_level,
                "computed_at": latest_score.computed_at,
            }
        )
    alerts.sort(key=lambda item: item["risk_score"], reverse=True)
    return alerts


async def recompute_recent_active_athletes(session: AsyncSession) -> int:
    now = _utcnow()
    stmt = select(distinct(SessionLog.athlete_id)).where(
        SessionLog.end_time.is_not(None),
        SessionLog.end_time >= now - timedelta(hours=48),
    )
    athlete_ids = [item for item in (await session.execute(stmt)).scalars().all()]
    updated = 0
    for athlete_id in athlete_ids:
        await compute_current_risk_score(session, athlete_id)
        updated += 1
    return updated
