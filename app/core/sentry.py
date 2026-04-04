from __future__ import annotations

from typing import Any

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

from app.core.config import settings

SENSITIVE_FIELD_TOKENS = ("password", "token", "secret", "api_key", "amount", "health")


def _scrub(value: Any):
    if isinstance(value, dict):
        redacted: dict[str, Any] = {}
        for key, item in value.items():
            lowered = key.lower()
            if any(token in lowered for token in SENSITIVE_FIELD_TOKENS):
                redacted[key] = "[REDACTED]"
            else:
                redacted[key] = _scrub(item)
        return redacted
    if isinstance(value, list):
        return [_scrub(item) for item in value]
    if isinstance(value, tuple):
        return tuple(_scrub(item) for item in value)
    if isinstance(value, str) and (value.lower().startswith("bearer ") or "eyj" in value):
        return "[REDACTED]"
    return value


def scrub_sentry_event(event: dict[str, Any], _hint: dict[str, Any] | None = None) -> dict[str, Any]:
    return _scrub(event)


def init_sentry(*, transport=None) -> None:
    if not settings.SENTRY_DSN:
        return
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        traces_sample_rate=0.1,
        profiles_sample_rate=0.1,
        environment=settings.APP_ENV,
        release=settings.APP_VERSION,
        before_send=scrub_sentry_event,
        integrations=[FastApiIntegration()],
        transport=transport,
    )
