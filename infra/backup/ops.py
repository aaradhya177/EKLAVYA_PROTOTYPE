from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
from collections.abc import Iterable
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path
from urllib.parse import urlparse

import boto3
from sqlalchemy import create_engine, inspect, text


@dataclass
class BackupResult:
    path: Path
    filename: str
    s3_key: str | None = None


def utcnow() -> datetime:
    return datetime.now(UTC)


def timestamped_filename(prefix: str = "athleteos") -> str:
    return f"{prefix}_{utcnow().strftime('%Y-%m-%d_%H-%M-%S')}.dump"


def parse_s3_uri(uri: str) -> tuple[str, str]:
    if not uri.startswith("s3://"):
        raise ValueError(f"Expected s3:// URI, got: {uri}")
    parsed = urlparse(uri)
    return parsed.netloc, parsed.path.lstrip("/")


def _sqlite_path(db_url: str) -> Path:
    if not db_url.startswith("sqlite"):
        raise ValueError("Not a sqlite URL")
    database = db_url.split("///", 1)[-1]
    return Path(database)


def _postgres_env(parsed) -> dict[str, str]:
    env = os.environ.copy()
    if parsed.password:
        env["PGPASSWORD"] = parsed.password
    return env


def create_dump(*, db_url: str, output_dir: Path, prefix: str = "athleteos") -> BackupResult:
    output_dir.mkdir(parents=True, exist_ok=True)
    filename = timestamped_filename(prefix)
    output_path = output_dir / filename

    if db_url.startswith("sqlite"):
        source_path = _sqlite_path(db_url)
        if not source_path.exists():
            raise FileNotFoundError(f"SQLite database not found: {source_path}")
        shutil.copy2(source_path, output_path)
        return BackupResult(path=output_path, filename=filename)

    parsed = urlparse(db_url)
    command = [
        "pg_dump",
        "--format=custom",
        "--file",
        str(output_path),
        "--host",
        parsed.hostname or "localhost",
        "--port",
        str(parsed.port or 5432),
        "--username",
        parsed.username or "postgres",
        parsed.path.lstrip("/"),
    ]
    subprocess.run(command, check=True, env=_postgres_env(parsed))
    return BackupResult(path=output_path, filename=filename)


def upload_to_s3(*, file_path: Path, bucket: str, key: str, endpoint_url: str | None = None) -> None:
    client = boto3.client("s3", endpoint_url=endpoint_url or None)
    client.upload_file(str(file_path), bucket, key)
    client.head_object(Bucket=bucket, Key=key)


def backup_database(
    *,
    db_url: str,
    output_dir: Path,
    destination: str = "daily",
    s3_bucket: str | None = None,
    s3_endpoint_url: str | None = None,
    skip_s3: bool = False,
) -> BackupResult:
    result = create_dump(db_url=db_url, output_dir=output_dir)
    if skip_s3:
        print(f"Backup created locally: {result.path}")
        return result

    if not s3_bucket:
        raise ValueError("s3_bucket is required when skip_s3 is False")

    key = f"backups/{destination}/{result.filename}"
    upload_to_s3(file_path=result.path, bucket=s3_bucket, key=key, endpoint_url=s3_endpoint_url)
    print(f"Backup uploaded successfully to s3://{s3_bucket}/{key}")
    result.s3_key = key
    result.path.unlink(missing_ok=True)
    return result


def restore_database(*, backup_source: str, target_db_url: str, confirm: bool) -> Path:
    if not confirm:
        raise ValueError("--confirm flag is required for restore")

    temp_dir = Path(tempfile.mkdtemp(prefix="athleteos-restore-"))
    dump_path = temp_dir / "restore.dump"

    if backup_source.startswith("s3://"):
        bucket, key = parse_s3_uri(backup_source)
        boto3.client("s3").download_file(bucket, key, str(dump_path))
    else:
        shutil.copy2(Path(backup_source), dump_path)

    if target_db_url.startswith("sqlite"):
        target_path = _sqlite_path(target_db_url)
        target_path.parent.mkdir(parents=True, exist_ok=True)
        if target_path.exists():
            target_path.unlink()
        shutil.copy2(dump_path, target_path)
        return target_path

    parsed = urlparse(target_db_url)
    database_name = parsed.path.lstrip("/")
    admin_db_url = parsed._replace(path="/postgres").geturl()
    admin_parsed = urlparse(admin_db_url)
    dropdb = [
        "dropdb",
        "--if-exists",
        "--host",
        admin_parsed.hostname or "localhost",
        "--port",
        str(admin_parsed.port or 5432),
        "--username",
        admin_parsed.username or "postgres",
        database_name,
    ]
    createdb = [
        "createdb",
        "--host",
        admin_parsed.hostname or "localhost",
        "--port",
        str(admin_parsed.port or 5432),
        "--username",
        admin_parsed.username or "postgres",
        database_name,
    ]
    restore = [
        "pg_restore",
        "--clean",
        "--if-exists",
        "--no-owner",
        "--host",
        parsed.hostname or "localhost",
        "--port",
        str(parsed.port or 5432),
        "--username",
        parsed.username or "postgres",
        "--dbname",
        database_name,
        str(dump_path),
    ]
    env = _postgres_env(parsed)
    subprocess.run(dropdb, check=True, env=env)
    subprocess.run(createdb, check=True, env=env)
    subprocess.run(restore, check=True, env=env)
    return dump_path


