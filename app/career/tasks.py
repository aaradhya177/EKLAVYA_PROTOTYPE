from celery.schedules import crontab

from app.career.service import TalentSignalDetector
from app.core import database
from app.core.celery_app import celery_app
from app.uadp.tasks import _run_sync


@celery_app.task(name="weekly_talent_signal_detection")
def weekly_talent_signal_detection() -> int:
    async def _inner() -> int:
        async with database.AsyncSessionLocal() as session:
            detector = TalentSignalDetector(session)
            return await detector.detect_all()

    return _run_sync(_inner())


celery_app.conf.beat_schedule.update(
    {
        "weekly-talent-signal-detection": {
            "task": "weekly_talent_signal_detection",
            "schedule": crontab(hour=2, minute=0, day_of_week="mon"),
        }
    }
)
