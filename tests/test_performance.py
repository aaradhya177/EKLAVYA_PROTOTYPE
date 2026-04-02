from datetime import datetime, timedelta, timezone

from app.performance.tasks import compute_performance_indices


async def _create_athlete(client, name: str, tier: str = "national") -> dict:
    response = await client.post(
        "/athletes/",
        json={
            "name": name,
            "dob": "2001-01-01",
            "gender": "female",
            "sport_id": 1,
            "state": "Odisha",
            "tier": tier,
        },
    )
    return response.json()["data"]


async def _create_closed_session(
    client,
    athlete_id: str,
    sport_id: int,
    end_time: datetime,
    duration_min: int,
    rpe: int,
):
    start_time = end_time - timedelta(minutes=duration_min)
    response = await client.post(
        "/sessions/",
        json={
            "athlete_id": athlete_id,
            "sport_id": sport_id,
            "session_type": "training",
            "start_time": start_time.isoformat().replace("+00:00", "Z"),
            "end_time": end_time.isoformat().replace("+00:00", "Z"),
            "rpe": rpe,
            "notes": "fixture session",
            "raw_metrics": {},
            "computed_metrics": {},
            "coach_id": None,
        },
    )
    return response.json()["data"]


async def test_acwr_computation_with_known_fixture_data(client):
    athlete = await _create_athlete(client, "Athlete One")
    now = datetime.now(timezone.utc).replace(second=0, microsecond=0)

    fixtures = [
        (2, 40, 5),
        (5, 40, 5),
        (14, 40, 5),
        (21, 40, 5),
    ]
    last_session_id = None
    for days_ago, duration_min, rpe in sorted(fixtures, reverse=True):
        session = await _create_closed_session(
            client,
            athlete["id"],
            athlete["sport_id"],
            now - timedelta(days=days_ago),
            duration_min,
            rpe,
        )
        last_session_id = session["id"]

    assert compute_performance_indices.run(last_session_id) == 3

    summary_response = await client.get(f"/performance/{athlete['id']}/summary")
    summary_items = {item["index_name"]: item for item in summary_response.json()["data"]}
    assert summary_items["acwr"]["value"] == 2.0


async def test_percentile_ranking_across_athletes(client):
    now = datetime.now(timezone.utc).replace(second=0, microsecond=0)
    athlete_high = await _create_athlete(client, "Athlete High")
    athlete_mid = await _create_athlete(client, "Athlete Mid")
    athlete_low = await _create_athlete(client, "Athlete Low")

    cohorts = {
        athlete_high["id"]: [(2, 40, 5), (5, 40, 5), (14, 40, 5), (21, 40, 5)],
        athlete_mid["id"]: [(2, 40, 5), (5, 40, 5), (10, 40, 5), (14, 40, 5), (18, 40, 5), (21, 40, 5), (24, 40, 5), (27, 40, 5)],
        athlete_low["id"]: [(2, 40, 5), (10, 40, 5), (12, 40, 5), (14, 40, 5), (16, 40, 5), (18, 40, 5), (21, 40, 5), (24, 40, 5)],
    }

    last_session_ids: dict[str, int] = {}
    for athlete_id, sessions in cohorts.items():
        for days_ago, duration_min, rpe in sorted(sessions, reverse=True):
            session = await _create_closed_session(
                client,
                athlete_id,
                1,
                now - timedelta(days=days_ago),
                duration_min,
                rpe,
            )
            last_session_ids[athlete_id] = session["id"]

    for session_id in last_session_ids.values():
        compute_performance_indices.run(session_id)

    high = {item["index_name"]: item for item in (await client.get(f"/performance/{athlete_high['id']}/summary")).json()["data"]}
    mid = {item["index_name"]: item for item in (await client.get(f"/performance/{athlete_mid['id']}/summary")).json()["data"]}
    low = {item["index_name"]: item for item in (await client.get(f"/performance/{athlete_low['id']}/summary")).json()["data"]}

    assert round(high["acwr"]["percentile_in_sport"], 2) == 83.33
    assert round(mid["acwr"]["percentile_in_sport"], 2) == 50.0
    assert round(low["acwr"]["percentile_in_sport"], 2) == 16.67


async def test_alert_threshold_logic(client):
    athlete = await _create_athlete(client, "Athlete Alert")
    now = datetime.now(timezone.utc).replace(second=0, microsecond=0)

    fixtures = [
        (2, 40, 7),
        (5, 40, 7),
        (10, 40, 5),
        (14, 40, 5),
        (18, 40, 5),
        (21, 40, 5),
        (25, 40, 6),
    ]
    last_session_id = None
    for days_ago, duration_min, rpe in sorted(fixtures, reverse=True):
        session = await _create_closed_session(
            client,
            athlete["id"],
            athlete["sport_id"],
            now - timedelta(days=days_ago),
            duration_min,
            rpe,
        )
        last_session_id = session["id"]

    compute_performance_indices.run(last_session_id)

    alerts_response = await client.get(f"/performance/{athlete['id']}/alerts")
    alerts = alerts_response.json()["data"]
    assert len(alerts) == 1
    assert alerts[0]["index_name"] == "acwr"
    assert round(alerts[0]["value"], 2) == 1.4
    assert alerts[0]["level"] == "yellow"
