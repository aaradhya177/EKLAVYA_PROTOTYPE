from __future__ import annotations

import asyncio
import random
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Any

from faker import Faker
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.service import hash_password
from app.career.models import CareerGoal, CareerGoalStatus, CareerGoalType
from app.core import database
from app.financial.models import ExpenseCategory, ExpenseRecord, FinancialSummary, GrantRecord, GrantScheme, IncomeRecord
from app.financial.service import compute_financial_summary
from app.injury.models import InjuryRecord
from app.performance.models import PerformanceIndex, SessionLog
from app.performance.service import compute_session_indices
from app.seed.factories import INDIAN_STATES, faker, make_athlete, make_income, make_injury, make_session
from app.uadp.models import Athlete, AthleteTier, ConsentLedger, DataCategory, FeatureSnapshot, FeatureWindow, Sport, SportCategory
from app.users.models import User, UserRole

PASSWORD = "Athlete@123"
TARGET_EVENTS = ["Asian Games 2026", "National Championship 2025", "CWG 2026", "Olympics 2028"]
SPORTS = [
    {
        "name": "Athletics",
        "category": SportCategory.individual,
        "ontology_tags": {"energy_system": "aerobic", "contact": False, "equipment": False, "team": False},
    },
    {
        "name": "Wrestling",
        "category": SportCategory.individual,
        "ontology_tags": {"energy_system": "anaerobic", "contact": True, "equipment": False, "team": False},
    },
    {
        "name": "Boxing",
        "category": SportCategory.individual,
        "ontology_tags": {"energy_system": "mixed", "contact": True, "equipment": True, "team": False},
    },
    {
        "name": "Badminton",
        "category": SportCategory.individual,
        "ontology_tags": {"energy_system": "mixed", "contact": False, "equipment": True, "team": False},
    },
    {
        "name": "Cricket",
        "category": SportCategory.team,
        "ontology_tags": {"energy_system": "mixed", "contact": False, "equipment": True, "team": True},
    },
    {
        "name": "Football",
        "category": SportCategory.team,
        "ontology_tags": {"energy_system": "aerobic", "contact": True, "equipment": True, "team": True},
    },
    {
        "name": "Kabaddi",
        "category": SportCategory.team,
        "ontology_tags": {"energy_system": "anaerobic", "contact": True, "equipment": False, "team": True},
    },
    {
        "name": "Weightlifting",
        "category": SportCategory.individual,
        "ontology_tags": {"energy_system": "anaerobic", "contact": False, "equipment": True, "team": False},
    },
    {
        "name": "Shooting",
        "category": SportCategory.individual,
        "ontology_tags": {"energy_system": "skill", "contact": False, "equipment": True, "team": False},
    },
    {
        "name": "Swimming",
        "category": SportCategory.individual,
        "ontology_tags": {"energy_system": "aerobic", "contact": False, "equipment": False, "team": False},
    },
]
TIERS = (
    [AthleteTier.grassroots] * 8
    + [AthleteTier.state] * 7
    + [AthleteTier.national] * 4
    + [AthleteTier.elite]
)
COACH_CLUSTERS = [
    ("endurance-cluster", ["Athletics", "Swimming"]),
    ("combat-cluster", ["Wrestling", "Boxing"]),
    ("racket-strength-cluster", ["Badminton", "Weightlifting"]),
    ("team-ball-cluster", ["Cricket", "Football"]),
    ("indigenous-precision-cluster", ["Kabaddi", "Shooting"]),
]


