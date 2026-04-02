import enum
import uuid
from datetime import date, datetime, timezone

from sqlalchemy import JSON, Boolean, Date, DateTime, Enum, Float, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


json_type = JSON().with_variant(JSONB, "postgresql")


class SportCategory(str, enum.Enum):
    individual = "individual"
    team = "team"


class AthleteTier(str, enum.Enum):
    grassroots = "grassroots"
    state = "state"
    national = "national"
    elite = "elite"


class EventSource(str, enum.Enum):
    wearable = "wearable"
    manual = "manual"
    api = "api"


class DataCategory(str, enum.Enum):
    health = "health"
    financial = "financial"
    performance = "performance"


class FeatureWindow(str, enum.Enum):
    d7 = "7d"
    d28 = "28d"
    d90 = "90d"


class Sport(Base):
    __tablename__ = "sports"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    category: Mapped[SportCategory] = mapped_column(Enum(SportCategory), nullable=False)
    ontology_tags: Mapped[dict] = mapped_column(json_type, default=dict)

    athletes: Mapped[list["Athlete"]] = relationship(back_populates="sport")


class Athlete(Base):
    __tablename__ = "athletes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    dob: Mapped[date] = mapped_column(Date, nullable=False)
    gender: Mapped[str] = mapped_column(String(32), nullable=False)
    sport_id: Mapped[int] = mapped_column(ForeignKey("sports.id"), nullable=False)
    state: Mapped[str] = mapped_column(String(128), nullable=False)
    tier: Mapped[AthleteTier] = mapped_column(Enum(AthleteTier), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    sport: Mapped["Sport"] = relationship(back_populates="athletes")
    events: Mapped[list["EventLog"]] = relationship(back_populates="athlete")
    consents: Mapped[list["ConsentLedger"]] = relationship(back_populates="athlete")
    feature_snapshots: Mapped[list["FeatureSnapshot"]] = relationship(back_populates="athlete")


class EventLog(Base):
    __tablename__ = "event_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    athlete_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("athletes.id"), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    payload: Mapped[dict] = mapped_column(json_type, nullable=False)
    source: Mapped[EventSource] = mapped_column(Enum(EventSource), nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)

    athlete: Mapped["Athlete"] = relationship(back_populates="events")


class ConsentLedger(Base):
    __tablename__ = "consent_ledgers"
    __table_args__ = (UniqueConstraint("athlete_id", "data_category", name="uq_consent_athlete_category"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    athlete_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("athletes.id"), nullable=False, index=True)
    data_category: Mapped[DataCategory] = mapped_column(Enum(DataCategory), nullable=False)
    consented: Mapped[bool] = mapped_column(Boolean, nullable=False)
    consented_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    athlete: Mapped["Athlete"] = relationship(back_populates="consents")


class FeatureSnapshot(Base):
    __tablename__ = "feature_snapshots"
    __table_args__ = (
        UniqueConstraint("athlete_id", "feature_name", "window", name="uq_feature_snapshot_key"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    athlete_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("athletes.id"), nullable=False, index=True)
    feature_name: Mapped[str] = mapped_column(String(255), nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    window: Mapped[FeatureWindow] = mapped_column(Enum(FeatureWindow), nullable=False)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)

    athlete: Mapped["Athlete"] = relationship(back_populates="feature_snapshots")
