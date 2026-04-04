from celery.signals import task_failure, task_postrun

from celery import Celery

from app.core.config import settings
from app.gateway.metrics import track_celery_task

celery_app = Celery(
    "athleteos",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)
celery_app.conf.task_always_eager = settings.celery_task_always_eager
celery_app.conf.task_eager_propagates = True
celery_app.conf.timezone = "Asia/Kolkata"
celery_app.conf.beat_schedule = celery_app.conf.get("beat_schedule", {})


@task_postrun.connect
def _task_postrun_handler(task_id=None, task=None, state=None, **_kwargs):
    if task is not None:
        track_celery_task(task.name, (state or "success").lower())


@task_failure.connect
def _task_failure_handler(task_id=None, exception=None, sender=None, **_kwargs):
    task_name = getattr(sender, "name", "unknown")
    track_celery_task(task_name, "failure")


from app.backup import tasks as backup_tasks  # noqa: E402,F401
