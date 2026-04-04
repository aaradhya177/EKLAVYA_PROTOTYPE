# AthleteOS Environment And Secrets

This directory documents the environment and secret-management contract for AthleteOS.

## Environment files

- `.env.example`: complete reference with placeholder values
- `.env.development`: safe local defaults committed to the repo
- `.env.test`: test overrides used automatically during the pytest suite
- `.env.staging`: template only; real values should come from CI, the server environment, or a secret manager

## Variable reference

### App

- `APP_ENV`: `development`, `test`, `staging`, or `production`
- `APP_VERSION`: release version string
- `DEBUG`: enables debug-only behaviors like the Sentry test route outside production
- `SECRET_KEY`: general application secret with no committed real value

### Database

- `DATABASE_URL`: primary SQLAlchemy connection string
- `DB_POOL_SIZE`: base database connection pool size
- `DB_MAX_OVERFLOW`: extra pooled connections allowed during bursts
- `DB_POOL_TIMEOUT`: seconds to wait for a pooled connection

### Redis / Celery

- `REDIS_URL`: primary Redis URL
- `CELERY_BROKER_URL`: Celery broker connection string
- `CELERY_RESULT_BACKEND`: Celery result backend connection string
- `CELERY_TASK_ALWAYS_EAGER`: executes tasks inline for tests and local-only workflows

### JWT

- `JWT_SECRET_KEY`: signing key for access and refresh tokens
- `JWT_ALGORITHM`: token signing algorithm
- `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`: access token TTL
- `JWT_REFRESH_TOKEN_EXPIRE_DAYS`: refresh token TTL

### Storage

- `S3_ENDPOINT_URL`: optional S3 or MinIO endpoint
- `S3_BUCKET_NAME`: storage bucket name
- `S3_ACCESS_KEY`: object storage access key
- `S3_SECRET_KEY`: object storage secret key
- `AWS_REGION`: AWS region for S3 and Secrets Manager
- `FILE_STORAGE_PATH`: local filesystem fallback path

### Email / Firebase

- `SENDGRID_API_KEY`: outbound email provider key
- `FROM_EMAIL`: default sender address
- `FIREBASE_CREDENTIALS_PATH`: path to Firebase service-account credentials

### ML / Monitoring

- `MODELS_DIR`: model artifact directory
- `ML_MIN_AUC_THRESHOLD`: minimum accepted AUC before a model can be promoted
- `SENTRY_DSN`: optional Sentry DSN
- `SLACK_WEBHOOK_URL`: optional Slack webhook for operational notifications

### API behavior

- `RATE_LIMIT_PER_MINUTE`: per-identity request cap
- `CORS_ORIGINS`: comma-separated allowed frontend origins
- `INJURY_KEYWORDS_CONFIG`: path to the injury keyword rules file

## Secret rotation runbook

1. Create the replacement value in AWS Secrets Manager using the exact key name expected by the app, for example `DATABASE_URL`, `JWT_SECRET_KEY`, or `SENDGRID_API_KEY`.
2. Deploy the new secret to staging first and validate login, database connectivity, and any affected integrations.
3. Wait at least five minutes or restart application pods/containers to clear the in-memory secret cache immediately.
4. Promote the same rotated secret to production.
5. Revoke the old credential at the provider after confirming production health checks and smoke tests.

## Operational notes

- In `development`, the `SecretManager` reads directly from the loaded settings values.
- In `production`, the `SecretManager` prefers AWS Secrets Manager and falls back to the loaded settings value if AWS access fails.
- Application code should import the singleton `settings` object or the shared `secret_manager`; it should not read environment variables directly.
