from __future__ import annotations

from celery.schedules import crontab

from app.core import database
from app.core.celery_app import celery_app
from app.injury.service import compute_current_risk_score
from app.ml.train_injury import train_and_register_injury_model
from app.ml.train_performance import train_and_register_performance_models
from app.uadp.tasks import _run_sync


@celery_app.task(name="retrain_injury_model")
def retrain_injury_model() -> dict:
    return _run_sync(train_and_register_injury_model())


@celery_app.task(name="retrain_performance_models")
def retrain_performance_models() -> dict:
    return _run_sync(train_and_register_performance_models())


@celery_app.task(name="score_athlete_batch")
def score_athlete_batch(athlete_ids: list[str]) -> int:
    async def _inner() -> int:
        updated = 0
        async with database.AsyncSessionLocal() as session:
            for athlete_id in athlete_ids:
                await compute_current_risk_score(session, athlete_id)
                updated += 1
        return updated

    return _run_sync(_inner())


celery_app.conf.beat_schedule.update(
    {
        "weekly-retrain-injury-model": {
            "task": "retrain_injury_model",
            "schedule": crontab(hour=3, minute=0, day_of_week="sun"),
        },
        "weekly-retrain-performance-models": {
            "task": "retrain_performance_models",
            "schedule": crontab(hour=3, minute=30, day_of_week="sun"),
        },
    }
)
