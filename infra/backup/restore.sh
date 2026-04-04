#!/usr/bin/env sh
set -eu

PYTHONPATH="${PYTHONPATH:-}:/"
export PYTHONPATH
python -m infra.backup.cli restore "$@"
