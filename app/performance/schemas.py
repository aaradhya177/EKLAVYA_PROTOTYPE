from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.performance.models import SessionType


class SessionCreate(BaseModel):
    athlete_id: UUID
    sport_id: int
    session_type: SessionType
    start_time: datetime
    end_time: datetime | None = None
    rpe: int | None = Field(default=None, ge=1, le=10)
    notes: str | None = None
    raw_metrics: dict[str, Any] = Field(default_factory=dict)
    computed_metrics: dict[str, Any] = Field(default_factory=dict)
    coach_id: UUID | None = None


class SessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    athlete_id: UUID
    sport_id: int
    session_type: SessionType
    start_time: datetime
    end_time: datetime | None
    rpe: int | None
    notes: str | None
    raw_metrics: dict[str, Any]
    computed_metrics: dict[str, Any]
    coach_id: UUID | None


class MetricPoint(BaseModel):
    timestamp: datetime
    metric_name: str
    value: float


class SessionMetricIngest(BaseModel):
    metrics: list[MetricPoint]


class PaginatedSessions(BaseModel):
    items: list[SessionRead]
    total: int
    page: int
    page_size: int


class PerformanceIndexRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    athlete_id: UUID
    session_id: int | None
    index_name: str
    value: float
    percentile_in_sport: float
    computed_at: datetime


class AlertRead(BaseModel):
    athlete_id: UUID
    index_name: str
    value: float
    level: str
    threshold: str
    computed_at: datetime
