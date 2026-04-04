from __future__ import annotations

from httpx import ASGITransport, AsyncClient
import pytest
import sentry_sdk
from pydantic import ValidationError
from sentry_sdk.transport import Transport

from app.core.config import Settings, settings
from app.core.sentry import init_sentry, scrub_sentry_event
from app.core.secrets import SecretManager
from app.gateway.app import create_gateway_app


def test_settings_raises_on_missing_required_fields(monkeypatch):
    for key in ("SECRET_KEY", "DATABASE_URL", "JWT_SECRET_KEY"):
        monkeypatch.delenv(key, raising=False)

    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_sentry_scrubber_removes_sensitive_fields():
    event = {
        "request": {
            "data": {
                "password": "secret-password",
                "token": "Bearer abc",
                "api_key": "key",
                "amount": 5000,
                "health_payload": {"resting_hr": 42},
                "safe": "value",
            }
        }
    }

    scrubbed = scrub_sentry_event(event)

    assert scrubbed["request"]["data"]["password"] == "[REDACTED]"
    assert scrubbed["request"]["data"]["token"] == "[REDACTED]"
    assert scrubbed["request"]["data"]["api_key"] == "[REDACTED]"
    assert scrubbed["request"]["data"]["amount"] == "[REDACTED]"
    assert scrubbed["request"]["data"]["health_payload"] == "[REDACTED]"
    assert scrubbed["request"]["data"]["safe"] == "value"


def test_secret_manager_falls_back_to_env_var_when_aws_unavailable(monkeypatch):
    manager = SecretManager(ttl_seconds=1)
    monkeypatch.setattr(settings, "app_env", "production")
    monkeypatch.setattr(settings, "SENDGRID_API_KEY", "fallback-sendgrid-key")

    def _boom(*_args, **_kwargs):
        raise RuntimeError("aws unavailable")

    monkeypatch.setattr("boto3.client", _boom)
    assert manager.get("SENDGRID_API_KEY") == "fallback-sendgrid-key"


def test_env_test_overrides_are_applied_in_test_suite():
    assert settings.APP_ENV == "test"
    assert settings.CELERY_TASK_ALWAYS_EAGER is True
    assert settings.DATABASE_URL.startswith("sqlite+aiosqlite:///./test_dbs/")


@pytest.mark.asyncio
async def test_sentry_captures_test_endpoint_exception(monkeypatch):
    envelopes = []

    class TestTransport(Transport):
        def capture_envelope(self, envelope):
            envelopes.append(envelope)

    monkeypatch.setattr(settings, "SENTRY_DSN", "https://public@example.ingest.sentry.io/1")
    monkeypatch.setattr(settings, "app_env", "test")
    monkeypatch.setattr(settings, "debug", True)

    init_sentry(transport=TestTransport)
    app = create_gateway_app()
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/debug/sentry-test")

    sentry_sdk.flush()
    sentry_sdk.get_client().close(timeout=0)
    sentry_sdk.init(dsn=None)
    assert response.status_code == 500
    assert envelopes
