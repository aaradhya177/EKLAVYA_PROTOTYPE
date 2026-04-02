from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings
class Base(DeclarativeBase):
    pass

engine: AsyncEngine = create_async_engine(settings.db_url, future=True)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


def configure_database(db_url: str) -> None:
    global engine, AsyncSessionLocal
    engine = create_async_engine(db_url, future=True)
    AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
