from __future__ import annotations

import logging
import sys
from typing import Any

import structlog
from structlog.contextvars import bind_contextvars, clear_contextvars

from app.core.config import settings

SENSITIVE_KEYS = {
    "password",
    "hashed_password",
    "token",
    "access_token",
    "refresh_token",
    "authorization",
    "credentials",
    "amount",
    "salary",
    "income",
    "expense",
    "health",
    "health_data",
    "payload",
}


def _log_level() -> int:
    env = settings.app_env.lower()
    if env in {"production", "prod"}:
        return logging.WARNING
    if env in {"staging", "stage"}:
        return logging.INFO
    return logging.DEBUG


def _sanitize(value: Any) -> Any:
    if isinstance(value, dict):
        sanitized: dict[str, Any] = {}
        for key, item in value.items():
            lowered = key.lower()
            if lowered in SENSITIVE_KEYS or "token" in lowered or "password" in lowered or "authorization" in lowered:
                sanitized[key] = "[REDACTED]"
            elif lowered in {"amount", "income", "expense"}:
                sanitized[key] = "[REDACTED]"
            else:
                sanitized[key] = _sanitize(item)
        return sanitized
    if isinstance(value, list):
        return [_sanitize(item) for item in value]
    if isinstance(value, tuple):
        return tuple(_sanitize(item) for item in value)
    if isinstance(value, str):
        lowered = value.lower()
        if lowered.startswith("bearer ") or "eyj" in value:
            return "[REDACTED]"
    return value


def _sanitize_event(_: Any, __: str, event_dict: dict[str, Any]) -> dict[str, Any]:
    return {key: _sanitize(value) for key, value in event_dict.items()}


def _rename_event_key(_: Any, __: str, event_dict: dict[str, Any]) -> dict[str, Any]:
    if "event" in event_dict and "message" not in event_dict:
        event_dict["message"] = event_dict.pop("event")
    return event_dict


def configure_logging() -> None:
    timestamper = structlog.processors.TimeStamper(fmt="iso", key="timestamp")
    logging.basicConfig(format="%(message)s", stream=sys.stdout, level=_log_level(), force=True)
    logging.getLogger("aiosqlite").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.INFO)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            timestamper,
            _sanitize_event,
            _rename_event_key,
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str | None = None):
    return structlog.get_logger(name)


def reset_log_context() -> None:
    clear_contextvars()


def bind_log_context(**kwargs: Any) -> None:
    bind_contextvars(**{key: _sanitize(value) for key, value in kwargs.items() if value is not None})
