from __future__ import annotations

import pickle
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core import database
from app.ml.models import MLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def models_dir() -> Path:
    path = Path("models")
    path.mkdir(parents=True, exist_ok=True)
    return path


class ModelRegistry:
    def __init__(self, session_factory: async_sessionmaker[AsyncSession] | None = None, artifact_dir: Path | None = None):
        self.session_factory = session_factory or database.AsyncSessionLocal
        self.artifact_dir = artifact_dir or models_dir()

    async def register(self, name: str, version: str, model_obj, metadata: dict) -> MLModel:
        artifact_path = self.artifact_dir / f"{name}-{version}-{uuid4().hex}.pkl"
        with artifact_path.open("wb") as handle:
            pickle.dump(model_obj, handle)

        async with self.session_factory() as session:
            await session.execute(update(MLModel).where(MLModel.name == name).values(is_active=False))
            record = MLModel(
                name=name,
                version=version,
                artifact_path=str(artifact_path),
                metrics=metadata,
                trained_at=_utcnow(),
                is_active=True,
            )
            session.add(record)
            await session.commit()
            await session.refresh(record)
            return record

    async def _resolve_record(self, session: AsyncSession, name: str, version: str | None = None) -> MLModel | None:
        stmt = select(MLModel).where(MLModel.name == name)
        if version is not None:
            stmt = stmt.where(MLModel.version == version)
        else:
            stmt = stmt.order_by(MLModel.is_active.desc(), MLModel.trained_at.desc(), MLModel.id.desc())
            return (await session.execute(stmt)).scalars().first()
        stmt = stmt.order_by(MLModel.trained_at.desc(), MLModel.id.desc())
        return (await session.execute(stmt)).scalars().first()

    async def load(self, name: str, version: str | None = None):
        async with self.session_factory() as session:
            record = await self._resolve_record(session, name, version)
            if record is None:
                return None
            artifact_path = Path(record.artifact_path)
            if not artifact_path.exists():
                return None
            with artifact_path.open("rb") as handle:
                return pickle.load(handle)

    async def get_record(self, name: str, version: str | None = None) -> MLModel | None:
        async with self.session_factory() as session:
            return await self._resolve_record(session, name, version)

    async def list_models(self) -> list[dict]:
        async with self.session_factory() as session:
            stmt = select(MLModel).order_by(MLModel.name.asc(), MLModel.trained_at.desc(), MLModel.id.desc())
            rows = list((await session.execute(stmt)).scalars().all())
            return [
                {
                    "name": row.name,
                    "version": row.version,
                    "trained_at": row.trained_at,
                    "metrics": row.metrics,
                    "is_active": row.is_active,
                }
                for row in rows
            ]
