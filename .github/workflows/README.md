# AthleteOS Deployment Workflows

This directory contains the GitHub Actions workflows used for AthleteOS CI, staging deployment, and production deployment.

## Workflows

### `ci.yml`

- Trigger: every pull request targeting `main`
- Order: `lint` -> `test` -> `build`
- Responsibilities:
  - Runs `ruff check app/`
  - Runs `black --check app/`
  - Starts PostgreSQL and Redis service containers
  - Installs dependencies from `requirements.txt`
  - Applies Alembic migrations
  - Seeds the database
  - Runs `pytest tests/ -v --cov=app --cov-report=xml --cov-fail-under=70`
  - Uploads `coverage.xml` to Codecov
  - Builds a Docker image and tags it as `ghcr.io/<owner>/athleteos:pr-<PR_NUMBER>`
  - Pushes the PR image to GHCR for same-repository pull requests

### `deploy-staging.yml`

- Trigger: every push to `main`
- Jobs:
  - `build-and-push`: builds and publishes `ghcr.io/<owner>/athleteos:staging-<SHORT_SHA>`
  - `deploy`: SSHes into the staging host, pulls the new image, runs Compose, runs migrations, checks `/health`, then notifies Slack

### `deploy-production.yml`

- Trigger: pushing a Git tag matching `v*.*.*`
- Jobs:
  - `build-and-push`: builds and publishes both `ghcr.io/<owner>/athleteos:<TAG_VERSION>` and `ghcr.io/<owner>/athleteos:latest`
  - `deploy`: gated by the GitHub `production` environment for manual approval, performs a PostgreSQL backup to S3, deploys the new image, runs migrations, checks `/health`, and posts a Slack summary with the release changelog

## Required Secrets

### Shared

- `GHCR_USERNAME`: GitHub username or machine user allowed to pull GHCR packages on the target server
- `GHCR_TOKEN`: personal access token with `read:packages` for the target server
- `SLACK_WEBHOOK`: incoming Slack webhook URL

### CI

- `CODECOV_TOKEN`: Codecov upload token

### Staging

- `STAGING_HOST`: SSH host or IP
- `STAGING_USER`: SSH username
- `STAGING_SSH_KEY`: private SSH key used by GitHub Actions
- `STAGING_APP_DIR`: absolute directory on the staging server that contains `docker-compose.staging.yml`
- `STAGING_HEALTHCHECK_URL`: URL to poll, for example `http://127.0.0.1:8000/health`

### Production

- `PRODUCTION_HOST`: SSH host or IP
- `PRODUCTION_USER`: SSH username
- `PRODUCTION_SSH_KEY`: private SSH key used by GitHub Actions
- `PRODUCTION_APP_DIR`: absolute directory on the production server that contains `docker-compose.staging.yml`
- `PRODUCTION_HEALTHCHECK_URL`: URL to poll, for example `http://127.0.0.1:8000/health`
- `PRODUCTION_BACKUP_S3_URI`: S3 destination prefix for backups, for example `s3://athleteos-db-backups/production`
- `PRODUCTION_POSTGRES_USER`: PostgreSQL user used by `pg_dump`
- `PRODUCTION_POSTGRES_DB`: PostgreSQL database name used by `pg_dump`

## Required Server Environment Variables

`docker-compose.staging.yml` reads configuration entirely from environment variables. Both staging and production hosts should export values such as:

- `ATHLETEOS_IMAGE`
- `APP_ENV`
- `APP_VERSION`
- `DB_URL`
- `REDIS_URL`
- `CELERY_BROKER_URL`
- `CELERY_RESULT_BACKEND`
- `JWT_SECRET_KEY`
- `S3_ENDPOINT_URL`
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `FILE_STORAGE_PATH`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `MINIO_ROOT_USER`
- `MINIO_ROOT_PASSWORD`

## How To Trigger

### Pull request CI

Open or update a pull request against `main`.

### Staging deploy

Merge a commit into `main`. The workflow builds and deploys automatically.

### Production deploy

Push a semantic version tag, for example:

```bash
git tag v1.2.3
git push origin v1.2.3
```

GitHub will pause the deploy job until the `production` environment approval is granted.

## Deployment Flow

1. GitHub Actions builds the Docker image and pushes it to GHCR.
2. The deploy job connects to the target server over SSH.
3. The server logs into GHCR and pulls the new image.
4. `docker compose -f docker-compose.staging.yml up -d` updates the stack.
5. Alembic migrations run inside the `api` container.
6. The workflow polls `/health` up to five times with a 10 second delay.
7. Slack receives a success or failure notification.

## Notes

- The repository’s automated tests currently live under `tests/`, so CI and the `Makefile` target point there even though coverage still measures `app/`.
- The staging compose file intentionally does not use `.env`; all variables must be present in the server environment.
- The PR image push step is skipped for forked pull requests because GitHub does not expose write-capable package credentials to untrusted forks.
- Production backup assumes the target host has the AWS CLI installed and authenticated for the configured S3 bucket.
