from datetime import date, datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.career.models import CareerGoalStatus, CareerGoalType, TalentSignalType


class CareerGoalCreate(BaseModel):
    athlete_id: UUID
    goal_type: CareerGoalType
    target_date: date
    priority_event: str | None = None
    status: CareerGoalStatus = CareerGoalStatus.active


class CareerGoalRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    athlete_id: UUID
    goal_type: CareerGoalType
    target_date: date
    priority_event: str | None
    status: CareerGoalStatus
    created_at: datetime


class CareerMilestoneCreate(BaseModel):
    athlete_id: UUID
    milestone_type: str
    achieved_at: datetime
    description: str
    verified_by: UUID | None = None


class CareerMilestoneRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    athlete_id: UUID
    milestone_type: str
    achieved_at: datetime
    description: str
    verified_by: UUID | None


class PeriodizationBlockInput(BaseModel):
    block_name: str
    start_date: date
    end_date: date
    focus_areas: list[str]
    volume_target: float = Field(gt=0)


class DevelopmentPlanCreate(BaseModel):
    athlete_id: UUID
    coach_id: UUID
    plan_period_start: date
    plan_period_end: date
    goals: list[dict[str, Any]] = Field(default_factory=list)
    periodization_blocks: list[PeriodizationBlockInput]


class DevelopmentPlanRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    athlete_id: UUID
    coach_id: UUID
    plan_period_start: date
    plan_period_end: date
    goals: list[dict]
    periodization_blocks: list[dict]
    created_at: datetime
    updated_at: datetime


class TalentSignalRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    athlete_id: UUID
    signal_type: TalentSignalType
    computed_at: datetime
    evidence: list[dict]
