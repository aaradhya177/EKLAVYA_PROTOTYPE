from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import UUID

from sqlalchemy import select

from app.core import database
from app.injury.engine import RiskEngine
from app.injury.ml.predictor import InjuryMLPredictor
from app.injury.models import InjuryRecord, InjurySeverity, RiskScore
from app.injury.tasks import daily_risk_recompute
from app.performance.models import PerformanceIndex, SessionLog, SessionType
from app.uadp.models import Athlete, ConsentLedger, DataCategory, FeatureSnapshot, FeatureWindow
from app.users.models import User


async def _create_athlete(client, name: str) -> dict:
    response = await client.post(
        "/api/v1/uadp/athletes/",
        json={
            "name": name,
            "dob": "2000-01-01",
            "gender": "male",
            "sport_id": 1,
            "state": "Punjab",
            "tier": "national",
        },
    )
    return response.json()["data"]


async def _grant_health_consent(athlete_id: str):
    async with database.AsyncSessionLocal() as session:
        session.add(
            ConsentLedger(
                athlete_id=UUID(athlete_id),
                data_category=DataCategory.health,
                consented=True,
                consented_at=datetime.now(timezone.utc),
                revoked_at=None,
            )
        )
        await session.commit()


async def _first_user_id() -> UUID:
    async with database.AsyncSessionLocal() as session:
        return (await session.execute(select(User.id).order_by(User.name.asc()))).scalars().first()


async def test_rule_engine_covers_each_rule(client):
    athlete = await _create_athlete(client, "Risk Rule Athlete")
    athlete_id = UUID(athlete["id"])
    now = datetime.now(timezone.utc).replace(second=0, microsecond=0)
    coach_id = await _first_user_id()

    async with database.AsyncSessionLocal() as session:
        session.add_all(
            [
                PerformanceIndex(
                    athlete_id=athlete_id,
                    session_id=None,
                    index_name="acwr",
                    value=1.6,
                    percentile_in_sport=90.0,
                    computed_at=now,
                ),
                PerformanceIndex(
                    athlete_id=athlete_id,
                    session_id=None,
                    index_name="monotony",
                    value=2.1,
                    percentile_in_sport=80.0,
                    computed_at=now,
                ),
                InjuryRecord(
                    athlete_id=athlete_id,
                    body_part="hamstring",
                    injury_type="strain",
                    severity=InjurySeverity.moderate,
                    occurred_at=now - timedelta(days=30),
                    returned_at=None,
                    reported_by=coach_id,
                    notes="recent hamstring issue",
                ),
                FeatureSnapshot(
                    athlete_id=athlete_id,
                    feature_name="health.sleep_quality.avg",
                    value=4.2,
                    window=FeatureWindow.d7,
                    computed_at=now,
                ),
            ]
        )

        for days_ago in range(0, 7):
            session.add(
                SessionLog(
                    athlete_id=athlete_id,
                    sport_id=1,
                    session_type=SessionType.training,
                    start_time=now - timedelta(days=days_ago, minutes=60),
                    end_time=now - timedelta(days=days_ago),
                    rpe=8 if days_ago < 3 else 6,
                    notes="load",
                    raw_metrics={},
                    computed_metrics={},
                    coach_id=coach_id,
                )
            )

        await session.commit()

        evaluation = await RiskEngine(session).evaluate(athlete_id)

    factors = {item["factor"] for item in evaluation.contributing_factors}
    assert evaluation.score == 1.0
    assert evaluation.risk_level.value == "critical"
    assert "acwr_gt_1_5" in factors
    assert "monotony_gt_2" in factors
    assert "high_rpe_sessions_7d" in factors
    assert "prior_injury_same_body_part_90d" in factors
    assert "days_since_last_rest_day_gt_6" in factors
    assert "sleep_quality_lt_5" in factors


async def test_ml_predictor_falls_back_to_rule_engine_when_model_absent(client):
    athlete = await _create_athlete(client, "Fallback Athlete")
    athlete_id = UUID(athlete["id"])
    now = datetime.now(timezone.utc)

    async with database.AsyncSessionLocal() as session:
        session.add(
            PerformanceIndex(
                athlete_id=athlete_id,
                session_id=None,
                index_name="acwr",
                value=1.4,
                percentile_in_sport=50.0,
                computed_at=now,
            )
        )
        await session.commit()

        engine = RiskEngine(session)
        evaluation = await engine.evaluate(athlete_id)
        feature_vector = await engine.build_feature_vector(athlete_id)

    predictor = InjuryMLPredictor()
    predictor.load_model(Path("app/injury/ml/does_not_exist.pkl"))
    score = predictor.predict({**feature_vector, "_fallback_score": evaluation.score})
    assert score == evaluation.score


async def test_daily_scheduled_task_updates_risk_scores_table(client):
    athlete = await _create_athlete(client, "Scheduled Athlete")
    await _grant_health_consent(athlete["id"])
    athlete_id = UUID(athlete["id"])
    now = datetime.now(timezone.utc).replace(second=0, microsecond=0)
    coach_id = await _first_user_id()

    async with database.AsyncSessionLocal() as session:
        session.add(
            PerformanceIndex(
                athlete_id=athlete_id,
                session_id=None,
                index_name="acwr",
                value=1.45,
                percentile_in_sport=70.0,
                computed_at=now,
            )
        )
        session.add(
            SessionLog(
                athlete_id=athlete_id,
                sport_id=1,
                session_type=SessionType.training,
                start_time=now - timedelta(hours=2),
                end_time=now - timedelta(hours=1),
                rpe=8,
                notes="recent session",
                raw_metrics={},
                computed_metrics={},
                coach_id=coach_id,
            )
        )
        await session.commit()

    updated = daily_risk_recompute.run()
    assert updated == 1

    async with database.AsyncSessionLocal() as session:
        scores = list((await session.execute(select(RiskScore).where(RiskScore.athlete_id == athlete_id))).scalars().all())
    assert len(scores) == 1
    assert scores[0].score > 0
