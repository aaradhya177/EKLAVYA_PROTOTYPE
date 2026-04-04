from __future__ import annotations

import time
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from sqlalchemy import text

from app.core import database
from app.core.celery_app import celery_app
from app.core.config import settings
from app.core.redis_client import get_redis_client
from app.files.storage import ObjectStorage
from app.injury.ml.predictor import InjuryMLPredictor
from app.ml.base import ModelRegistry

START_TIME = time.monotonic()


def _status_rank(status: str) -> int:
    return {"ok": 0, "degraded": 1, "down": 2}[status]


def _overall_status(statuses: list[str]) -> str:
    return max(statuses or ["ok"], key=_status_rank)


async def _database_check() -> dict[str, Any]:
    started = time.perf_counter()
    status = "ok"
    try:
        async with database.AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
    except Exception:
        status = "down"
    return {"status": status, "latency_ms": round((time.perf_counter() - started) * 1000, 2)}


def _redis_check() -> dict[str, Any]:
    started = time.perf_counter()
    status = "ok"
    try:
        get_redis_client().ping()
    except Exception:
        status = "degraded"
    return {"status": status, "latency_ms": round((time.perf_counter() - started) * 1000, 2)}


def _queue_depth() -> int:
    parsed = urlparse(settings.celery_broker_url)
    if parsed.scheme != "redis":
        return 0
    redis_client = get_redis_client()
    try:
        return int(redis_client.llen("celery"))
    except Exception:
        return 0


def _celery_check() -> dict[str, Any]:
    if settings.celery_task_always_eager or settings.celery_broker_url.startswith("memory://"):
        return {"status": "ok", "active_workers": 1, "queue_depth": 0}
    try:
        inspect = celery_app.control.inspect(timeout=1.0)
        pings = inspect.ping() or {}
        active_workers = len(pings)
        queue_depth = _queue_depth()
        return {
            "status": "ok" if active_workers > 0 else "degraded",
            "active_workers": active_workers,
            "queue_depth": queue_depth,
        }
    except Exception:
        return {"status": "degraded", "active_workers": 0, "queue_depth": 0}


async def _ml_models_check() -> dict[str, str]:
    predictor = InjuryMLPredictor()
    injury_status = "fallback"
    performance_status = "fallback"
    try:
        if await predictor.load_active_model() is not None:
            injury_status = "loaded"
    except Exception:
        pass
    try:
        record = await ModelRegistry().get_record("performance_projection")
        if record and Path(record.artifact_path).exists():
            performance_status = "loaded"
    except Exception:
        pass
    return {"injury": injury_status, "performance": performance_status}


def _storage_check() -> dict[str, str]:
    try:
        storage = ObjectStorage()
        if storage.is_s3 and storage.client:
            storage.client.list_buckets()
        else:
            Path(settings.file_storage_path).mkdir(parents=True, exist_ok=True)
        return {"status": "ok"}
    except Exception:
        return {"status": "error"}


async def build_health_payload() -> tuple[dict[str, Any], int]:
    database_check = await _database_check()
    redis_check = _redis_check()
    celery_check = _celery_check()
    ml_models = await _ml_models_check()
    storage_check = _storage_check()
    statuses = [
        "down" if database_check["status"] != "ok" else "ok",
        "degraded" if redis_check["status"] != "ok" else "ok",
        "degraded" if celery_check["status"] != "ok" else "ok",
        "degraded" if "fallback" in ml_models.values() else "ok",
        "degraded" if storage_check["status"] != "ok" else "ok",
    ]
    overall_status = _overall_status(statuses)
    status_code = 200 if overall_status == "ok" else 207 if overall_status == "degraded" else 503
    return (
        {
            "status": overall_status,
            "version": settings.app_version,
            "uptime_seconds": int(time.monotonic() - START_TIME),
            "checks": {
                "database": database_check,
                "redis": redis_check,
                "celery": celery_check,
                "ml_models": ml_models,
                "storage": storage_check,
            },
        },
        status_code,
    )
