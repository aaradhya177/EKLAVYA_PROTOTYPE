from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class MLModelRead(BaseModel):
    name: str
    version: str
    trained_at: datetime
    metrics: dict
    is_active: bool


class InjuryExplanationFactor(BaseModel):
    feature: str
    value: float | str
    shap_value: float
    direction: str
