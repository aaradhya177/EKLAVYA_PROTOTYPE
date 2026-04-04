from __future__ import annotations

import ipaddress
import time
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, Request
from fastapi.responses import PlainTextResponse
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Gauge, Histogram, generate_latest
from prometheus_fastapi_instrumentator import Instrumentator
from sqlalchemy import func, select

from app.core import database
from app.injury.models import RiskLevel, RiskScore
from app.performance.models import SessionLog

instrumentator = Instrumentator(
    should_group_status_codes=False,
    should_ignore_untemplated=False,
    should_respect_env_var=False,
    excluded_handlers=["/metrics"],
)

active_athletes_total = Gauge(
    "active_athletes_total",
    "Count of athletes with a session in the last 7 days.",
)
injury_risk_critical_total = Gauge(
    "injury_risk_critical_total",
    "Count of athletes currently at critical injury risk.",
)
celery_tasks_total = Counter(
    "celery_tasks_total",
    "Total Celery task executions by status.",
    ["task_name", "status"],
)
ml_model_predictions_total = Counter(
    "ml_model_predictions_total",
    "Total ML model predictions.",
    ["model_name"],
)
ml_prediction_latency_seconds = Histogram(
    "ml_prediction_latency_seconds",
    "Latency of ML model predictions in seconds.",
    ["model_name"],
)
sessions_logged_today_total = Gauge("sessions_logged_today_total", "Sessions logged today.")


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _is_internal_host(host: str | None) -> bool:
    if not host:
        return False
    if host in {"testclient", "localhost"}:
        return True
    try:
        ip = ipaddress.ip_address(host)
        return bool(ip.is_private or ip.is_loopback)
    except ValueError:
        return host.endswith(".internal")


def require_internal_metrics_access(request: Request) -> None:
    client_host = request.client.host if request.client else None
    forwarded_for = request.headers.get("x-forwarded-for", "")
    forwarded_host = forwarded_for.split(",")[0].strip() if forwarded_for else None
    if _is_internal_host(client_host) or _is_internal_host(forwarded_host):
        return
    raise HTTPException(status_code=403, detail="Metrics endpoint is restricted to internal networks")


def observe_request_metrics(_request: Request, _status_code: int, _duration_seconds: float) -> None:
    return None


def track_ml_prediction(model_name: str, duration_seconds: float) -> None:
    ml_model_predictions_total.labels(model_name=model_name).inc()
    ml_prediction_latency_seconds.labels(model_name=model_name).observe(duration_seconds)


def track_celery_task(task_name: str, status: str) -> None:
    celery_tasks_total.labels(task_name=task_name, status=status).inc()


async def refresh_business_metrics() -> None:
    async with database.AsyncSessionLocal() as session:
        recent_threshold = _utcnow() - timedelta(days=7)
        active_count = await session.scalar(
            select(func.count(func.distinct(SessionLog.athlete_id))).where(
                SessionLog.end_time.is_not(None),
                SessionLog.end_time >= recent_threshold,
            )
        )
        critical_count = await session.scalar(
            select(func.count(RiskScore.id)).where(
                RiskScore.id.in_(select(func.max(RiskScore.id)).group_by(RiskScore.athlete_id)),
                RiskScore.risk_level == RiskLevel.critical,
            )
        )
        today_start = _utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        sessions_today = await session.scalar(select(func.count(SessionLog.id)).where(SessionLog.start_time >= today_start))

    active_athletes_total.set(int(active_count or 0))
    injury_risk_critical_total.set(int(critical_count or 0))
    sessions_logged_today_total.set(int(sessions_today or 0))


async def metrics_response(request: Request) -> PlainTextResponse:
    require_internal_metrics_access(request)
    await refresh_business_metrics()
    return PlainTextResponse(generate_latest().decode("utf-8"), media_type=CONTENT_TYPE_LATEST)


def setup_metrics(app) -> None:
    instrumentator.instrument(app)
    app.add_api_route("/metrics", metrics_response, methods=["GET"], include_in_schema=False)


def timed_prediction(model_name: str):
    class _Timer:
        def __enter__(self):
            self.started = time.perf_counter()
            return self

        def __exit__(self, *_args):
            track_ml_prediction(model_name, time.perf_counter() - self.started)

    return _Timer()
