# AthleteOS Backup And Recovery

This directory contains the backup, restore, and retention tooling for AthleteOS.

## Daily backup flow

1. `backup.sh` creates a compressed custom-format dump named `athleteos_YYYY-MM-DD_HH-MM-SS.dump`.
2. The dump is uploaded to S3 under one of:
   - `backups/daily/`
   - `backups/pre-deploy/`
3. The upload is verified with an S3 `HEAD` request.
4. The local dump file is deleted after a successful upload.
5. Failures return exit code `1` so CI or orchestration can detect them.

## Restore command

Run:

```bash
/infra/backup/restore.sh --backup-key s3://bucket/key --target-db <DB_URL> --confirm
```

The script:

1. Downloads the backup dump.
2. Drops and recreates the target database.
3. Restores the dump.
4. Runs `alembic upgrade head`.
5. Prints row counts for core tables as a sanity check.

## Retention policy

- `backups/daily/`: 30 days
- `backups/weekly/`: 180 days
- `backups/pre-deploy/`: keep 10 most recent backups

The S3 lifecycle rules can be applied with the helper in `infra.backup.ops.apply_s3_lifecycle_rules`.

## Disaster recovery runbook

Target: full restore in under 30 minutes.

1. Identify the backup to restore.
   Use the latest successful `daily`, `weekly`, or `pre-deploy` object in S3.
2. Prepare the target environment.
   Confirm PostgreSQL is reachable, application traffic is paused or routed away, and you have the correct `DATABASE_URL`.
3. Run the restore command with `--confirm`.
4. Wait for `pg_restore` and Alembic migration completion.
5. Verify row counts printed by the restore script.
6. Run smoke checks:
   `python -m pytest app/tests/smoke -q -p no:cacheprovider`
7. Start the API and worker processes.
8. Check `/health` and `/metrics`.
9. Resume traffic.

## Notes

- Weekly verification restores the latest backup into a temporary verification database and runs the smoke suite automatically.
- Backup failures send a critical Slack notification when `SLACK_WEBHOOK_URL` is configured.
