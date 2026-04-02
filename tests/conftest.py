from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient

from app.career import models as career_models  # noqa: F401
from app.core import database
from app.core.database import Base
from app.injury import models as injury_models  # noqa: F401
from app.main import create_app
from app.performance import models as performance_models  # noqa: F401
from app.uadp.models import Sport, SportCategory
from app.users.models import User, UserRole


@pytest.fixture()
async def client(tmp_path) -> AsyncGenerator[AsyncClient, None]:
    db_path = tmp_path / "test_uadp.db"
    database.configure_database(f"sqlite+aiosqlite:///{db_path}")

    async with database.engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with database.AsyncSessionLocal() as session:
        coach = User(name="Coach Dev", role=UserRole.coach)
        admin = User(name="Fed Admin", role=UserRole.federation_admin)
        session.add(
            Sport(
                name="Athletics",
                category=SportCategory.individual,
                ontology_tags={"discipline": "track"},
            )
        )
        session.add(coach)
        session.add(admin)
        await session.commit()

    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as async_client:
        yield async_client

    await database.engine.dispose()
