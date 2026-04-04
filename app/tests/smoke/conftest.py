from __future__ import annotations

from sqlalchemy import create_engine, text
import pytest

from app.core.config import settings


@pytest.fixture(scope="session")
def smoke_engine():
    db_url = settings.DATABASE_URL.replace("+asyncpg", "").replace("+aiosqlite", "")
    engine = create_engine(db_url)
    try:
        yield engine
    finally:
        engine.dispose()


@pytest.fixture(scope="session")
def smoke_connection(smoke_engine):
    with smoke_engine.connect() as connection:
        yield connection
