from __future__ import annotations

import argparse
import sys
from pathlib import Path

from infra.backup.ops import backup_database, restore_database, row_counts, run_alembic_upgrade_for


def backup_command(args: argparse.Namespace) -> int:
    try:
        result = backup_database(
            db_url=args.db_url,
            output_dir=Path(args.output_dir),
            destination=args.destination,
            s3_bucket=args.s3_bucket,
            s3_endpoint_url=args.s3_endpoint_url,
            skip_s3=args.skip_s3,
        )
        print(f"Backup success: {result.filename}")
        return 0
    except Exception as exc:
        print(f"Backup failed: {exc}")
        return 1


def restore_command(args: argparse.Namespace) -> int:
    try:
        restore_database(backup_source=args.backup_key, target_db_url=args.target_db, confirm=args.confirm)
        run_alembic_upgrade_for(args.target_db)
        counts = row_counts(args.target_db, ("athletes", "session_logs", "risk_scores"))
        print(f"Restore success. Row counts: {counts}")
        return 0
    except Exception as exc:
        print(f"Restore failed: {exc}")
        return 1


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command", required=True)

    backup = subparsers.add_parser("backup")
    backup.add_argument("--db-url", required=True)
    backup.add_argument("--output-dir", default="./infra/backup/tmp")
    backup.add_argument("--destination", default="daily")
    backup.add_argument("--s3-bucket")
    backup.add_argument("--s3-endpoint-url")
    backup.add_argument("--skip-s3", action="store_true")
    backup.set_defaults(func=backup_command)

    restore = subparsers.add_parser("restore")
    restore.add_argument("--backup-key", required=True)
    restore.add_argument("--target-db", required=True)
    restore.add_argument("--confirm", action="store_true")
    restore.set_defaults(func=restore_command)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
