# Career Planning Module

This module manages athlete goals, milestones, development plans, and talent signals.

## Talent signal detection

- `breakthrough`: any performance index improves by more than `15%` in the latest 28-day window versus the prior 28-day window.
- `plateau`: all tracked indices stay within `3%` change across a 56-day lookback.
- `decline`: any performance index drops by more than `10%` in the latest 28-day window versus the prior 28-day window.
- `emerging`: athlete is in `grassroots` or `state` tier and has any latest index at `>= 90` percentile in sport.

Signals are persisted and the backend emits a PostgreSQL `NOTIFY` on channel `talent_signals`.

## Development plan schema

`periodization_blocks` is an array of:

```json
{
  "block_name": "Build Phase",
  "start_date": "2026-01-01",
  "end_date": "2026-01-28",
  "focus_areas": ["speed", "recovery"],
  "volume_target": 320
}
```

Each block is expanded with `weekly_load_targets`, computed as:

- `weekly_load_target = volume_target / number_of_weeks_in_block`
- weeks are sliced into contiguous 7-day ranges within the block date range

Validation rules:

- blocks cannot overlap
- blocks must stay within the plan period
- the plan period end must not exceed the latest active career-goal target date
