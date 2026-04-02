import re
from datetime import datetime
from uuid import UUID

from fastapi.responses import JSONResponse
from sqlalchemy import select
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.core import database
from app.core.responses import error_response
from app.uadp.models import EventLog, FeatureSnapshot
from app.uadp.service import has_active_consent

ATHLETE_RESOURCE_PATTERN = re.compile(r"^(/api/v1/uadp)?/athletes/(?P<athlete_id>[^/]+)/(events|features)$")
RESTRICTED_CATEGORIES = {"health", "financial"}


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


class ConsentEnforcementMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        match = ATHLETE_RESOURCE_PATTERN.match(request.url.path)
        if request.method == "GET" and match:
            try:
                athlete_id = UUID(match.group("athlete_id"))
            except ValueError:
                return await call_next(request)
            resource = match.group(2)
            category = request.query_params.get("data_category")

            async with database.AsyncSessionLocal() as session:
                blocked_categories: set[str] = set()
                if category in RESTRICTED_CATEGORIES:
                    blocked_categories.add(category)
                elif resource == "events":
                    event_type = request.query_params.get("type")
                    start_at = _parse_datetime(request.query_params.get("start_at"))
                    end_at = _parse_datetime(request.query_params.get("end_at"))
                    stmt = select(EventLog.payload).where(EventLog.athlete_id == athlete_id)
                    if event_type:
                        stmt = stmt.where(EventLog.event_type == event_type)
                    if start_at:
                        stmt = stmt.where(EventLog.recorded_at >= start_at)
                    if end_at:
                        stmt = stmt.where(EventLog.recorded_at <= end_at)
                    payloads = list((await session.execute(stmt)).scalars().all())
                    blocked_categories = {
                        payload.get("data_category")
                        for payload in payloads
                        if isinstance(payload, dict) and payload.get("data_category") in RESTRICTED_CATEGORIES
                    }
                else:
                    feature_names = list(
                        (
                            await session.execute(
                                select(FeatureSnapshot.feature_name).where(FeatureSnapshot.athlete_id == athlete_id)
                            )
                        )
                        .scalars()
                        .all()
                    )
                    blocked_categories = {
                        name.split(".", 1)[0]
                        for name in feature_names
                        if isinstance(name, str) and name.split(".", 1)[0] in RESTRICTED_CATEGORIES
                    }

                for restricted_category in blocked_categories:
                    if not await has_active_consent(session, athlete_id, restricted_category):
                        return JSONResponse(
                            status_code=451,
                            content=error_response(
                                "Data access restricted under DPDP Act",
                                data=None,
                            ),
                        )

        return await call_next(request)
