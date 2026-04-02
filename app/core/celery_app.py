from celery.schedules import crontab

from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "athleteos",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)
celery_app.conf.task_always_eager = settings.celery_task_always_eager
celery_app.conf.task_eager_propagates = True
celery_app.conf.timezone = "Asia/Kolkata"
celery_app.conf.beat_schedule = celery_app.conf.get("beat_schedule", {})
