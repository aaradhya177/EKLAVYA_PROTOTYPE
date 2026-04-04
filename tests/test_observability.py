import json

import httpx
import pytest
from prometheus_client.parser import text_string_to_metric_families

from app.core.logging import configure_logging
from app.core.redis_client import reset_redis_client
from infra.monitoring.dashboard_loader import load_dashboard_payloads, validate_dashboards


@pytest.mark.asyncio
async def test_metrics_endpoint_returns_prometheus_format(client):
    response = await client.get("/metrics")
    assert response.status_code == 200
    text = response.text
    assert "http_requests_total" in text
    assert "active_athletes_total" in text
    families = list(text_string_to_metric_families(text))
    assert any(family.name.startswith("http_requests") for family in families)


@pytest.mark.asyncio
async def test_health_returns_degraded_when_redis_is_down(raw_client, monkeypatch):
    class DownRedis:
        def ping(self):
            raise RuntimeError("redis unavailable")

        def incr(self, *_args, **_kwargs):
            raise RuntimeError("redis unavailable")

        def ttl(self, *_args, **_kwargs):
            raise RuntimeError("redis unavailable")

    monkeypatch.setattr("app.gateway.health.get_redis_client", lambda: DownRedis())
    monkeypatch.setattr("app.gateway.app.get_redis_client", lambda: DownRedis())
    reset_redis_client()

    response = await raw_client.get("/health")
    payload = response.json()
    assert response.status_code == 207
    assert payload["status"] == "degraded"
    assert payload["checks"]["redis"]["status"] == "degraded"


@pytest.mark.asyncio
async def test_structured_logs_include_request_id_and_exclude_tokens(raw_client, capsys):
    configure_logging()
    token = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret"

    await raw_client.get("/health", headers={"Authorization": token, "X-Request-ID": "req-123"})
    captured = capsys.readouterr().out

    assert "req-123" in captured
    assert token not in captured
    assert '"event": "request_completed"' in captured or '"message": "request_completed"' in captured


@pytest.mark.asyncio
async def test_grafana_dashboards_load_without_errors_via_http_api():
    payloads = load_dashboard_payloads()
    assert payloads

    async def handler(request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content.decode("utf-8"))
        assert "dashboard" in body
        return httpx.Response(200, json={"status": "success", "slug": body["dashboard"]["uid"]})

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport, base_url="http://grafana.local") as client:
        responses = await validate_dashboards("http://grafana.local", "token", client=client)

    assert len(responses) == len(payloads)
    assert all(response["status"] == "success" for response in responses)
