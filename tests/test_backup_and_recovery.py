from __future__ import annotations

import os
import subprocess
import sys
import tempfile
from datetime import UTC, datetime, timedelta
from pathlib import Path
from shutil import rmtree

from alembic.config import Config
from alembic.script import ScriptDirectory

from app.core.database import Base
from app.seed.seed import seed_database
from infra.backup.ops import backup_database, cleanup_local_retention, restore_database, row_counts
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine


def _sqlite_async_url(db_path: Path) -> str:
    return f"sqlite+aiosqlite:///{db_path.resolve().as_posix()}"


def _sqlite_sync_url(db_path: Path) -> str:
    return f"sqlite:///{db_path.resolve().as_posix()}"


async def _seed_sqlite_database(db_path: Path) -> None:
    engine = create_async_engine(_sqlite_async_url(db_path), future=True)
    session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.exec_driver_sql("CREATE TABLE IF NOT EXISTS alembic_version (version_num VARCHAR(32) NOT NULL)")
        head = ScriptDirectory.from_config(Config("alembic.ini")).get_current_head()
        await conn.exec_driver_sql("DELETE FROM alembic_version")
        await conn.exec_driver_sql("INSERT INTO alembic_version (version_num) VALUES (:head)", {"head": head})
    async with session_factory() as session:
        await seed_database(session, commit=True)
    await engine.dispose()


class WorkspaceTempDir:
    def __enter__(self) -> Path:
        base_dir = Path(tempfile.gettempdir()) / "athleteos-pytest"
        base_dir.mkdir(parents=True, exist_ok=True)
        self.path = Path(tempfile.mkdtemp(prefix="athleteos-backup-", dir=base_dir))
        return self.path

    def __exit__(self, exc_type, exc, tb) -> None:
        rmtree(self.path, ignore_errors=True)


async def test_backup_script_produces_valid_dump_file_local_mode():
    with WorkspaceTempDir() as temp_dir:
        db_path = temp_dir / "source.db"
        await _seed_sqlite_database(db_path)

        result = backup_database(
            db_url=_sqlite_async_url(db_path),
            output_dir=temp_dir / "backups",
            skip_s3=True,
        )

        assert result.path.exists()
        assert result.path.suffix == ".dump"


async def test_restore_script_from_local_dump():
    with WorkspaceTempDir() as temp_dir:
        source_db = temp_dir / "source.db"
        target_db = temp_dir / "restored.db"
        await _seed_sqlite_database(source_db)

        result = backup_database(
            db_url=_sqlite_async_url(source_db),
            output_dir=temp_dir / "backups",
            skip_s3=True,
        )
        restored_path = restore_database(
            backup_source=str(result.path),
            target_db_url=_sqlite_async_url(target_db),
            confirm=True,
        )

        assert Path(restored_path).exists()
        counts = row_counts(_sqlite_sync_url(target_db), ("athletes", "session_logs", "performance_indices"))
        assert counts["athletes"] > 0
        assert counts["session_logs"] > 0


async def test_smoke_tests_pass_on_seeded_database():
    with WorkspaceTempDir() as temp_dir:
        db_path = temp_dir / "smoke.db"
        await _seed_sqlite_database(db_path)

        env = os.environ.copy()
        env.update(
            {
                "APP_ENV": "test",
                "SECRET_KEY": "test-secret",
                "DATABASE_URL": _sqlite_async_url(db_path),
                "JWT_SECRET_KEY": "test-jwt-secret",
                "REDIS_URL": "memory://",
                "CELERY_BROKER_URL": "memory://",
                "CELERY_RESULT_BACKEND": "cache+memory://",
                "CELERY_TASK_ALWAYS_EAGER": "true",
            }
        )
        subprocess.run(
            [sys.executable, "-m", "pytest", "app/tests/smoke", "-q", "-p", "no:cacheprovider"],
            check=True,
            env=env,
        )


def test_retention_cleanup_removes_files_older_than_policy():
    with WorkspaceTempDir() as temp_dir:
        daily = temp_dir / "daily"
        weekly = temp_dir / "weekly"
        daily.mkdir()
        weekly.mkdir()
        old_daily = daily / "old.dump"
        old_weekly = weekly / "old.dump"
        recent_daily = daily / "recent.dump"
        for path in (old_daily, old_weekly, recent_daily):
            path.write_text("backup")

        old_time = (datetime.now(UTC) - timedelta(days=200)).timestamp()
        recent_time = (datetime.now(UTC) - timedelta(days=1)).timestamp()
        os.utime(old_daily, (old_time, old_time))
        os.utime(old_weekly, (old_time, old_time))
        os.utime(recent_daily, (recent_time, recent_time))

        removed = cleanup_local_retention(temp_dir)

        assert old_daily in removed
        assert old_weekly in removed
        assert recent_daily.exists()
