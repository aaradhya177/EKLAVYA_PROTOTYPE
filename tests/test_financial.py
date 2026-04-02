from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select

from app.core import database
from app.financial.models import GrantRecord, GrantScheme
from app.financial.tasks import compute_cashflow_forecast
from app.performance.models import PerformanceIndex
from app.uadp.models import ConsentLedger, DataCategory


async def _create_athlete(client, name: str, tier: str = "national", state: str = "Haryana") -> dict:
    response = await client.post(
        "/api/v1/uadp/athletes/",
        json={
            "name": name,
            "dob": "2005-01-01",
            "gender": "male",
            "sport_id": 1,
            "state": state,
            "tier": tier,
        },
    )
    return response.json()["data"]


async def _set_financial_consent(athlete_id: str, consented: bool):
    async with database.AsyncSessionLocal() as session:
        existing = (
            await session.execute(
                select(ConsentLedger).where(
                    ConsentLedger.athlete_id == UUID(athlete_id),
                    ConsentLedger.data_category == DataCategory.financial,
                )
            )
        ).scalars().first()
        now = datetime.now(timezone.utc)
        if existing:
            existing.consented = consented
            existing.consented_at = now if consented else existing.consented_at
            existing.revoked_at = None if consented else now
        else:
            session.add(
                ConsentLedger(
                    athlete_id=UUID(athlete_id),
                    data_category=DataCategory.financial,
                    consented=consented,
                    consented_at=now if consented else None,
                    revoked_at=None if consented else now,
                )
            )
        await session.commit()


async def test_financial_summary_aggregation(client):
    athlete = await _create_athlete(client, "Finance Athlete")
    await _set_financial_consent(athlete["id"], True)

    await client.post(
        "/api/v1/financial/income/",
        json={
            "athlete_id": athlete["id"],
            "source_type": "sponsorship",
            "amount": "100000.00",
            "currency": "INR",
            "received_at": "2025-05-01T00:00:00Z",
            "fiscal_year": "2024-25",
            "notes": "brand deal",
            "verified": True,
        },
    )
    await client.post(
        "/api/v1/financial/expenses/",
        json={
            "athlete_id": athlete["id"],
            "category": "travel",
            "amount": "25000.00",
            "paid_at": "2025-05-10T00:00:00Z",
            "fiscal_year": "2024-25",
            "notes": "camp travel",
        },
    )

    response = await client.get(f"/api/v1/financial/summary/{athlete['id']}/2024-25")
    summary = response.json()["data"]
    assert summary["total_income"] == "100000.00"
    assert summary["total_expense"] == "25000.00"
    assert summary["net_savings"] == "75000.00"


async def test_cashflow_forecast_with_known_fixtures(client):
    athlete = await _create_athlete(client, "Forecast Athlete")
    await _set_financial_consent(athlete["id"], True)

    await client.post(
        "/api/v1/financial/income/",
        json={
            "athlete_id": athlete["id"],
            "source_type": "sponsorship",
            "amount": "120000.00",
            "currency": "INR",
            "received_at": "2025-04-01T00:00:00Z",
            "fiscal_year": "2024-25",
            "verified": True,
        },
    )
    await client.post(
        "/api/v1/financial/expenses/",
        json={
            "athlete_id": athlete["id"],
            "category": "coaching",
            "amount": "144000.00",
            "paid_at": "2025-04-15T00:00:00Z",
            "fiscal_year": "2024-25",
        },
    )

    assert compute_cashflow_forecast.run(athlete["id"], 12) == 12
    response = await client.get(f"/api/v1/financial/forecast/{athlete['id']}")
    rows = response.json()["data"]
    assert len(rows) == 12
    assert rows[0]["projected_income"] == "10800.00"
    assert rows[0]["projected_expense"] == "12000.00"
    assert rows[0]["deficit_flag"] is True


async def test_grant_eligibility_rules_from_yaml_config(client):
    athlete = await _create_athlete(client, "Eligible Athlete", tier="national", state="Haryana")
    await _set_financial_consent(athlete["id"], True)

    async with database.AsyncSessionLocal() as session:
        session.add(
            PerformanceIndex(
                athlete_id=UUID(athlete["id"]),
                session_id=None,
                index_name="speed_index",
                value=88.0,
                percentile_in_sport=85.0,
                computed_at=datetime.now(timezone.utc),
            )
        )
        session.add(
            GrantRecord(
                athlete_id=UUID(athlete["id"]),
                grant_scheme=GrantScheme.TOPS,
                amount=Decimal("50000.00"),
                disbursed_at=datetime.now(timezone.utc),
                next_disbursement_date=None,
                conditions="performance review",
            )
        )
        await session.commit()

    eligible_response = await client.get(f"/api/v1/financial/grants/eligible/{athlete['id']}")
    schemes = {item["scheme_name"] for item in eligible_response.json()["data"]}
    assert "TOPS" in schemes
    assert "HaryanaStateSupport" in schemes


async def test_http_451_when_financial_consent_revoked(client):
    athlete = await _create_athlete(client, "Consent Athlete")
    await _set_financial_consent(athlete["id"], False)

    response = await client.get(f"/api/v1/financial/summary/{athlete['id']}/2024-25")
    assert response.status_code == 451
    assert response.json()["message"] == "Data access restricted under DPDP Act"
