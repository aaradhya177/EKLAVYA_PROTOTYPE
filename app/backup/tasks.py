from __future__ import annotations

import os
import subprocess
from datetime import datetime
from pathlib import Path

import httpx
from celery.schedules import crontab

from app.core.celery_app import celery_app
from app.core.config import settings
from infra.backup.ops import latest_local_backup, latest_s3_backup, restore_database, run_alembic_upgrade_for


def _notify_slack(message: str, *, critical: bool = False) -> None:
    if not settings.SLACK_WEBHOOK_URL:
        return
    prefix = "[CRITICAL] " if critical else "[INFO] "
    try:
        httpx.post(settings.SLACK_WEBHOOK_URL, json={"text": prefix + message}, timeout=10.0)
    except Exception:
        pass


@celery_app.task(name="daily_backup")
def daily_backup() -> int:
    try:
        env = os.environ.copy()
        env["BACKUP_DESTINATION"] = "weekly" if datetime.now().weekday() == 6 else "daily"
        subprocess.run(["/infra/backup/backup.sh"], check=True, env=env)
        _notify_slack("Daily backup completed successfully.")
        return 0
    except Exception as exc:
        _notify_slack(f"Daily backup failed: {exc}", critical=True)
        raise


@celery_app.task(name="weekly_backup_verify")
def weekly_backup_verify() -> int:
    verify_db_url = os.environ.get("VERIFY_DATABASE_URL", "sqlite:///./test_dbs/verify_athleteos.db")
    backup_dir = Path(os.environ.get("BACKUP_OUTPUT_DIR", "./infra/backup/tmp"))
    latest_source: str | None = None
    if os.environ.get("S3_BUCKET_NAME"):
        latest_source = latest_s3_backup(bucket=os.environ["S3_BUCKET_NAME"], endpoint_url=os.environ.get("S3_ENDPOINT_URL"))
    else:
        latest = latest_local_backup(backup_dir)
        latest_source = str(latest) if latest else None
    if latest_source is None:
        _notify_slack("Weekly backup verify failed: no backup file found.", critical=True)
        raise FileNotFoundError("No backup file found for verification")

    try:
        restore_database(backup_source=latest_source, target_db_url=verify_db_url, confirm=True)
        run_alembic_upgrade_for(verify_db_url)
        env = os.environ.copy()
        env["DATABASE_URL"] = verify_db_url
        env["APP_ENV"] = "test"
        env["JWT_SECRET_KEY"] = env.get("JWT_SECRET_KEY", "verify-jwt-secret")
        env["SECRET_KEY"] = env.get("SECRET_KEY", "verify-secret-key")
        result = subprocess.run(
            ["python", "-m", "pytest", "app/tests/smoke", "-q", "-p", "no:cacheprovider"],
            check=True,
            env=env,
        )
        _notify_slack("Weekly backup verification passed.")
        return result.returncode
    except Exception as exc:
        _notify_slack(f"Weekly backup verification failed: {exc}", critical=True)
        raise
    finally:
        if verify_db_url.startswith("sqlite:///"):
            verify_path = Path(verify_db_url.split("///", 1)[1])
            verify_path.unlink(missing_ok=True)


celery_app.conf.beat_schedule.update(
    {
        "daily-backup-1am-ist": {
            "task": "daily_backup",
            "schedule": crontab(hour=1, minute=0),
        },
        "weekly-backup-verify-3am-ist": {
            "task": "weekly_backup_verify",
            "schedule": crontab(hour=3, minute=0, day_of_week="sun"),
        },
    }
)
