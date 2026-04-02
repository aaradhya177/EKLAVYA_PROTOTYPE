from datetime import date, datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.uadp.models import AthleteTier, DataCategory, EventSource, FeatureWindow, SportCategory


class SportCreate(BaseModel):
    name: str
    category: SportCategory
    ontology_tags: dict[str, Any] = Field(default_factory=dict)


class SportRead(SportCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int


class AthleteCreate(BaseModel):
    name: str
    dob: date
    gender: str
    sport_id: int
    state: str
    tier: AthleteTier


class AthleteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    dob: date
    gender: str
    sport_id: int
    state: str
    tier: AthleteTier
    created_at: datetime


class EventCreate(BaseModel):
    event_type: str
    payload: dict[str, Any]
    source: EventSource
    recorded_at: datetime | None = None


class EventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    athlete_id: UUID
    event_type: str
    payload: dict[str, Any]
    source: EventSource
    recorded_at: datetime


class PaginatedEvents(BaseModel):
    items: list[EventRead]
    total: int
    page: int
    page_size: int


class ConsentUpsert(BaseModel):
    data_category: DataCategory
    consented: bool


class ConsentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    athlete_id: UUID
    data_category: DataCategory
    consented: bool
    consented_at: datetime | None
    revoked_at: datetime | None


class FeatureSnapshotRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    athlete_id: UUID
    feature_name: str
    value: float
    window: FeatureWindow
    computed_at: datetime
