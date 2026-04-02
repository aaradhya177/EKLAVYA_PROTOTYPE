# Unified Athlete Data Platform (UADP)

`UADP` is the canonical athlete data backbone for AthleteOS. It stores athlete master data, raw event streams, consent state, and rolling feature snapshots.

## Event schema contract

`POST /athletes/{id}/events` accepts this envelope:

```json
{
  "event_type": "wearable.heart_rate",
  "source": "wearable",
  "recorded_at": "2026-04-02T06:30:00Z",
  "payload": {
    "data_category": "health",
    "device_id": "garmin-epix-01",
    "heart_rate": 148,
    "hrv": 62.4,
    "metrics": {
      "cadence": 84,
      "speed": 5.3
    }
  }
}
```

## Contract rules

- `payload.data_category` should be one of `health`, `financial`, or `performance`.
- Any numeric field anywhere inside `payload` is eligible for feature computation.
- Nested numeric fields are flattened using dot notation.
- `payload.metrics.speed` becomes feature `health.metrics.speed.avg`.
- Feature snapshots are stored per athlete, per feature name, and per rolling window: `7d`, `28d`, `90d`.
- Consent enforcement uses `payload.data_category` and feature-name prefixes to determine whether DPDP restrictions apply.
- `recorded_at` should be UTC ISO 8601. If omitted, ingestion time is used in UTC.
