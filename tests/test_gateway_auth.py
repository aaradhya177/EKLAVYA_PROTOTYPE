from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select

from app.auth.service import create_access_token
from app.core import database
from app.core.config import settings
from app.injury.tasks import compute_injury_risk
from app.performance.tasks import compute_performance_indices
from app.users.models import User


async def _login(client, email: str, password: str) -> str:
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    return response.json()["data"]["access_token"]


async def _user_by_email(email: str) -> User:
    async with database.AsyncSessionLocal() as session:
        return (await session.execute(select(User).where(User.email == email))).scalars().first()


async def test_end_to_end_gateway_flow(raw_client):
    await raw_client.post(
        "/api/v1/auth/register",
        json={
            "name": "Admin",
            "email": "admin-flow@example.com",
            "password": "password123",
            "role": "federation_admin",
            "athlete_id": None,
        },
    )
    admin_token = await _login(raw_client, "admin-flow@example.com", "password123")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    athlete_response = await raw_client.post(
        "/api/v1/uadp/athletes/",
        headers=admin_headers,
        json={
            "name": "Flow Athlete",
            "dob": "2004-05-20",
            "gender": "male",
            "sport_id": 1,
            "state": "Haryana",
            "tier": "national",
        },
    )
    athlete = athlete_response.json()["data"]

    await raw_client.post(
        "/api/v1/auth/register",
        json={
            "name": "Athlete User",
            "email": "athlete-flow@example.com",
            "password": "password123",
            "role": "athlete",
            "athlete_id": athlete["id"],
        },
    )
    athlete_token = await _login(raw_client, "athlete-flow@example.com", "password123")
    athlete_headers = {"Authorization": f"Bearer {athlete_token}"}

    await raw_client.post(
        f"/api/v1/uadp/consent/{athlete['id']}",
        headers=athlete_headers,
        json={"data_category": "health", "consented": True},
    )

    now = datetime.now(timezone.utc).replace(second=0, microsecond=0)
    last_session_id = None
    for days_ago in [21, 14, 5, 2]:
        response = await raw_client.post(
            "/api/v1/performance/sessions/",
            headers=athlete_headers,
            json={
                "athlete_id": athlete["id"],
                "sport_id": athlete["sport_id"],
                "session_type": "training",
                "start_time": (now - timedelta(days=days_ago, minutes=40)).isoformat().replace("+00:00", "Z"),
                "end_time": (now - timedelta(days=days_ago)).isoformat().replace("+00:00", "Z"),
                "rpe": 7,
                "notes": "gateway flow session",
                "raw_metrics": {},
                "computed_metrics": {},
                "coach_id": None,
            },
        )
        last_session_id = response.json()["data"]["id"]

    compute_performance_indices.run(last_session_id)

    alerts_response = await raw_client.get(
        f"/api/v1/performance/alerts/{athlete['id']}",
        headers=athlete_headers,
    )
    assert alerts_response.status_code == 200

    compute_response = await raw_client.post(
        f"/api/v1/injury/risk/{athlete['id']}/compute",
        headers=athlete_headers,
    )
    assert compute_response.status_code == 200
    compute_injury_risk.run(athlete["id"])

    risk_response = await raw_client.get(
        f"/api/v1/injury/risk/{athlete['id']}",
        headers=athlete_headers,
    )
    assert risk_response.status_code == 200
    assert risk_response.json()["data"]["athlete_id"] == athlete["id"]


async def test_rate_limiting_triggers_correctly(raw_client, monkeypatch):
    monkeypatch.setattr(settings, "rate_limit_per_minute", 2)

    await raw_client.post(
        "/api/v1/auth/register",
        json={
            "name": "Rate Admin",
            "email": "rate-admin@example.com",
            "password": "password123",
            "role": "federation_admin",
            "athlete_id": None,
        },
    )
    token = await _login(raw_client, "rate-admin@example.com", "password123")
    headers = {"Authorization": f"Bearer {token}"}

    for index in range(2):
        response = await raw_client.post(
            "/api/v1/uadp/athletes/",
            headers=headers,
            json={
                "name": f"Rate Athlete {index}",
                "dob": "2004-01-01",
                "gender": "male",
                "sport_id": 1,
                "state": "Delhi",
                "tier": "state",
            },
        )
        assert response.status_code == 200

    blocked = await raw_client.post(
        "/api/v1/uadp/athletes/",
        headers=headers,
        json={
            "name": "Rate Athlete Blocked",
            "dob": "2004-01-01",
            "gender": "male",
            "sport_id": 1,
            "state": "Delhi",
            "tier": "state",
        },
    )
    assert blocked.status_code == 429


async def test_role_based_access_coach_cannot_access_another_coachs_athletes(client):
    athlete_one = (
        await client.post(
            "/api/v1/uadp/athletes/",
            json={
                "name": "Coach One Athlete",
                "dob": "2004-01-01",
                "gender": "male",
                "sport_id": 1,
                "state": "Punjab",
                "tier": "state",
            },
        )
    ).json()["data"]
    athlete_two = (
        await client.post(
            "/api/v1/uadp/athletes/",
            json={
                "name": "Coach Two Athlete",
                "dob": "2004-01-01",
                "gender": "male",
                "sport_id": 1,
                "state": "Punjab",
                "tier": "state",
            },
        )
    ).json()["data"]

    coach_one = await _user_by_email("coach@example.com")
    coach_two = await _user_by_email("coach2@example.com")

    await client.post(
        "/api/v1/performance/sessions/",
        json={
            "athlete_id": athlete_one["id"],
            "sport_id": 1,
            "session_type": "training",
            "start_time": "2026-01-01T09:00:00Z",
            "end_time": "2026-01-01T10:00:00Z",
            "rpe": 7,
            "coach_id": str(coach_one.id),
            "raw_metrics": {},
            "computed_metrics": {},
        },
    )
    await client.post(
        "/api/v1/performance/sessions/",
        json={
            "athlete_id": athlete_two["id"],
            "sport_id": 1,
            "session_type": "training",
            "start_time": "2026-01-01T09:00:00Z",
            "end_time": "2026-01-01T10:00:00Z",
            "rpe": 7,
            "coach_id": str(coach_two.id),
            "raw_metrics": {},
            "computed_metrics": {},
        },
    )

    coach_token = await _login(client, "coach@example.com", "password123")
    coach_headers = {"Authorization": f"Bearer {coach_token}"}

    own_access = await client.get(
        f"/api/v1/performance/sessions/{athlete_one['id']}",
        headers=coach_headers,
    )
    assert own_access.status_code == 200

    forbidden = await client.get(
        f"/api/v1/performance/sessions/{athlete_two['id']}",
        headers=coach_headers,
    )
    assert forbidden.status_code == 403
