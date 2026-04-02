from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.injury.models import InjurySeverity, RiskLevel


class InjuryRecordCreate(BaseModel):
    athlete_id: UUID
    body_part: str
    injury_type: str
    severity: InjurySeverity
    occurred_at: datetime
    returned_at: datetime | None = None
    reported_by: UUID
    notes: str | None = None


class InjuryRecordRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    athlete_id: UUID
    body_part: str
    injury_type: str
    severity: InjurySeverity
    occurred_at: datetime
    returned_at: datetime | None
    reported_by: UUID
    notes: str | None


class RiskScoreRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    athlete_id: UUID
    score: float
    risk_level: RiskLevel
    contributing_factors: list[dict]
    computed_at: datetime
    model_version: str


class InjuryAlertRead(BaseModel):
    athlete_id: UUID
    athlete_name: str
    risk_score: float
    risk_level: RiskLevel
    computed_at: datetime
