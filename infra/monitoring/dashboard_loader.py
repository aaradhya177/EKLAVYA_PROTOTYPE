from __future__ import annotations

import json
from pathlib import Path

import httpx


def dashboard_paths() -> list[Path]:
    return sorted((Path(__file__).parent / "grafana" / "dashboards").glob("*.json"))


def load_dashboard_payloads() -> list[dict]:
    payloads: list[dict] = []
    for path in dashboard_paths():
        payloads.append({"dashboard": json.loads(path.read_text(encoding="utf-8")), "overwrite": True})
    return payloads


async def validate_dashboards(grafana_url: str, api_token: str, client: httpx.AsyncClient | None = None) -> list[dict]:
    owns_client = client is None
    client = client or httpx.AsyncClient(base_url=grafana_url, timeout=15.0)
    try:
        responses: list[dict] = []
        for payload in load_dashboard_payloads():
            response = await client.post(
                "/api/dashboards/db",
                headers={"Authorization": f"Bearer {api_token}"},
                json=payload,
            )
            response.raise_for_status()
            responses.append(response.json())
        return responses
    finally:
        if owns_client:
            await client.aclose()
