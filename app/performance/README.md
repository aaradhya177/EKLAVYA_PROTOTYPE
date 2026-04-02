# Performance Tracking Module

This module stores athlete session data, derives workload indices, and exposes longitudinal performance views.

## Computed metric formulas

- `session_load = rpe x duration_min`
- `acute_load = sum(session_load over last 7 days)`
- `chronic_load = sum(session_load over last 28 days) / 4`
- `acwr = acute_load / chronic_load`
- `daily_load = sum(session_load grouped by UTC calendar day)`
- `monotony = mean(daily_load over last 7 days) / std(daily_load over last 7 days)`
- `strain = monotony x sum(daily_load over last 7 days)`

## Percentile scoring

- Each computed index is ranked against the latest value for other athletes in the same `sport_id` and `tier`.
- Percentile uses midpoint ranking:
  `((count_less + 0.5 x count_equal) / cohort_size) x 100`

## Alerts

- `ACWR > 1.5` => `red`
- `1.3 <= ACWR <= 1.5` => `yellow`
- Values below `1.3` do not emit an alert.
