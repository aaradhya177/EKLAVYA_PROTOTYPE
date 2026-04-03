from __future__ import annotations

from uuid import UUID

import pandas as pd
import shap
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.injury.engine import RiskEngine
from app.ml.base import ModelRegistry
from app.ml.injury_model import FEATURE_COLUMNS
from app.ml.models import MLModel
from app.uadp.models import Athlete


async def list_registered_models() -> list[dict]:
    registry = ModelRegistry()
    return await registry.list_models()


async def get_active_model_record(name: str) -> MLModel | None:
    registry = ModelRegistry()
    return await registry.get_record(name)


async def explain_injury_prediction(session: AsyncSession, athlete_id: UUID) -> list[dict]:
    athlete = await session.get(Athlete, athlete_id)
    if athlete is None:
        raise HTTPException(status_code=404, detail="Athlete not found")

    engine = RiskEngine(session)
    feature_vector = await engine.build_ml_feature_vector(athlete_id)
    registry = ModelRegistry()
    model = await registry.load("injury_risk")
    if model is None:
        evaluation = await engine.evaluate(athlete_id)
        return [
            {
                "feature": factor["factor"],
                "value": factor["value"],
                "shap_value": float(factor["weight"]),
                "direction": "increases_risk" if float(factor["weight"]) >= 0 else "decreases_risk",
            }
            for factor in evaluation.contributing_factors
        ]

    row = pd.DataFrame([{column: feature_vector.get(column, 0.0) for column in FEATURE_COLUMNS}])
    preprocessor = model.named_steps["preprocessor"]
    transformed = preprocessor.transform(row)
    classifier = model.named_steps["classifier"]
    explainer = shap.TreeExplainer(classifier)
    shap_values = explainer.shap_values(transformed)
    if isinstance(shap_values, list):
        shap_row = shap_values[-1][0]
    else:
        shap_row = shap_values[0]
    feature_names = list(preprocessor.get_feature_names_out())
    result: list[dict] = []
    transformed_values = transformed[0]
    for name, value, shap_value in zip(feature_names, transformed_values, shap_row, strict=False):
        result.append(
            {
                "feature": str(name),
                "value": float(value),
                "shap_value": float(shap_value),
                "direction": "increases_risk" if float(shap_value) >= 0 else "decreases_risk",
            }
        )
    result.sort(key=lambda item: abs(item["shap_value"]), reverse=True)
    return result
