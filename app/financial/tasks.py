from uuid import UUID

from app.core import database
from app.core.celery_app import celery_app
from app.financial.service import compute_cashflow_forecast_records
from app.uadp.tasks import _run_sync


@celery_app.task(name="compute_cashflow_forecast")
def compute_cashflow_forecast(athlete_id: str, months_ahead: int = 12) -> int:
    async def _inner() -> int:
        async with database.AsyncSessionLocal() as session:
            rows = await compute_cashflow_forecast_records(session, UUID(athlete_id), months_ahead)
            return len(rows)

    return _run_sync(_inner())