@dataclass
class SeedStats:
    sports: int = 0
    athletes: int = 0
    users: int = 0
    sessions: int = 0
    injuries: int = 0
    goals: int = 0
    incomes: int = 0
    expenses: int = 0
    grants: int = 0
    summaries: int = 0
    consents: int = 0
    features: int = 0
    indices: int = 0

    def as_dict(self) -> dict[str, int]:
        return self.__dict__.copy()


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _normalized_dt(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value
    return value.astimezone(timezone.utc).replace(tzinfo=None)


async def _get_by_name(session: AsyncSession, model, name: str):
    return (await session.execute(select(model).where(model.name == name))).scalars().first()


async def _get_by_email(session: AsyncSession, email: str) -> User | None:
    return (await session.execute(select(User).where(User.email == email))).scalars().first()


def _income_range_for_tier(tier: AthleteTier) -> tuple[int, int]:
    return {
        AthleteTier.grassroots: (50000, 200000),
        AthleteTier.state: (150000, 450000),
        AthleteTier.national: (400000, 900000),
        AthleteTier.elite: (900000, 1500000),
    }[tier]


def _athlete_blueprints(sport_map: dict[str, Sport]) -> list[dict[str, Any]]:
    blueprints: list[dict[str, Any]] = []
    tier_iter = iter(TIERS)
    state_idx = 0
    athlete_idx = 1
    for sport_name in sport_map:
        for _ in range(2):
            blueprints.append(
                {
                    "index": athlete_idx,
                    "sport": sport_name,
                    "sport_id": sport_map[sport_name].id,
                    "state": INDIAN_STATES[state_idx % len(INDIAN_STATES)],
                    "tier": next(tier_iter),
                }
            )
            athlete_idx += 1
            state_idx += 1
    return blueprints


def _coach_for_sport(staff: dict[str, User], sport_name: str) -> User:
    for cluster_name, sports in COACH_CLUSTERS:
        if sport_name in sports:
            return staff[f"coach:{cluster_name}"]
    return staff["coach:endurance-cluster"]


async def _upsert_sports(session: AsyncSession, stats: SeedStats) -> dict[str, Sport]:
    sport_map: dict[str, Sport] = {}
    for item in SPORTS:
        sport = await _get_by_name(session, Sport, item["name"])
        if sport is None:
            sport = Sport(**item)
            session.add(sport)
            await session.flush()
            stats.sports += 1
        else:
            sport.category = item["category"]
            sport.ontology_tags = item["ontology_tags"]
        sport_map[sport.name] = sport
    return sport_map


async def _upsert_staff_users(session: AsyncSession, stats: SeedStats) -> dict[str, User]:
    staff: dict[str, User] = {}
    for index, (cluster_name, _sports) in enumerate(COACH_CLUSTERS, start=1):
        email = f"coach{index}@athleteos.dev"
        user = await _get_by_email(session, email)
        if user is None:
            user = User(
                name=f"{faker.first_name()} {faker.last_name()}",
                email=email,
                hashed_password=hash_password(PASSWORD),
                role=UserRole.coach,
                is_active=True,
            )
            session.add(user)
            await session.flush()
            stats.users += 1
        staff[f"coach:{cluster_name}"] = user

    for index in range(1, 3):
        email = f"federation{index}@athleteos.dev"
        user = await _get_by_email(session, email)
        if user is None:
            user = User(
                name=f"Federation Admin {index}",
                email=email,
                hashed_password=hash_password(PASSWORD),
                role=UserRole.federation_admin,
                is_active=True,
            )
            session.add(user)
            await session.flush()
            stats.users += 1
        staff[f"fed:{index}"] = user

    sys_admin = await _get_by_email(session, "sysadmin@athleteos.dev")
    if sys_admin is None:
        sys_admin = User(
            name="System Administrator",
            email="sysadmin@athleteos.dev",
            hashed_password=hash_password(PASSWORD),
            role=UserRole.sys_admin,
            is_active=True,
        )
        session.add(sys_admin)
        await session.flush()
        stats.users += 1
    staff["sys_admin"] = sys_admin
    return staff


async def _upsert_athletes_and_users(
    session: AsyncSession,
    sport_map: dict[str, Sport],
    staff: dict[str, User],
    stats: SeedStats,
) -> list[tuple[Athlete, User, User]]:
    seeded: list[tuple[Athlete, User, User]] = []
    for blueprint in _athlete_blueprints(sport_map):
        athlete_email = f"athlete{blueprint['index']:02d}@athleteos.dev"
        athlete_user = await _get_by_email(session, athlete_email)
        athlete = await session.get(Athlete, athlete_user.athlete_id) if athlete_user and athlete_user.athlete_id else None
        if athlete is None:
            payload = make_athlete(
                sport_id=blueprint["sport_id"],
                tier=blueprint["tier"],
                state=blueprint["state"],
                seed=blueprint["index"],
            )
            payload["name"] = f"{payload['name']} {blueprint['index']}"
            athlete = Athlete(**payload)
            session.add(athlete)
            await session.flush()
            stats.athletes += 1
        if athlete_user is None:
            athlete_user = User(
                name=athlete.name,
                email=athlete_email,
                hashed_password=hash_password(PASSWORD),
                role=UserRole.athlete,
                athlete_id=athlete.id,
                is_active=True,
            )
            session.add(athlete_user)
            await session.flush()
            stats.users += 1
        coach = _coach_for_sport(staff, blueprint["sport"])
        seeded.append((athlete, athlete_user, coach))
    return seeded


async def _upsert_consents(session: AsyncSession, athletes: list[tuple[Athlete, User, User]], stats: SeedStats) -> None:
    revoked_financial = {athletes[index][0].id for index in range(len(athletes) - 3, len(athletes))}
    for athlete, _, _ in athletes:
        for category in [DataCategory.performance, DataCategory.health, DataCategory.financial]:
            consent = (
                await session.execute(
                    select(ConsentLedger).where(
                        ConsentLedger.athlete_id == athlete.id,
                        ConsentLedger.data_category == category,
                    )
                )
            ).scalars().first()
            consented = not (category == DataCategory.financial and athlete.id in revoked_financial)
            now = _utcnow()
            if consent is None:
                session.add(
                    ConsentLedger(
                        athlete_id=athlete.id,
                        data_category=category,
                        consented=consented,
                        consented_at=now if consented else now - timedelta(days=180),
                        revoked_at=None if consented else now - timedelta(days=30),
                    )
                )
                stats.consents += 1
            else:
                consent.consented = consented
                consent.consented_at = consent.consented_at or now
                consent.revoked_at = None if consented else (consent.revoked_at or now - timedelta(days=30))


async def _seed_feature_snapshots(session: AsyncSession, athletes: list[tuple[Athlete, User, User]], stats: SeedStats) -> None:
    for index, (athlete, _, _) in enumerate(athletes, start=1):
        features = {
            "sleep_quality_score": round(4.2 + (index % 5) * 0.8, 2),
            "resting_hr": float(48 + (index % 12)),
            "readiness_score": round(55 + (index % 30) * 1.2, 2),
        }
        for feature_name, value in features.items():
            for window in [FeatureWindow.d7, FeatureWindow.d28]:
                existing = (
                    await session.execute(
                        select(FeatureSnapshot).where(
                            FeatureSnapshot.athlete_id == athlete.id,
                            FeatureSnapshot.feature_name == feature_name,
                            FeatureSnapshot.window == window,
                        )
                    )
                ).scalars().first()
                if existing is None:
                    session.add(
                        FeatureSnapshot(
                            athlete_id=athlete.id,
                            feature_name=feature_name,
                            value=float(value),
                            window=window,
                            computed_at=_utcnow(),
                        )
                    )
                    stats.features += 1
                else:
                    existing.value = float(value)


async def _seed_sessions(session: AsyncSession, athletes: list[tuple[Athlete, User, User]], stats: SeedStats) -> list[int]:
    latest_session_ids: list[int] = []
    today = _utcnow().date()
    for athlete_index, (athlete, _, coach) in enumerate(athletes, start=1):
        sport = await session.get(Sport, athlete.sport_id)
        rng = random.Random(athlete_index * 101)
        existing_sessions = list(
            (
                await session.execute(select(SessionLog).where(SessionLog.athlete_id == athlete.id))
            ).scalars().all()
        )
        existing_by_start = {_normalized_dt(item.start_time): item for item in existing_sessions}
        last_session_id: int | None = None
        for week_offset in range(13):
            sessions_this_week = rng.randint(4, 6)
            week_anchor = today - timedelta(days=week_offset * 7)
            for session_number in range(sessions_this_week):
                session_date = week_anchor - timedelta(days=session_number)
                payload = make_session(
                    athlete.id,
                    session_date,
                    athlete.sport_id,
                    sport_name=sport.name if sport else "Athletics",
                    seed=athlete_index * 1000 + week_offset * 10 + session_number,
                )
                payload["coach_id"] = coach.id
                start_key = _normalized_dt(payload["start_time"])
                if start_key in existing_by_start:
                    existing = existing_by_start[start_key]
                    last_session_id = existing.id
                    continue
                session_log = SessionLog(**payload)
                session.add(session_log)
                await session.flush()
                existing_by_start[start_key] = session_log
                stats.sessions += 1
                last_session_id = session_log.id
        if last_session_id is not None:
            latest_session_ids.append(last_session_id)
    return latest_session_ids


async def _seed_injuries(session: AsyncSession, athletes: list[tuple[Athlete, User, User]], stats: SeedStats) -> None:
    for athlete_index, (athlete, _, coach) in enumerate(athletes[:8], start=1):
        existing = int(
            (
                await session.execute(select(func.count(InjuryRecord.id)).where(InjuryRecord.athlete_id == athlete.id))
            ).scalar_one()
        )
        if existing > 0:
            continue
        sport = await session.get(Sport, athlete.sport_id)
        injury_count = random.Random(athlete_index).randint(1, 3)
        for injury_index in range(1, injury_count + 1):
            payload = make_injury(
                athlete.id,
                sport.name if sport else "Athletics",
                seed=athlete_index * 17 + injury_index,
            )
            payload["reported_by"] = coach.id if injury_index % 2 == 0 else athlete.id
            session.add(InjuryRecord(**payload))
            stats.injuries += 1


async def _seed_goals(session: AsyncSession, athletes: list[tuple[Athlete, User, User]], stats: SeedStats) -> None:
    goal_types = list(CareerGoalType)
    for athlete_index, (athlete, _, _) in enumerate(athletes, start=1):
        existing = (
            await session.execute(select(CareerGoal).where(CareerGoal.athlete_id == athlete.id))
        ).scalars().first()
        if existing is not None:
            continue
        target_event = TARGET_EVENTS[(athlete_index - 1) % len(TARGET_EVENTS)]
        session.add(
            CareerGoal(
                athlete_id=athlete.id,
                goal_type=goal_types[(athlete_index - 1) % len(goal_types)],
                target_date=date(2028 if "Olympics" in target_event else 2026, 9, 1),
                priority_event=target_event,
                status=CareerGoalStatus.active,
            )
        )
        stats.goals += 1


async def _seed_financials(session: AsyncSession, athletes: list[tuple[Athlete, User, User]], stats: SeedStats) -> None:
    fiscal_years = ["2024-25", "2025-26"]
    for athlete_index, (athlete, _, _) in enumerate(athletes[:10], start=1):
        for fiscal_year in fiscal_years:
            income_count = int(
                (
                    await session.execute(
                        select(func.count(IncomeRecord.id)).where(
                            IncomeRecord.athlete_id == athlete.id,
                            IncomeRecord.fiscal_year == fiscal_year,
                        )
                    )
                ).scalar_one()
            )
            expense_count = int(
                (
                    await session.execute(
                        select(func.count(ExpenseRecord.id)).where(
                            ExpenseRecord.athlete_id == athlete.id,
                            ExpenseRecord.fiscal_year == fiscal_year,
                        )
                    )
                ).scalar_one()
            )
            grant_count = int(
                (
                    await session.execute(
                        select(func.count(GrantRecord.id)).where(GrantRecord.athlete_id == athlete.id)
                    )
                ).scalar_one()
            )
            base_rng = random.Random(athlete_index * 401 + (1 if fiscal_year == "2025-26" else 0))
            low, high = _income_range_for_tier(athlete.tier)
            if income_count == 0:
                for record_index, note in enumerate(["Prize purse", "State grant", "Khelo India grant"], start=1):
                    payload = make_income(athlete.id, fiscal_year, seed=athlete_index * 100 + record_index)
                    payload["amount"] = Decimal(str(round(base_rng.uniform(low, high), 2)))
                    payload["notes"] = note
                    session.add(IncomeRecord(**payload))
                    stats.incomes += 1
            if expense_count == 0:
                expense_notes = [
                    (ExpenseCategory.coaching, "Quarterly coaching fee"),
                    (ExpenseCategory.travel, "Competition travel"),
                    (ExpenseCategory.equipment, "Equipment refresh"),
                ]
                year = 2025 if fiscal_year == "2025-26" else 2024
                for month, (category, note) in zip([5, 8, 11], expense_notes, strict=False):
                    session.add(
                        ExpenseRecord(
                            athlete_id=athlete.id,
                            category=category,
                            amount=Decimal(str(round(base_rng.uniform(low * 0.08, high * 0.25), 2))),
                            paid_at=datetime(year, month, min(athlete_index + 3, 28), tzinfo=timezone.utc),
                            fiscal_year=fiscal_year,
                            notes=note,
                        )
                    )
                    stats.expenses += 1
            if grant_count < len(fiscal_years):
                year = 2025 if fiscal_year == "2025-26" else 2024
                session.add(
                    GrantRecord(
                        athlete_id=athlete.id,
                        grant_scheme=GrantScheme.KheloIndia if athlete_index % 2 == 0 else GrantScheme.StateGovt,
                        amount=Decimal(str(round(base_rng.uniform(low * 0.2, high * 0.4), 2))),
                        disbursed_at=datetime(year, 7, min(athlete_index + 5, 28), tzinfo=timezone.utc),
                        next_disbursement_date=date(year, 12, min(athlete_index + 5, 28)),
                        conditions="Maintain active training and competition participation",
                    )
                )
                stats.grants += 1


async def _refresh_financial_summaries(session: AsyncSession, athletes: list[tuple[Athlete, User, User]], stats: SeedStats) -> None:
    for athlete, _, _ in athletes[:10]:
        for fiscal_year in ["2024-25", "2025-26"]:
            existing = (
                await session.execute(
                    select(FinancialSummary).where(
                        FinancialSummary.athlete_id == athlete.id,
                        FinancialSummary.fiscal_year == fiscal_year,
                    )
                )
            ).scalars().first()
            if existing is not None:
                await session.delete(existing)
            summary = await compute_financial_summary(session, athlete.id, fiscal_year)
            if summary is not None and existing is None:
                stats.summaries += 1


async def _refresh_performance_indices(session: AsyncSession, latest_session_ids: list[int], stats: SeedStats) -> None:
    for session_id in latest_session_ids:
        existing = int(
            (
                await session.execute(
                    select(func.count(PerformanceIndex.id)).where(PerformanceIndex.session_id == session_id)
                )
            ).scalar_one()
        )
        if existing > 0:
            continue
        indices = await compute_session_indices(session, session_id)
        stats.indices += len(indices)


async def seed_database(session: AsyncSession, *, commit: bool = True) -> dict[str, int]:
    Faker.seed(108)
    faker.seed_instance(108)
    stats = SeedStats()
    sport_map = await _upsert_sports(session, stats)
    staff = await _upsert_staff_users(session, stats)
    athletes = await _upsert_athletes_and_users(session, sport_map, staff, stats)
    await _upsert_consents(session, athletes, stats)
    await _seed_feature_snapshots(session, athletes, stats)
    latest_session_ids = await _seed_sessions(session, athletes, stats)
    await _seed_injuries(session, athletes, stats)
    await _seed_goals(session, athletes, stats)
    await _seed_financials(session, athletes, stats)
    await session.flush()
    await _refresh_financial_summaries(session, athletes, stats)
    await _refresh_performance_indices(session, latest_session_ids, stats)
    if commit:
        await session.commit()
    return stats.as_dict()


async def main() -> None:
    async with database.AsyncSessionLocal() as session:
        stats = await seed_database(session, commit=True)
        print(f"Seed complete: {stats}")


if __name__ == "__main__":
    asyncio.run(main())
