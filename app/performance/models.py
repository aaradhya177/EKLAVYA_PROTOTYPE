import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


json_type = JSON().with_variant(JSONB, "postgresql")


class SessionType(str, enum.Enum):
    training = "training"
    competition = "competition"
    recovery = "recovery"


class SessionLog(Base):
    __tablename__ = "session_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    athlete_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("athletes.id"), nullable=False, index=True)
    sport_id: Mapped[int] = mapped_column(ForeignKey("sports.id"), nullable=False, index=True)
    session_type: Mapped[SessionType] = mapped_column(Enum(SessionType), nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    end_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rpe: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    raw_metrics: Mapped[dict] = mapped_column(json_type, default=dict, nullable=False)
    computed_metrics: Mapped[dict] = mapped_column(json_type, default=dict, nullable=False)
    coach_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    performance_indices: Mapped[list["PerformanceIndex"]] = relationship(back_populates="session")


class PerformanceIndex(Base):
    __tablename__ = "performance_indices"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    athlete_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("athletes.id"), nullable=False, index=True)
    session_id: Mapped[int | None] = mapped_column(ForeignKey("session_logs.id"), nullable=True, index=True)
    index_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    percentile_in_sport: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)

    session: Mapped[SessionLog | None] = relationship(back_populates="performance_indices")
