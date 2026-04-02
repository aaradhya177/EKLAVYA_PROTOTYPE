# Seed Data & Fixtures

This module populates AthleteOS with realistic dummy data for local development, frontend integration, and exploratory testing.

## Run The Seed

1. Start the platform services and apply migrations.
2. Run:

```bash
python -m app.seed.seed
```

The seed is idempotent, so running it multiple times reuses or updates existing seed entities instead of duplicating them.

## Docker Compose

Use the optional seed profile:

```bash
docker compose --profile seed up seed
```

## What Gets Seeded

- 10 sports with ontology tags
- 20 athletes across all seeded sports
- athlete, coach, federation admin, and sys admin users
- 90 days of session logs
- injury history for 8 athletes
- career goals for every athlete
- financial records and summaries for 10 athletes
- consent ledgers, including revoked financial consent for 3 athletes
- feature snapshots and baseline performance indices

Default password for seeded users:

```text
Athlete@123
```

## Reset The Database

For local Docker development:

```bash
docker compose down -v
docker compose up -d postgres redis
alembic upgrade head
python -m app.seed.seed
```

For SQLite test databases, remove the generated files under `test_dbs/`.
