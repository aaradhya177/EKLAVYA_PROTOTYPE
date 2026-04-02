from uuid import UUID

from celery.schedules import crontab

from app.core import database
from app.core.celery_app import celery_app
from app.injury.service import compute_current_risk_score, recompute_recent_active_athletes
from app.uadp.tasks import _run_sync


@celery_app.task(name="compute_injury_risk")
def compute_injury_risk(athlete_id: str) -> int:
    async def _inner() -> int:
        async with database.AsyncSessionLocal() as session:
            await compute_current_risk_score(session, UUID(athlete_id))
            return 1

    return _run_sync(_inner())


@celery_app.task(name="daily_risk_recompute")
def daily_risk_recompute() -> int:
    async def _inner() -> int:
        async with database.AsyncSessionLocal() as session:
            return await recompute_recent_active_athletes(session)

    return _run_sync(_inner())


celery_app.conf.beat_schedule.update(
    {
        "daily-risk-recompute-2am-ist": {
            "task": "daily_risk_recompute",
            "schedule": crontab(hour=2, minute=0),
        }
    }
)
