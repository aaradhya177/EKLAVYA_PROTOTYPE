from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select

from app.core import database
from app.uadp.models import FeatureSnapshot
from app.uadp.tasks import compute_feature_snapshots


async def _create_athlete(client):
    response = await client.post(
        "/api/v1/uadp/athletes/",
        json={
            "name": "Aarav Singh",
            "dob": "2004-08-15",
            "gender": "male",
            "sport_id": 1,
            "state": "Haryana",
            "tier": "national",
        },
    )
    return response.json()["data"]


async def test_athlete_registration_and_event_ingestion(client):
    athlete = await _create_athlete(client)
    assert athlete["name"] == "Aarav Singh"

    event_response = await client.post(
        f"/api/v1/uadp/athletes/{athlete['id']}/events",
        json={
            "event_type": "training.session",
            "source": "manual",
            "payload": {
                "data_category": "performance",
                "distance_km": 10.5,
                "duration_min": 48,
            },
            "recorded_at": "2026-04-01T05:30:00Z",
        },
    )
    event_payload = event_response.json()
    assert event_response.status_code == 200
    assert event_payload["status"] == "ok"
    assert event_payload["data"]["event_type"] == "training.session"

    history_response = await client.get(f"/api/v1/uadp/athletes/{athlete['id']}/events")
    history_payload = history_response.json()
    assert history_payload["data"]["total"] == 1
    assert history_payload["data"]["items"][0]["payload"]["distance_km"] == 10.5


async def test_consent_blocking_when_health_consent_revoked(client):
    athlete = await _create_athlete(client)

    await client.post(
        f"/api/v1/uadp/athletes/{athlete['id']}/events",
        json={
            "event_type": "wearable.heart_rate",
            "source": "wearable",
            "payload": {
                "data_category": "health",
                "heart_rate": 152,
            },
            "recorded_at": "2026-04-01T05:30:00Z",
        },
    )

    revoke_response = await client.post(
        f"/api/v1/uadp/consent/{athlete['id']}",
        json={"data_category": "health", "consented": False},
    )
    assert revoke_response.status_code == 200

    blocked_response = await client.get(
        f"/api/v1/uadp/athletes/{athlete['id']}/events",
        params={"data_category": "health"},
    )
    blocked_payload = blocked_response.json()
    assert blocked_response.status_code == 451
    assert blocked_payload["message"] == "Data access restricted under DPDP Act"


async def test_feature_snapshot_computation_task(client):
    athlete = await _create_athlete(client)
    athlete_id = athlete["id"]
    now = datetime.now(timezone.utc)

    for offset_days, heart_rate in [(2, 140), (5, 160), (40, 120)]:
        await client.post(
            f"/api/v1/uadp/athletes/{athlete_id}/events",
            json={
                "event_type": "wearable.heart_rate",
                "source": "wearable",
                "payload": {
                    "data_category": "health",
                    "heart_rate": heart_rate,
                },
                "recorded_at": (now - timedelta(days=offset_days)).isoformat().replace("+00:00", "Z"),
            },
        )

    result = compute_feature_snapshots.run(athlete_id)
    assert result >= 3

    async with database.AsyncSessionLocal() as session:
        snapshots = list(
            (
                await session.execute(
                    select(FeatureSnapshot).where(FeatureSnapshot.athlete_id == UUID(athlete_id))
                )
            )
            .scalars()
            .all()
        )

    values = {(snapshot.feature_name, snapshot.window.value): snapshot.value for snapshot in snapshots}
    assert values[("health.heart_rate.avg", "7d")] == 150.0
    assert values[("health.heart_rate.avg", "28d")] == 150.0
    assert values[("health.heart_rate.avg", "90d")] == 140.0
