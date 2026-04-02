import asyncio
from concurrent.futures import ThreadPoolExecutor
from uuid import UUID

from app.core import database
from app.core.celery_app import celery_app
from app.uadp.service import compute_feature_snapshots_for_athlete


def _run_sync(coro):
    try:
        asyncio.get_running_loop()
    except RuntimeError:
        return asyncio.run(coro)

    with ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(asyncio.run, coro)
        return future.result()


@celery_app.task(name="compute_feature_snapshots")
def compute_feature_snapshots(athlete_id: str) -> int:
    return _run_sync(
        compute_feature_snapshots_for_athlete(UUID(athlete_id), database.AsyncSessionLocal)
    )
