# AthleteOS Coach Dashboard

Next.js 14 App Router dashboard for coaches, built with Tailwind, TanStack Query, Zustand, Recharts, and a lightweight shadcn-style base layer.

## Local development

From `frontend/web/apps/coach`:

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

## Feature guide

- `app/(auth)/login/page.tsx`: coach login entry
- `app/(dashboard)/page.tsx`: overview dashboard with summary metrics, risk alerts, team load, talent signals, and quick actions
- `app/(dashboard)/athletes`: searchable roster and athlete drill-down tabs
- `app/(dashboard)/alerts`: active alert operations with polling and browser notifications
- `app/(dashboard)/plans`: list and builder for periodization plans
- `app/(dashboard)/files`: athlete file browser with upload/preview/download flow
- `app/(dashboard)/settings`: coach profile and notification preferences

## State

- `src/stores/coach-store.ts`: coach profile and selected athlete
- `src/stores/alert-store.ts`: active alerts, last-checked timestamp, acknowledge actions
- `src/stores/plan-store.ts`: draft plan editing, add/remove/update, overlap validation

## Tests

```bash
npm test
```

The suite covers:

- plan overlap validation
- CSV export formatting
- athlete roster search and filter behavior
- plan builder submit flow
- dashboard snapshot coverage
- alert polling rerender behavior
