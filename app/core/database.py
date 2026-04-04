from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings
from app.core.secrets import secret_manager


class Base(DeclarativeBase):
    pass


def _engine_kwargs(db_url: str) -> dict:
    if db_url.startswith("sqlite"):
        return {"future": True}
    return {
        "future": True,
        "pool_size": settings.DB_POOL_SIZE,
        "max_overflow": settings.DB_MAX_OVERFLOW,
        "pool_timeout": settings.DB_POOL_TIMEOUT,
    }


engine: AsyncEngine = create_async_engine(secret_manager.get("DATABASE_URL"), **_engine_kwargs(secret_manager.get("DATABASE_URL")))
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


def configure_database(db_url: str) -> None:
    global engine, AsyncSessionLocal
    engine = create_async_engine(db_url, **_engine_kwargs(db_url))
    AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
