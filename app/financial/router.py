from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.responses import success_response
from app.financial.schemas import ExpenseRecordCreate, ExpenseRecordRead, FinancialSummaryRead, GrantRecordRead, IncomeRecordCreate, IncomeRecordRead, CashflowForecastRead
from app.financial.service import (
    compute_financial_summary,
    create_expense_record,
    create_income_record,
    eligible_grants,
    get_latest_forecast,
    list_grants,
)

router = APIRouter(tags=["financial"])


@router.post("/financial/income/")
async def log_income(payload: IncomeRecordCreate, session: AsyncSession = Depends(get_db_session)):
    record = await create_income_record(session, payload)
    return success_response(IncomeRecordRead.model_validate(record).model_dump(mode="json"), "Income record created")


@router.post("/financial/expenses/")
async def log_expense(payload: ExpenseRecordCreate, session: AsyncSession = Depends(get_db_session)):
    record = await create_expense_record(session, payload)
    return success_response(ExpenseRecordRead.model_validate(record).model_dump(mode="json"), "Expense record created")


@router.get("/financial/summary/{athlete_id}/{fiscal_year}")
async def annual_summary(athlete_id: UUID, fiscal_year: str, session: AsyncSession = Depends(get_db_session)):
    summary = await compute_financial_summary(session, athlete_id, fiscal_year)
    return success_response(FinancialSummaryRead.model_validate(summary).model_dump(mode="json"), "Financial summary fetched")


@router.get("/financial/forecast/{athlete_id}")
async def cashflow_forecast(athlete_id: UUID, session: AsyncSession = Depends(get_db_session)):
    forecast = await get_latest_forecast(session, athlete_id, months_ahead=12)
    return success_response(
        [CashflowForecastRead.model_validate(row).model_dump(mode="json") for row in forecast],
        "Cashflow forecast fetched",
    )


@router.get("/financial/grants/eligible/{athlete_id}")
async def grant_eligibility(athlete_id: UUID, session: AsyncSession = Depends(get_db_session)):
    grants = await eligible_grants(session, athlete_id)
    return success_response(grants, "Grant eligibility fetched")


@router.get("/financial/grants/{athlete_id}")
async def grant_records(athlete_id: UUID, session: AsyncSession = Depends(get_db_session)):
    records = await list_grants(session, athlete_id)
    return success_response(
        [GrantRecordRead.model_validate(record).model_dump(mode="json") for record in records],
        "Grant records fetched",
    )
