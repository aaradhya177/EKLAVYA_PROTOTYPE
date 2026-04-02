import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Enum, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


json_type = JSON().with_variant(JSONB, "postgresql")


class InjurySeverity(str, enum.Enum):
    mild = "mild"
    moderate = "moderate"
    severe = "severe"


class RiskLevel(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class InjuryRecord(Base):
    __tablename__ = "injury_records"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    athlete_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("athletes.id"), nullable=False, index=True)
    body_part: Mapped[str] = mapped_column(String(255), nullable=False)
    injury_type: Mapped[str] = mapped_column(String(255), nullable=False)
    severity: Mapped[InjurySeverity] = mapped_column(Enum(InjurySeverity), nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    returned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reported_by: Mapped[uuid.UUID] = mapped_column(nullable=False, index=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class RiskScore(Base):
    __tablename__ = "risk_scores"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    athlete_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("athletes.id"), nullable=False, index=True)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    risk_level: Mapped[RiskLevel] = mapped_column(Enum(RiskLevel), nullable=False)
    contributing_factors: Mapped[list[dict]] = mapped_column(json_type, default=list, nullable=False)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)
    model_version: Mapped[str] = mapped_column(String(255), nullable=False)


class BiomechanicalFlag(Base):
    __tablename__ = "biomechanical_flags"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    athlete_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("athletes.id"), nullable=False, index=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("session_logs.id"), nullable=False, index=True)
    flag_type: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    flagged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)
