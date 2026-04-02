import json

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def notify(session: AsyncSession, channel: str, payload: dict) -> None:
    if session.bind is None or session.bind.dialect.name != "postgresql":
        return
    await session.execute(
        text("SELECT pg_notify(:channel, :payload)"),
        {"channel": channel, "payload": json.dumps(payload)},
    )
