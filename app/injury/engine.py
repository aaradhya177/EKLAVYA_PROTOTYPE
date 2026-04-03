from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import UUID

import yaml
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.injury.models import InjuryRecord, RiskLevel, RiskScore
from app.performance.models import PerformanceIndex, SessionLog
from app.uadp.models import Athlete, FeatureSnapshot, Sport


def _ensure_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class RiskEvaluation:
    score: float
    risk_level: RiskLevel
    contributing_factors: list[dict]
    model_version: str


class RiskEngine:
    def __init__(self, session: AsyncSession, config_path: str | Path | None = None):
        self.session = session
        self.config_path = Path(config_path or Path(__file__).parent / "config" / "risk_weights.yaml")
        self.config = yaml.safe_load(self.config_path.read_text(encoding="utf-8"))
        self.weights: dict[str, float] = self.config.get("weights", {})
        self.model_version: str = self.config.get("model_version", "rule_based_v1")

    async def _latest_performance_index(self, athlete_id: UUID, index_name: str) -> PerformanceIndex | None:
        stmt = (
            select(PerformanceIndex)
            .where(PerformanceIndex.athlete_id == athlete_id, PerformanceIndex.index_name == index_name)
            .order_by(PerformanceIndex.computed_at.desc(), PerformanceIndex.id.desc())
        )
        return (await self.session.execute(stmt)).scalars().first()

    async def _latest_sleep_quality(self, athlete_id: UUID) -> float | None:
        stmt = (
            select(FeatureSnapshot)
            .where(
                FeatureSnapshot.athlete_id == athlete_id,
                FeatureSnapshot.feature_name.like("%sleep_quality%"),
            )
            .order_by(FeatureSnapshot.computed_at.desc(), FeatureSnapshot.id.desc())
        )
        snapshot = (await self.session.execute(stmt)).scalars().first()
        return snapshot.value if snapshot else None

    async def _latest_feature_value(self, athlete_id: UUID, feature_name: str) -> float | None:
        stmt = (
            select(FeatureSnapshot)
            .where(
                FeatureSnapshot.athlete_id == athlete_id,
                FeatureSnapshot.feature_name == feature_name,
            )
            .order_by(FeatureSnapshot.computed_at.desc(), FeatureSnapshot.id.desc())
        )
        snapshot = (await self.session.execute(stmt)).scalars().first()
        return snapshot.value if snapshot else None

    async def _high_rpe_session_count(self, athlete_id: UUID, now: datetime) -> int:
        stmt = select(SessionLog).where(
            SessionLog.athlete_id == athlete_id,
            SessionLog.end_time.is_not(None),
            SessionLog.end_time >= now - timedelta(days=7),
            SessionLog.end_time <= now,
            SessionLog.rpe.is_not(None),
            SessionLog.rpe >= 8,
        )
        return len(list((await self.session.execute(stmt)).scalars().all()))

    async def _recent_injury(self, athlete_id: UUID, now: datetime) -> InjuryRecord | None:
        stmt = (
            select(InjuryRecord)
            .where(
                InjuryRecord.athlete_id == athlete_id,
                InjuryRecord.occurred_at >= now - timedelta(days=90),
            )
            .order_by(InjuryRecord.occurred_at.desc(), InjuryRecord.id.desc())
        )
        return (await self.session.execute(stmt)).scalars().first()

    async def _days_since_last_rest_day(self, athlete_id: UUID, now: datetime) -> int:
        stmt = select(SessionLog).where(
            SessionLog.athlete_id == athlete_id,
            SessionLog.end_time.is_not(None),
            SessionLog.end_time <= now,
            SessionLog.end_time >= now - timedelta(days=30),
        )
        sessions = list((await self.session.execute(stmt)).scalars().all())
        active_days = {_ensure_utc(item.end_time).date() for item in sessions if item.end_time is not None}
        for offset in range(0, 31):
            day = (now - timedelta(days=offset)).date()
            if day not in active_days:
                return offset
        return 31

    async def _avg_rpe(self, athlete_id: UUID, now: datetime, days: int) -> float:
        stmt = select(SessionLog).where(
            SessionLog.athlete_id == athlete_id,
            SessionLog.end_time.is_not(None),
            SessionLog.end_time >= now - timedelta(days=days),
            SessionLog.end_time <= now,
            SessionLog.rpe.is_not(None),
        )
        sessions = list((await self.session.execute(stmt)).scalars().all())
        if not sessions:
            return 0.0
        return sum(float(item.rpe or 0) for item in sessions) / len(sessions)

    async def _sessions_per_week(self, athlete_id: UUID, now: datetime) -> float:
        stmt = select(SessionLog).where(
            SessionLog.athlete_id == athlete_id,
            SessionLog.end_time.is_not(None),
            SessionLog.end_time >= now - timedelta(days=7),
            SessionLog.end_time <= now,
        )
        return float(len(list((await self.session.execute(stmt)).scalars().all())))

    def _risk_level(self, score: float) -> RiskLevel:
        if score < 0.3:
            return RiskLevel.low
        if score < 0.55:
            return RiskLevel.medium
        if score < 0.75:
            return RiskLevel.high
        return RiskLevel.critical

    async def build_feature_vector(self, athlete_id: UUID) -> dict:
        return await self.build_ml_feature_vector(athlete_id)

    async def build_ml_feature_vector(self, athlete_id: UUID) -> dict:
        athlete = await self.session.get(Athlete, athlete_id)
        if not athlete:
            raise ValueError("Athlete not found")

        now = _utcnow()
        sport = await self.session.get(Sport, athlete.sport_id)
        acwr = await self._latest_performance_index(athlete_id, "acwr")
        monotony = await self._latest_performance_index(athlete_id, "monotony")
        strain = await self._latest_performance_index(athlete_id, "strain")
        recent_injury = await self._recent_injury(athlete_id, now)
        return {
            "athlete_id": str(athlete_id),
            "sport": sport.name if sport else None,
            "tier": athlete.tier.value,
            "acwr": acwr.value if acwr else 0.0,
            "acwr_7d": acwr.value if acwr else 0.0,
            "acwr_28d": acwr.value if acwr else 0.0,
            "monotony": monotony.value if monotony else 0.0,
            "monotony_7d": monotony.value if monotony else 0.0,
            "strain_7d": strain.value if strain else 0.0,
            "high_rpe_sessions_7d": await self._high_rpe_session_count(athlete_id, now),
            "recent_injury_body_part": recent_injury.body_part if recent_injury else None,
            "prior_injury_90d": 1.0 if recent_injury else 0.0,
            "days_since_last_rest_day": await self._days_since_last_rest_day(athlete_id, now),
            "days_since_last_rest": float(await self._days_since_last_rest_day(athlete_id, now)),
            "sleep_quality": await self._latest_sleep_quality(athlete_id),
            "sleep_score_7d": float(await self._latest_sleep_quality(athlete_id) or 0.0),
            "avg_rpe_7d": await self._avg_rpe(athlete_id, now, 7),
            "avg_rpe_28d": await self._avg_rpe(athlete_id, now, 28),
            "sessions_per_week_7d": await self._sessions_per_week(athlete_id, now),
        }

    async def evaluate(self, athlete_id: UUID) -> RiskEvaluation:
        now = _utcnow()
        factors: list[dict] = []
        total = 0.0

        acwr = await self._latest_performance_index(athlete_id, "acwr")
        if acwr and acwr.value > 1.5:
            weight = self.weights["acwr_gt_1_5"]
            total += weight
            factors.append({"factor": "acwr_gt_1_5", "weight": weight, "value": acwr.value})
        elif acwr and acwr.value > 1.3:
            weight = self.weights["acwr_gt_1_3"]
            total += weight
            factors.append({"factor": "acwr_gt_1_3", "weight": weight, "value": acwr.value})

        monotony = await self._latest_performance_index(athlete_id, "monotony")
        if monotony and monotony.value > 2.0:
            weight = self.weights["monotony_gt_2"]
            total += weight
            factors.append({"factor": "monotony_gt_2", "weight": weight, "value": monotony.value})

        high_rpe_sessions = await self._high_rpe_session_count(athlete_id, now)
        if high_rpe_sessions >= 3:
            weight = self.weights["high_rpe_sessions_7d"]
            total += weight
            factors.append({"factor": "high_rpe_sessions_7d", "weight": weight, "value": high_rpe_sessions})

        recent_injury = await self._recent_injury(athlete_id, now)
        if recent_injury:
            weight = self.weights["prior_injury_same_body_part_90d"]
            total += weight
            factors.append(
                {
                    "factor": "prior_injury_same_body_part_90d",
                    "weight": weight,
                    "value": recent_injury.body_part,
                }
            )

        days_since_last_rest_day = await self._days_since_last_rest_day(athlete_id, now)
        if days_since_last_rest_day > 6:
            weight = self.weights["days_since_last_rest_day_gt_6"]
            total += weight
            factors.append(
                {
                    "factor": "days_since_last_rest_day_gt_6",
                    "weight": weight,
                    "value": days_since_last_rest_day,
                }
            )

        sleep_quality = await self._latest_sleep_quality(athlete_id)
        if sleep_quality is not None and sleep_quality < 5:
            weight = self.weights["sleep_quality_lt_5"]
            total += weight
            factors.append({"factor": "sleep_quality_lt_5", "weight": weight, "value": sleep_quality})

        score = min(max(total, 0.0), 1.0)
        return RiskEvaluation(
            score=score,
            risk_level=self._risk_level(score),
            contributing_factors=factors,
            model_version=self.model_version,
        )

    async def compute_risk(self, athlete_id: UUID) -> RiskScore:
        evaluation = await self.evaluate(athlete_id)
        risk_score = RiskScore(
            athlete_id=athlete_id,
            score=evaluation.score,
            risk_level=evaluation.risk_level,
            contributing_factors=evaluation.contributing_factors,
            computed_at=_utcnow(),
            model_version=evaluation.model_version,
        )
        self.session.add(risk_score)
        await self.session.commit()
        await self.session.refresh(risk_score)
        return risk_score