def run_alembic_upgrade() -> None:
    subprocess.run(["alembic", "upgrade", "head"], check=True)


def run_alembic_upgrade_for(db_url: str) -> None:
    env = os.environ.copy()
    env["DATABASE_URL"] = db_url
    subprocess.run(["alembic", "upgrade", "head"], check=True, env=env)


def row_counts(db_url: str, tables: Iterable[str]) -> dict[str, int]:
    engine = create_engine(db_url.replace("+asyncpg", "").replace("+aiosqlite", ""))
    counts: dict[str, int] = {}
    with engine.connect() as connection:
        for table in tables:
            counts[table] = int(connection.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar_one())
    return counts


def latest_local_backup(directory: Path) -> Path | None:
    candidates = sorted(directory.glob("*.dump"), key=lambda item: item.stat().st_mtime, reverse=True)
    return candidates[0] if candidates else None


def latest_s3_backup(*, bucket: str, prefix: str = "backups/daily/", endpoint_url: str | None = None) -> str | None:
    client = boto3.client("s3", endpoint_url=endpoint_url or None)
    response = client.list_objects_v2(Bucket=bucket, Prefix=prefix)
    contents = sorted(response.get("Contents", []), key=lambda item: item["LastModified"], reverse=True)
    if not contents:
        return None
    return f"s3://{bucket}/{contents[0]['Key']}"


def cleanup_predeploy_local(directory: Path, keep: int = 10) -> list[Path]:
    backups = sorted(directory.glob("*.dump"), key=lambda item: item.stat().st_mtime, reverse=True)
    removed: list[Path] = []
    for path in backups[keep:]:
        path.unlink(missing_ok=True)
        removed.append(path)
    return removed


def cleanup_local_retention(
    directory: Path,
    *,
    now: datetime | None = None,
    daily_days: int = 30,
    weekly_days: int = 180,
) -> list[Path]:
    now = now or utcnow()
    removed: list[Path] = []
    for bucket_name, retention_days in (("daily", daily_days), ("weekly", weekly_days)):
        bucket_dir = directory / bucket_name
        if not bucket_dir.exists():
            continue
        for path in bucket_dir.glob("*.dump"):
            modified = datetime.fromtimestamp(path.stat().st_mtime, UTC)
            if modified < now - timedelta(days=retention_days):
                path.unlink(missing_ok=True)
                removed.append(path)
    return removed


def apply_s3_lifecycle_rules(*, bucket: str, endpoint_url: str | None = None) -> None:
    client = boto3.client("s3", endpoint_url=endpoint_url or None)
    client.put_bucket_lifecycle_configuration(
        Bucket=bucket,
        LifecycleConfiguration={
            "Rules": [
                {
                    "ID": "daily-backups",
                    "Status": "Enabled",
                    "Filter": {"Prefix": "backups/daily/"},
                    "Expiration": {"Days": 30},
                },
                {
                    "ID": "weekly-backups",
                    "Status": "Enabled",
                    "Filter": {"Prefix": "backups/weekly/"},
                    "Expiration": {"Days": 180},
                },
            ]
        },
    )


def cleanup_predeploy_s3(*, bucket: str, prefix: str = "backups/pre-deploy/", keep: int = 10, endpoint_url: str | None = None) -> list[str]:
    client = boto3.client("s3", endpoint_url=endpoint_url or None)
    response = client.list_objects_v2(Bucket=bucket, Prefix=prefix)
    contents = sorted(response.get("Contents", []), key=lambda item: item["LastModified"], reverse=True)
    removed: list[str] = []
    for item in contents[keep:]:
        client.delete_object(Bucket=bucket, Key=item["Key"])
        removed.append(item["Key"])
    return removed
