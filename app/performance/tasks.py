from app.core.celery_app import celery_app
from app.core import database
from app.uadp.tasks import _run_sync

from app.performance.service import compute_session_indices


def _compute_indices(session_id: int) -> int:
    async def _inner() -> int:
        async with database.AsyncSessionLocal() as session:
            indices = await compute_session_indices(session, session_id)
            return len(indices)

    return _run_sync(_inner())


@celery_app.task(name="compute_performance_indices")
def compute_performance_indices(session_id: int) -> int:
    return _compute_indices(session_id)
