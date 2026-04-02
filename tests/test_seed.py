from __future__ import annotations

import os
from pathlib import Path
from uuid import uuid4

from sqlalchemy import func, select

from app.career import models as career_models  # noqa: F401
from app.core import database
from app.core.database import Base
from app.financial import models as financial_models  # noqa: F401
from app.financial.schemas import IncomeRecordCreate
from app.injury import models as injury_models  # noqa: F401
from app.injury.schemas import InjuryRecordCreate
from app.performance import models as performance_models  # noqa: F401
from app.performance.schemas import SessionCreate
from app.seed.factories import make_athlete, make_income, make_injury, make_session
from app.seed.seed import seed_database
from app.uadp import models as uadp_models  # noqa: F401
from app.uadp.models import Athlete, AthleteTier, ConsentLedger, DataCategory, Sport
from app.uadp.schemas import AthleteCreate
from app.users.models import User, UserRole

TEST_DB_DIR = Path(os.environ.get("TEMP", ".")) / "athleteos-seed-tests"
TEST_DB_DIR.mkdir(exist_ok=True)


async def test_seed_runs_without_errors_on_clean_database():
    db_path = TEST_DB_DIR / f"seed-run-{uuid4().hex}.db"
    database.configure_database(f"sqlite+aiosqlite:///{db_path}")

    async with database.engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with database.AsyncSessionLocal() as session:
        stats = await seed_database(session)

        sport_count = int((await session.execute(select(func.count(Sport.id)))).scalar_one())
        athlete_count = int((await session.execute(select(func.count(Athlete.id)))).scalar_one())
        user_count = int((await session.execute(select(func.count(User.id)))).scalar_one())

    await database.engine.dispose()
    if db_path.exists():
        db_path.unlink()

    assert stats["sports"] == 10
    assert sport_count == 10
    assert athlete_count == 20
    assert user_count == 28


async def test_seed_is_idempotent():
    db_path = TEST_DB_DIR / f"seed-idempotent-{uuid4().hex}.db"
    database.configure_database(f"sqlite+aiosqlite:///{db_path}")

    async with database.engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with database.AsyncSessionLocal() as session:
        await seed_database(session)
        first_counts = {
            "sports": int((await session.execute(select(func.count(Sport.id)))).scalar_one()),
            "athletes": int((await session.execute(select(func.count(Athlete.id)))).scalar_one()),
            "users": int((await session.execute(select(func.count(User.id)))).scalar_one()),
            "consents": int((await session.execute(select(func.count(ConsentLedger.id)))).scalar_one()),
            "sessions": int((await session.execute(select(func.count(performance_models.SessionLog.id)))).scalar_one()),
        }
        await seed_database(session)
        second_counts = {
            "sports": int((await session.execute(select(func.count(Sport.id)))).scalar_one()),
            "athletes": int((await session.execute(select(func.count(Athlete.id)))).scalar_one()),
            "users": int((await session.execute(select(func.count(User.id)))).scalar_one()),
            "consents": int((await session.execute(select(func.count(ConsentLedger.id)))).scalar_one()),
            "sessions": int((await session.execute(select(func.count(performance_models.SessionLog.id)))).scalar_one()),
        }

    await database.engine.dispose()
    if db_path.exists():
        db_path.unlink()

    assert first_counts == second_counts


def test_factory_functions_produce_valid_pydantic_parseable_dicts():
    athlete_payload = make_athlete(sport_id=1, tier=AthleteTier.state, state="Punjab", seed=7)
    athlete = AthleteCreate.model_validate(athlete_payload)

    session_payload = make_session(uuid4(), athlete.dob.replace(year=athlete.dob.year + 18), sport_id=1, seed=11)
    session = SessionCreate.model_validate(session_payload)

    injury_payload = make_injury(session.athlete_id, "Athletics", seed=13)
    injury = InjuryRecordCreate.model_validate(injury_payload)

    income_payload = make_income(session.athlete_id, "2025-26", seed=17)
    income = IncomeRecordCreate.model_validate(income_payload)

    assert athlete.state == "Punjab"
    assert 1 <= session.rpe <= 10
    assert injury.body_part
    assert income.fiscal_year == "2025-26"


async def test_seeded_fixture_exposes_tokens_and_revoked_financial_consent(seeded_db, athlete_token, coach_token):
    athlete_jwt = athlete_token("athlete")
    admin_jwt = athlete_token("federation_admin")
    assert athlete_jwt
    assert admin_jwt
    assert coach_token

    revoked = list(
        (
            await seeded_db.execute(
                select(ConsentLedger).where(
                    ConsentLedger.data_category == DataCategory.financial,
                    ConsentLedger.consented.is_(False),
                )
            )
        ).scalars().all()
    )
    assert len(revoked) == 3

    athlete_users = list((await seeded_db.execute(select(User).where(User.role == UserRole.athlete))).scalars().all())
    assert athlete_users
