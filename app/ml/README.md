# ML Model Integration Layer

This module adds trainable ML models on top of the existing rule-based AthleteOS logic while keeping the current API contracts stable.

## Retraining

Train the injury model:

```bash
python -m app.ml.train_injury
```

Train performance forecasting models:

```bash
python -m app.ml.train_performance
```

Or trigger them through the API as a `sys_admin`:

- `POST /api/v1/ml/train/injury`
- `POST /api/v1/ml/train/performance`

Model artifacts are stored under `models/` and metadata is recorded in the `ml_models` table.

## Injury Explanations

`GET /api/v1/ml/injury/explain/{athlete_id}` returns a factor list with:

- `feature`: transformed feature name used by the model
- `value`: feature value for the athlete
- `shap_value`: contribution magnitude
- `direction`: whether the feature increases or decreases predicted risk

If no active injury model exists, the endpoint falls back to the rule-engine contributing factors so callers still get a stable explanation payload.

## Notes

- The injury model is only registered when cross-validated AUC exceeds `0.65`.
- Performance forecasting trains one model per sport.
- Rule-based injury scoring remains the fallback path whenever no active ML artifact is available.
