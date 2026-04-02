from datetime import date, datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select

from app.career.models import TalentSignal
from app.career.tasks import weekly_talent_signal_detection
from app.core import database
from app.performance.models import PerformanceIndex
from app.users.models import User, UserRole


async def _create_athlete(client, name: str, tier: str = "national") -> dict:
    response = await client.post(
        "/athletes/",
        json={
            "name": name,
            "dob": "2002-03-10",
            "gender": "female",
            "sport_id": 1,
            "state": "Karnataka",
            "tier": tier,
        },
    )
    return response.json()["data"]


async def _coach_id() -> str:
    async with database.AsyncSessionLocal() as session:
        stmt = select(User.id).where(User.role == UserRole.coach).order_by(User.name.asc())
        return str((await session.execute(stmt)).scalars().first())


async def test_talent_signal_detection_with_fixture_performance_data(client):
    athlete = await _create_athlete(client, "Signal Athlete")
    athlete_id = UUID(athlete["id"])
    now = datetime.now(timezone.utc).replace(second=0, microsecond=0)

    async with database.AsyncSessionLocal() as session:
        session.add_all(
            [
                PerformanceIndex(
                    athlete_id=athlete_id,
                    session_id=None,
                    index_name="speed_index",
                    value=100.0,
                    percentile_in_sport=50.0,
                    computed_at=now - timedelta(days=42),
                ),
                PerformanceIndex(
                    athlete_id=athlete_id,
                    session_id=None,
                    index_name="speed_index",
                    value=120.0,
                    percentile_in_sport=92.0,
                    computed_at=now - timedelta(days=14),
                ),
            ]
        )
        await session.commit()

    created = weekly_talent_signal_detection.run()
    assert created >= 1

    signal_response = await client.get(f"/career/signals/{athlete['id']}")
    signal = signal_response.json()["data"]
    assert signal["signal_type"] == "breakthrough"
    assert signal["evidence"][0]["change_percent"] == 20.0


async def test_plan_date_overlap_validation(client):
    athlete = await _create_athlete(client, "Plan Overlap Athlete")
    coach_id = await _coach_id()

    await client.post(
        "/career/goals/",
        json={
            "athlete_id": athlete["id"],
            "goal_type": "peak_event",
            "target_date": "2026-08-30",
            "priority_event": "Asian Games 2026",
            "status": "active",
        },
    )

    response = await client.post(
        "/career/plans/",
        json={
            "athlete_id": athlete["id"],
            "coach_id": coach_id,
            "plan_period_start": "2026-07-01",
            "plan_period_end": "2026-08-30",
            "goals": [{"priority_event": "Asian Games 2026"}],
            "periodization_blocks": [
                {
                    "block_name": "Build",
                    "start_date": "2026-07-01",
                    "end_date": "2026-07-21",
                    "focus_areas": ["speed"],
                    "volume_target": 300,
                },
                {
                    "block_name": "Sharpen",
                    "start_date": "2026-07-15",
                    "end_date": "2026-08-01",
                    "focus_areas": ["race prep"],
                    "volume_target": 180,
                },
            ],
        },
    )

    assert response.status_code == 400
    assert response.json()["message"] == "Periodization block date ranges cannot overlap"


async def test_weekly_load_target_computation_from_periodization_blocks(client):
    athlete = await _create_athlete(client, "Plan Athlete")
    coach_id = await _coach_id()

    await client.post(
        "/career/goals/",
        json={
            "athlete_id": athlete["id"],
            "goal_type": "peak_event",
            "target_date": "2026-02-28",
            "priority_event": "National Championships",
            "status": "active",
        },
    )

    create_response = await client.post(
        "/career/plans/",
        json={
            "athlete_id": athlete["id"],
            "coach_id": coach_id,
            "plan_period_start": "2026-01-01",
            "plan_period_end": "2026-02-28",
            "goals": [{"priority_event": "National Championships"}],
            "periodization_blocks": [
                {
                    "block_name": "Build",
                    "start_date": "2026-01-01",
                    "end_date": "2026-01-28",
                    "focus_areas": ["strength", "aerobic"],
                    "volume_target": 280,
                }
            ],
        },
    )

    assert create_response.status_code == 200
    plan = create_response.json()["data"]
    block = plan["periodization_blocks"][0]
    weekly_targets = block["weekly_load_targets"]
    assert len(weekly_targets) == 4
    assert weekly_targets[0]["load_target"] == 70.0
    assert weekly_targets[-1]["end_date"] == "2026-01-28"
