from __future__ import annotations

from collections.abc import AsyncGenerator, Callable
import os
from pathlib import Path
from uuid import uuid4

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.auth.service import create_access_token
from app.career import models as career_models  # noqa: F401
from app.core.database import Base
from app.financial import models as financial_models  # noqa: F401
from app.files import models as files_models  # noqa: F401
from app.injury import models as injury_models  # noqa: F401
from app.ml import models as ml_models  # noqa: F401
from app.performance import models as performance_models  # noqa: F401
from app.seed.seed import seed_database
from app.uadp import models as uadp_models  # noqa: F401
from app.users.models import User, UserRole

TEST_DB_DIR = Path(os.environ.get("TEMP", ".")) / "athleteos-seed-tests"
TEST_DB_DIR.mkdir(exist_ok=True)


@pytest.fixture()
async def seeded_db() -> AsyncGenerator[AsyncSession, None]:
    db_path = TEST_DB_DIR / f"seeded-{uuid4().hex}.db"
    engine = create_async_engine(f"sqlite+aiosqlite:///{db_path}", future=True)
    session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with session_factory() as session:
        await seed_database(session, commit=True)
        yield session

    await engine.dispose()
    if db_path.exists():
        db_path.unlink()


@pytest.fixture()
async def athlete_token(seeded_db: AsyncSession) -> Callable[[str], str]:
    users = list((await seeded_db.execute(select(User))).scalars().all())
    first_by_role = {
        "athlete": next(create_access_token(user) for user in users if user.role == UserRole.athlete),
        "coach": next(create_access_token(user) for user in users if user.role == UserRole.coach),
        "federation_admin": next(create_access_token(user) for user in users if user.role == UserRole.federation_admin),
        "sys_admin": next(create_access_token(user) for user in users if user.role == UserRole.sys_admin),
    }

    def _make_token(role: str = "athlete") -> str:
        if role not in first_by_role:
            raise AssertionError(f"No seeded user for role {role}")
        return first_by_role[role]

    return _make_token


@pytest.fixture()
async def coach_token(seeded_db: AsyncSession) -> str:
    coach = (await seeded_db.execute(select(User).where(User.role == UserRole.coach))).scalars().first()
    if coach is None:
        raise AssertionError("No seeded coach found")
    return create_access_token(coach)
