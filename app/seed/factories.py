from __future__ import annotations

import random
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from uuid import UUID

from faker import Faker

from app.financial.models import IncomeSourceType
from app.injury.models import InjurySeverity
from app.performance.models import SessionType
from app.uadp.models import AthleteTier

faker = Faker("en_IN")

INDIAN_STATES = [
    "Maharashtra",
    "Punjab",
    "Haryana",
    "Tamil Nadu",
    "West Bengal",
]

SPORT_METRIC_PROFILES: dict[str, dict[str, tuple[float, float] | tuple[int, int]]] = {
    "Athletics": {"distance_km": (6.0, 18.0), "avg_hr": (138, 165), "max_hr": (172, 196), "steps": (7000, 22000)},
    "Wrestling": {"distance_km": (2.0, 5.0), "avg_hr": (128, 158), "max_hr": (165, 190), "steps": (3500, 9000)},
    "Boxing": {"distance_km": (4.0, 9.0), "avg_hr": (135, 162), "max_hr": (170, 195), "steps": (5000, 12000)},
    "Badminton": {"distance_km": (3.0, 7.0), "avg_hr": (132, 160), "max_hr": (168, 192), "steps": (4500, 11000)},
    "Cricket": {"distance_km": (2.0, 8.0), "avg_hr": (118, 148), "max_hr": (155, 182), "steps": (3000, 10000)},
    "Football": {"distance_km": (7.0, 13.0), "avg_hr": (140, 168), "max_hr": (175, 198), "steps": (9000, 18000)},
    "Kabaddi": {"distance_km": (2.5, 6.0), "avg_hr": (130, 158), "max_hr": (168, 192), "steps": (3500, 9000)},
    "Weightlifting": {"distance_km": (1.0, 3.0), "avg_hr": (105, 135), "max_hr": (135, 165), "steps": (1800, 5500)},
    "Shooting": {"distance_km": (0.5, 2.5), "avg_hr": (88, 118), "max_hr": (110, 138), "steps": (1200, 4500)},
    "Swimming": {"distance_km": (2.0, 8.0), "avg_hr": (125, 154), "max_hr": (160, 188), "steps": (1000, 3000)},
}

SPORT_BODY_PARTS: dict[str, list[str]] = {
    "Athletics": ["hamstring", "shin", "calf", "ankle"],
    "Wrestling": ["knee", "shoulder", "neck", "lower back"],
    "Boxing": ["wrist", "shoulder", "hand", "jaw"],
    "Badminton": ["shoulder", "ankle", "knee", "elbow"],
    "Cricket": ["shoulder", "lower back", "hamstring", "finger"],
    "Football": ["knee", "ankle", "hamstring", "groin"],
    "Kabaddi": ["shoulder", "knee", "ankle", "quad"],
    "Weightlifting": ["lower back", "shoulder", "knee", "wrist"],
    "Shooting": ["shoulder", "neck", "eye", "lower back"],
    "Swimming": ["shoulder", "lower back", "knee", "neck"],
}

INJURY_TYPES = ["strain", "sprain", "tendinopathy", "contusion", "stress reaction"]


def _rng(seed: int | None = None) -> random.Random:
    return random.Random(seed)


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def make_athlete(sport_id: int, tier: AthleteTier | str, state: str, seed: int | None = None) -> dict:
    local_faker = Faker("en_IN")
    local_faker.seed_instance(seed or sport_id)
    gender = "female" if (seed or sport_id) % 2 == 0 else "male"
    return {
        "name": local_faker.name_male() if gender == "male" else local_faker.name_female(),
        "dob": local_faker.date_of_birth(minimum_age=16, maximum_age=31),
        "gender": gender,
        "sport_id": sport_id,
        "state": state,
        "tier": tier,
    }


def make_session(
    athlete_id: UUID,
    session_date: date,
    sport_id: int,
    sport_name: str = "Athletics",
    seed: int | None = None,
) -> dict:
    rng = _rng(seed or sport_id + session_date.toordinal())
    session_type = rng.choices(
        [SessionType.training, SessionType.competition, SessionType.recovery],
        weights=[0.7, 0.2, 0.1],
        k=1,
    )[0]
    start_hour = rng.randint(5, 18)
    start_minute = rng.choice([0, 15, 30, 45])
    start_time = datetime.combine(session_date, time(hour=start_hour, minute=start_minute), tzinfo=timezone.utc)
    duration_min = int(round(_clamp(rng.gauss(82, 18), 45, 120)))
    end_time = start_time + timedelta(minutes=duration_min)
    rpe = int(round(_clamp(rng.gauss(6.0, 1.5), 1, 10)))
    profile = SPORT_METRIC_PROFILES.get(sport_name, SPORT_METRIC_PROFILES["Athletics"])
    raw_metrics = {
        "distance_km": round(rng.uniform(*profile["distance_km"]), 2),
        "avg_hr": int(rng.randint(*profile["avg_hr"])),
        "max_hr": int(rng.randint(*profile["max_hr"])),
        "steps": int(rng.randint(*profile["steps"])),
    }
    return {
        "athlete_id": athlete_id,
        "sport_id": sport_id,
        "session_type": session_type,
        "start_time": start_time,
        "end_time": end_time,
        "rpe": rpe,
        "notes": f"{session_type.value.title()} session generated for dev seed",
        "raw_metrics": raw_metrics,
        "computed_metrics": {},
        "coach_id": None,
    }


def make_injury(athlete_id: UUID, sport: str, seed: int | None = None) -> dict:
    rng = _rng(seed)
    occurred_at = datetime.now(timezone.utc) - timedelta(days=rng.randint(30, 540))
    ongoing = rng.random() < 0.35
    return {
        "athlete_id": athlete_id,
        "body_part": rng.choice(SPORT_BODY_PARTS.get(sport, SPORT_BODY_PARTS["Athletics"])),
        "injury_type": rng.choice(INJURY_TYPES),
        "severity": rng.choice([InjurySeverity.mild, InjurySeverity.moderate, InjurySeverity.severe]),
        "occurred_at": occurred_at,
        "returned_at": None if ongoing else occurred_at + timedelta(days=rng.randint(10, 120)),
        "reported_by": athlete_id,
        "notes": f"Seeded {sport.lower()} injury history for demo workflows",
    }


def make_income(athlete_id: UUID, fiscal_year: str, seed: int | None = None) -> dict:
    rng = _rng(seed)
    source = rng.choice(
        [IncomeSourceType.prize_money, IncomeSourceType.government_grant, IncomeSourceType.government_grant]
    )
    year = 2025 if fiscal_year == "2025-26" else 2024
    return {
        "athlete_id": athlete_id,
        "source_type": source,
        "amount": Decimal(str(round(rng.uniform(50000, 1500000), 2))),
        "currency": "INR",
        "received_at": datetime(year, rng.randint(4, 12), rng.randint(1, 28), tzinfo=timezone.utc),
        "fiscal_year": fiscal_year,
        "notes": "Seeded income record",
        "verified": True,
    }
