#!/usr/bin/env sh
set -eu

set -- backup \
  --db-url "${DATABASE_URL}" \
  --output-dir "${BACKUP_OUTPUT_DIR:-/tmp/athleteos-backups}" \
  --destination "${BACKUP_DESTINATION:-daily}"

if [ -n "${S3_BUCKET_NAME:-}" ]; then
  set -- "$@" --s3-bucket "${S3_BUCKET_NAME}"
fi

if [ -n "${S3_ENDPOINT_URL:-}" ]; then
  set -- "$@" --s3-endpoint-url "${S3_ENDPOINT_URL}"
fi

if [ "${BACKUP_SKIP_S3:-}" = "1" ] || [ "${BACKUP_SKIP_S3:-}" = "true" ]; then
  set -- "$@" --skip-s3
fi

PYTHONPATH="${PYTHONPATH:-}:/"
export PYTHONPATH
python -m infra.backup.cli "$@"
