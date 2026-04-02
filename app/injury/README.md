# Injury Risk Module

This module stores injury history, biomechanical flags, and daily injury-risk scores.

## Rule-based score

- `ACWR > 1.5` adds `0.35`
- `ACWR > 1.3` adds `0.20`
- `Monotony > 2.0` adds `0.15`
- `3+ sessions in 7 days with RPE >= 8` adds `0.20`
- `Prior injury in last 90 days` adds `0.25`
- `Days since last rest day > 6` adds `0.10`
- `Sleep quality < 5` adds `0.10`

Total score is clamped to `[0, 1]`.

## Risk levels

- `0.00 - 0.30` => `low`
- `0.30 - 0.55` => `medium`
- `0.55 - 0.75` => `high`
- `0.75 - 1.00` => `critical`

## YAML config example

```yaml
model_version: rule_based_v1
weights:
  acwr_gt_1_5: 0.35
  acwr_gt_1_3: 0.20
  monotony_gt_2: 0.15
  high_rpe_sessions_7d: 0.20
  prior_injury_same_body_part_90d: 0.25
  days_since_last_rest_day_gt_6: 0.10
  sleep_quality_lt_5: 0.10
```
