from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient

from app.core import database
from app.core.database import Base
from app.main import create_app
from app.uadp.models import Sport, SportCategory


@pytest.fixture()
async def client(tmp_path) -> AsyncGenerator[AsyncClient, None]:
    db_path = tmp_path / "test_uadp.db"
    database.configure_database(f"sqlite+aiosqlite:///{db_path}")

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
