# Financial Management Module

All endpoints in this module require active `financial` consent. If consent is absent or revoked, the API returns HTTP `451`.

## Grant eligibility YAML schema

```yaml
forecast_growth_rates:
  prize_money: 0.05
  sponsorship: 0.08
  government_grant: 0.02
  appearance_fee: 0.04
  other: 0.00

grant_schemes:
  SchemeName:
    min_tiers: ["state", "national"]
    min_age: 14
    max_age: 30
    min_percentile: 80
    states: ["Haryana"]
    eligible_sports: ["Athletics", "Wrestling"]
```

## Notes

- `min_percentile` is evaluated against the athlete's latest best `PerformanceIndex.percentile_in_sport`.
- `eligible_sports: ["*"]` means all sports are allowed.
- `states` is optional and can be omitted for nationwide schemes.
