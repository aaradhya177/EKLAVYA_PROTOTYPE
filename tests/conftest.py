pytest_plugins = ["app.seed.conftest"]

from collections.abc import AsyncGenerator
import tempfile
from pathlib import Path
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from app.auth.service import create_access_token, hash_password
from app.career import models as career_models  # noqa: F401
from app.core import database
from app.core.celery_app import celery_app
from app.core.database import Base
from app.core.redis_client import reset_redis_client
from app.financial import models as financial_models  # noqa: F401
from app.files import models as files_models  # noqa: F401
from app.injury import models as injury_models  # noqa: F401
from app.main import create_app
from app.ml import models as ml_models  # noqa: F401
from app.performance import models as performance_models  # noqa: F401
from app.uadp.models import Sport, SportCategory
from app.users.models import User, UserRole

TEST_DB_DIR = Path(tempfile.gettempdir()) / "athleteos-tests"
TEST_DB_DIR.mkdir(exist_ok=True)


@pytest.fixture()
async def client() -> AsyncGenerator[AsyncClient, None]:
    db_path = TEST_DB_DIR / f"{uuid4().hex}.db"
    database.configure_database(f"sqlite+aiosqlite:///{db_path}")
    reset_redis_client()
    celery_app.conf.broker_url = "memory://"
    celery_app.conf.result_backend = "cache+memory://"
    celery_app.conf.task_ignore_result = True

    async with database.engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with database.AsyncSessionLocal() as session:
        coach = User(
            name="Coach Dev",
            email="coach@example.com",
            hashed_password=hash_password("password123"),
            role=UserRole.coach,
            is_active=True,
        )
        coach_two = User(
            name="Coach Two",
            email="coach2@example.com",
            hashed_password=hash_password("password123"),
            role=UserRole.coach,
            is_active=True,
        )
        admin = User(
            name="Fed Admin",
            email="admin@example.com",
            hashed_password=hash_password("password123"),
            role=UserRole.federation_admin,
            is_active=True,
        )
        session.add(
            Sport(
                name="Athletics",
                category=SportCategory.individual,
                ontology_tags={"discipline": "track"},
            )
        )
        session.add(coach)
        session.add(coach_two)
        session.add(admin)
        await session.commit()
        await session.refresh(admin)
        admin_token = create_access_token(admin)

    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://testserver",
        headers={"Authorization": f"Bearer {admin_token}"},
    ) as async_client:
        yield async_client

    await database.engine.dispose()
    reset_redis_client()
    if db_path.exists():
        db_path.unlink()


@pytest.fixture()
async def raw_client() -> AsyncGenerator[AsyncClient, None]:
    db_path = TEST_DB_DIR / f"{uuid4().hex}.db"
    database.configure_database(f"sqlite+aiosqlite:///{db_path}")
    reset_redis_client()
    celery_app.conf.broker_url = "memory://"
    celery_app.conf.result_backend = "cache+memory://"
    celery_app.conf.task_ignore_result = True

    async with database.engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with database.AsyncSessionLocal() as session:
        session.add(
            Sport(
                name="Athletics",
                category=SportCategory.individual,
                ontology_tags={"discipline": "track"},
            )
        )
        await session.commit()

    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as async_client:
        yield async_client

    await database.engine.dispose()
    reset_redis_client()
    if db_path.exists():
        db_path.unlink()
