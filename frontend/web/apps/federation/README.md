# AthleteOS Federation Portal

Federation-level administrative portal for national analytics, grants, compliance, and talent pipeline management.

## Local development

From `frontend/web/apps/federation`:

```bash
npm install
npm run dev
```

Create `.env.local` from the example:

```bash
cp .env.local.example .env.local
```

Set:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## Feature overview

- national overview dashboard with state density map, sport breakdown, risk distribution, signals, and top performers
- federation-wide athlete roster with advanced filters and Excel export
- talent identification board with tier movement across the national pipeline
- sport deep dives with performance distribution, leaderboard, heatmap, and risk trend
- grants operations, disbursement tracking, and eligibility gaps
- report generation with polling and lightweight client-side PDF support
- compliance audit views for DPDP-aligned consent oversight

## Role permission matrix

- `federation_admin`: full access to every page in this app
- `coach`: denied from portal routes
- `athlete`: denied from portal routes
- unauthenticated: redirected to `/login`

## State

- `federationStore`: selected state and sport filters
- `talentBoardStore`: talent board tiers and move actions
- `reportStore`: pending and generated report jobs

## Tests

```bash
npm test
```

Coverage includes:

- talent board tier promotion
- grant eligibility filtering
- state-map filtering into the athlete roster
- report generation and completion flow
- compliance revoked-consent display
- role guard redirect behavior
