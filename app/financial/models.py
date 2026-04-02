import enum
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class IncomeSourceType(str, enum.Enum):
    prize_money = "prize_money"
    sponsorship = "sponsorship"
    government_grant = "government_grant"
    appearance_fee = "appearance_fee"
    other = "other"


class ExpenseCategory(str, enum.Enum):
    coaching = "coaching"
    equipment = "equipment"
    travel = "travel"
    medical = "medical"
    academy_fee = "academy_fee"
    other = "other"


class GrantScheme(str, enum.Enum):
    TOPS = "TOPS"
    KheloIndia = "KheloIndia"
    StateGovt = "StateGovt"
    Other = "Other"


class IncomeRecord(Base):
    __tablename__ = "income_records"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    athlete_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("athletes.id"), nullable=False, index=True)
    source_type: Mapped[IncomeSourceType] = mapped_column(Enum(IncomeSourceType), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(8), nullable=False, default="INR")
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    fiscal_year: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class ExpenseRecord(Base):
    __tablename__ = "expense_records"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    athlete_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("athletes.id"), nullable=False, index=True)
    category: Mapped[ExpenseCategory] = mapped_column(Enum(ExpenseCategory), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    paid_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    fiscal_year: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class GrantRecord(Base):
    __tablename__ = "grant_records"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    athlete_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("athletes.id"), nullable=False, index=True)
    grant_scheme: Mapped[GrantScheme] = mapped_column(Enum(GrantScheme), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    disbursed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    next_disbursement_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    conditions: Mapped[str | None] = mapped_column(Text, nullable=True)


class FinancialSummary(Base):
    __tablename__ = "financial_summaries"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    athlete_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("athletes.id"), nullable=False, index=True)
    fiscal_year: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    total_income: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    total_expense: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    net_savings: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)


class CashflowForecast(Base):
    __tablename__ = "cashflow_forecasts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    athlete_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("athletes.id"), nullable=False, index=True)
    month: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    projected_income: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    projected_expense: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    deficit_flag: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)
