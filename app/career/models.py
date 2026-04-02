import enum
import uuid
from datetime import date, datetime, timezone

from sqlalchemy import JSON, Date, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


json_type = JSON().with_variant(JSONB, "postgresql")


class CareerGoalType(str, enum.Enum):
    peak_event = "peak_event"
    extend_career = "extend_career"
    transition = "transition"
    retirement = "retirement"


class CareerGoalStatus(str, enum.Enum):
    active = "active"
    achieved = "achieved"
    abandoned = "abandoned"


class TalentSignalType(str, enum.Enum):
    breakthrough = "breakthrough"
    plateau = "plateau"
    decline = "decline"
    emerging = "emerging"


class CareerGoal(Base):
    __tablename__ = "career_goals"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    athlete_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("athletes.id"), nullable=False, index=True)
    goal_type: Mapped[CareerGoalType] = mapped_column(Enum(CareerGoalType), nullable=False)
    target_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    priority_event: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[CareerGoalStatus] = mapped_column(Enum(CareerGoalStatus), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class CareerMilestone(Base):
    __tablename__ = "career_milestones"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    athlete_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("athletes.id"), nullable=False, index=True)
    milestone_type: Mapped[str] = mapped_column(String(255), nullable=False)
    achieved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    verified_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)


class DevelopmentPlan(Base):
    __tablename__ = "development_plans"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    athlete_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("athletes.id"), nullable=False, index=True)
    coach_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    plan_period_start: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    plan_period_end: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    goals: Mapped[list[dict]] = mapped_column(json_type, default=list, nullable=False)
    periodization_blocks: Mapped[list[dict]] = mapped_column(json_type, default=list, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class TalentSignal(Base):
    __tablename__ = "talent_signals"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    athlete_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("athletes.id"), nullable=False, index=True)
    signal_type: Mapped[TalentSignalType] = mapped_column(Enum(TalentSignalType), nullable=False)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)
    evidence: Mapped[list[dict]] = mapped_column(json_type, default=list, nullable=False)
