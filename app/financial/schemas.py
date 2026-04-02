from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.financial.models import ExpenseCategory, GrantScheme, IncomeSourceType


class IncomeRecordCreate(BaseModel):
    athlete_id: UUID
    source_type: IncomeSourceType
    amount: Decimal
    currency: str = "INR"
    received_at: datetime
    fiscal_year: str
    notes: str | None = None
    verified: bool = False


class IncomeRecordRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    athlete_id: UUID
    source_type: IncomeSourceType
    amount: Decimal
    currency: str
    received_at: datetime
    fiscal_year: str
    notes: str | None
    verified: bool


class ExpenseRecordCreate(BaseModel):
    athlete_id: UUID
    category: ExpenseCategory
    amount: Decimal
    paid_at: datetime
    fiscal_year: str
    notes: str | None = None


class ExpenseRecordRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    athlete_id: UUID
    category: ExpenseCategory
    amount: Decimal
    paid_at: datetime
    fiscal_year: str
    notes: str | None


class GrantRecordRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    athlete_id: UUID
    grant_scheme: GrantScheme
    amount: Decimal
    disbursed_at: datetime
    next_disbursement_date: date | None
    conditions: str | None


class FinancialSummaryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    athlete_id: UUID
    fiscal_year: str
    total_income: Decimal
    total_expense: Decimal
    net_savings: Decimal
    computed_at: datetime


class CashflowForecastRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    athlete_id: UUID
    month: date
    projected_income: Decimal
    projected_expense: Decimal
    deficit_flag: bool
    computed_at: datetime
