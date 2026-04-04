# AthleteOS Shared Frontend Foundation

`frontend/shared` is the design-system and domain-contract package used by every AthleteOS frontend surface:

- `frontend/mobile` imports the native component and chart variants.
- `frontend/web` imports the web component and chart variants.

## Structure

- `tokens/`: colors, typography, spacing, radius, and shadow primitives.
- `types/`: backend-mirrored TypeScript models plus auth and form contracts.
- `schemas/`: Zod runtime validation for every shared type.
- `components/`: cross-platform UI primitives with `.web.tsx` and `.native.tsx` implementations.
- `components/charts/`: Recharts wrappers for web and Victory Native wrappers for mobile.
- `navigation/`: typed route contracts for Next.js and React Navigation.
- `utils/`: presentation-safe formatter and domain helper functions.
- `.storybook/` and `stories/`: Storybook setup for web component review.
- `tests/`: utility, schema, snapshot, and export coverage.

## Tokens

The palette is built around AthleteOS sports workflows:

- `primary`: planning, navigation, and product chrome.
- `teal`: readiness, positive trend, and stable workload states.
- `coral`: elevated attention states and coaching interventions.
- `amber`: caution, load watch, and in-progress states.
- `green`: healthy baselines and successful outcomes.
- `red`: critical risk and blocking failures.
- `gray`: neutral surfaces, strokes, and text hierarchy.

Typography uses `Inter` for interface copy and `JetBrains Mono` for compact metric readouts or code-like telemetry.

Spacing follows a 4px base unit:

- `spacing[1] = 4`
- `spacing[2] = 8`
- `spacing[3] = 12`
- `spacing[4] = 16`
- `spacing[5] = 20`
- `spacing[6] = 24`
- `spacing[8] = 32`
- `spacing[10] = 40`
- `spacing[12] = 48`
- `spacing[16] = 64`

## Usage

Web:

```tsx
import { Button, Card, MetricTile } from "@athleteos/shared/components/index.web";
```

Mobile:

```tsx
import { Button, Card, RiskIndicator } from "@athleteos/shared/components/index.native";
```

Validation:

```ts
import { AthleteSchema } from "@athleteos/shared/schemas";

const athlete = AthleteSchema.parse(payload);
```

## Storybook

From `frontend/shared`:

```bash
npm install
npm run storybook
```

Use the toolbar contrast toggle to preview dark-mode framing around the same components.

## Tests

From `frontend/shared`:

```bash
npm install
npm test
```

The suite covers:

- utility functions
- schema validation with valid and invalid payloads
- snapshot coverage for web component states
- explicit web/native export surface checks
