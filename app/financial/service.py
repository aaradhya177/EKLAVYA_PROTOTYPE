from collections import defaultdict
from datetime import date, datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from uuid import UUID

import yaml
from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.financial.models import CashflowForecast, ExpenseRecord, FinancialSummary, GrantRecord, IncomeRecord
from app.financial.schemas import ExpenseRecordCreate, IncomeRecordCreate
from app.performance.models import PerformanceIndex
from app.uadp.models import Athlete, Sport
from app.uadp.service import has_active_consent

TWOPLACES = Decimal("0.01")


def _ensure_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _money(value: Decimal | float | int) -> Decimal:
    return Decimal(value).quantize(TWOPLACES, rounding=ROUND_HALF_UP)


def _add_months(start_month: date, offset: int) -> date:
    year = start_month.year + ((start_month.month - 1 + offset) // 12)
    month = ((start_month.month - 1 + offset) % 12) + 1
    return date(year, month, 1)


def _config() -> dict:
    path = Path(__file__).parent / "config" / "financial_rules.yaml"
    return yaml.safe_load(path.read_text(encoding="utf-8"))


async def get_athlete_or_404(session: AsyncSession, athlete_id: UUID) -> Athlete:
    athlete = await session.get(Athlete, athlete_id)
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")
    return athlete


async def ensure_financial_consent(session: AsyncSession, athlete_id: UUID) -> None:
    await get_athlete_or_404(session, athlete_id)
    if not await has_active_consent(session, athlete_id, "financial"):
        raise HTTPException(status_code=451, detail="Data access restricted under DPDP Act")


async def create_income_record(session: AsyncSession, payload: IncomeRecordCreate) -> IncomeRecord:
    await ensure_financial_consent(session, payload.athlete_id)
    record = IncomeRecord(
        athlete_id=payload.athlete_id,
        source_type=payload.source_type,
        amount=_money(payload.amount),
        currency=payload.currency,
        received_at=_ensure_utc(payload.received_at),
        fiscal_year=payload.fiscal_year,
        notes=payload.notes,
        verified=payload.verified,
    )
    session.add(record)
    await session.commit()
    await session.refresh(record)
    return record


async def create_expense_record(session: AsyncSession, payload: ExpenseRecordCreate) -> ExpenseRecord:
    await ensure_financial_consent(session, payload.athlete_id)
    record = ExpenseRecord(
        athlete_id=payload.athlete_id,
        category=payload.category,
        amount=_money(payload.amount),
        paid_at=_ensure_utc(payload.paid_at),
        fiscal_year=payload.fiscal_year,
        notes=payload.notes,
    )
    session.add(record)
    await session.commit()
    await session.refresh(record)
    return record


async def compute_financial_summary(session: AsyncSession, athlete_id: UUID, fiscal_year: str) -> FinancialSummary:
    await ensure_financial_consent(session, athlete_id)
    income_stmt = select(func.coalesce(func.sum(IncomeRecord.amount), 0)).where(
        IncomeRecord.athlete_id == athlete_id,
        IncomeRecord.fiscal_year == fiscal_year,
    )
    expense_stmt = select(func.coalesce(func.sum(ExpenseRecord.amount), 0)).where(
        ExpenseRecord.athlete_id == athlete_id,
        ExpenseRecord.fiscal_year == fiscal_year,
    )
    total_income = _money((await session.execute(income_stmt)).scalar_one())
    total_expense = _money((await session.execute(expense_stmt)).scalar_one())
    net_savings = _money(total_income - total_expense)

    stmt = select(FinancialSummary).where(
        FinancialSummary.athlete_id == athlete_id,
        FinancialSummary.fiscal_year == fiscal_year,
    )
    summary = (await session.execute(stmt)).scalars().first()
    now = _utcnow()
    if summary:
        summary.total_income = total_income
        summary.total_expense = total_expense
        summary.net_savings = net_savings
        summary.computed_at = now
    else:
        summary = FinancialSummary(
            athlete_id=athlete_id,
            fiscal_year=fiscal_year,
            total_income=total_income,
            total_expense=total_expense,
            net_savings=net_savings,
            computed_at=now,
        )
        session.add(summary)
    await session.commit()
    await session.refresh(summary)
    return summary


async def list_grants(session: AsyncSession, athlete_id: UUID) -> list[GrantRecord]:
    await ensure_financial_consent(session, athlete_id)
    stmt = (
        select(GrantRecord)
        .where(GrantRecord.athlete_id == athlete_id)
        .order_by(GrantRecord.disbursed_at.desc(), GrantRecord.id.desc())
    )
    return list((await session.execute(stmt)).scalars().all())


async def compute_cashflow_forecast_records(
    session: AsyncSession, athlete_id: UUID, months_ahead: int = 12
) -> list[CashflowForecast]:
    await ensure_financial_consent(session, athlete_id)
    rules = _config()
    growth_rates = rules.get("forecast_growth_rates", {})

    latest_income_year = (
        await session.execute(
            select(IncomeRecord.fiscal_year)
            .where(IncomeRecord.athlete_id == athlete_id)
            .order_by(IncomeRecord.received_at.desc(), IncomeRecord.id.desc())
        )
    ).scalars().first()
    latest_expense_year = (
        await session.execute(
            select(ExpenseRecord.fiscal_year)
            .where(ExpenseRecord.athlete_id == athlete_id)
            .order_by(ExpenseRecord.paid_at.desc(), ExpenseRecord.id.desc())
        )
    ).scalars().first()

    income_rows = list(
        (
            await session.execute(
                select(IncomeRecord).where(
                    IncomeRecord.athlete_id == athlete_id,
                    IncomeRecord.fiscal_year == latest_income_year,
                )
            )
        ).scalars().all()
    )
    expense_rows = list(
        (
            await session.execute(
                select(ExpenseRecord).where(
                    ExpenseRecord.athlete_id == athlete_id,
                    ExpenseRecord.fiscal_year == latest_expense_year,
                )
            )
        ).scalars().all()
    )

    annual_income_by_source: dict[str, Decimal] = defaultdict(lambda: Decimal("0.00"))
    annual_expense_by_category: dict[str, Decimal] = defaultdict(lambda: Decimal("0.00"))
    for row in income_rows:
        annual_income_by_source[row.source_type.value] += Decimal(row.amount)
    for row in expense_rows:
        annual_expense_by_category[row.category.value] += Decimal(row.amount)

    first_month = date.today().replace(day=1)
    now = _utcnow()
    created: list[CashflowForecast] = []
    for offset in range(months_ahead):
        month = _add_months(first_month, offset)
        projected_income = Decimal("0.00")
        for source_type, annual_amount in annual_income_by_source.items():
            growth_rate = Decimal(str(growth_rates.get(source_type, 0)))
            projected_income += (annual_amount * (Decimal("1.00") + growth_rate)) / Decimal("12")

        projected_expense = Decimal("0.00")
        for annual_amount in annual_expense_by_category.values():
            projected_expense += annual_amount / Decimal("12")

        forecast = CashflowForecast(
            athlete_id=athlete_id,
            month=month,
            projected_income=_money(projected_income),
            projected_expense=_money(projected_expense),
            deficit_flag=projected_income < projected_expense,
            computed_at=now,
        )
        session.add(forecast)
        created.append(forecast)

    await session.commit()
    for row in created:
        await session.refresh(row)
    return created


async def get_latest_forecast(session: AsyncSession, athlete_id: UUID, months_ahead: int = 12) -> list[CashflowForecast]:
    await ensure_financial_consent(session, athlete_id)
    stmt = (
        select(CashflowForecast)
        .where(CashflowForecast.athlete_id == athlete_id)
        .order_by(CashflowForecast.month.asc(), CashflowForecast.computed_at.desc(), CashflowForecast.id.desc())
    )
    rows = list((await session.execute(stmt)).scalars().all())
    latest_by_month: dict[date, CashflowForecast] = {}
    for row in rows:
        latest_by_month.setdefault(row.month, row)
    if not latest_by_month:
        return await compute_cashflow_forecast_records(session, athlete_id, months_ahead)
    return list(sorted(latest_by_month.values(), key=lambda item: item.month))[:months_ahead]


async def eligible_grants(session: AsyncSession, athlete_id: UUID) -> list[dict]:
    await ensure_financial_consent(session, athlete_id)
    athlete = await get_athlete_or_404(session, athlete_id)
    sport = await session.get(Sport, athlete.sport_id)
    rules = _config().get("grant_schemes", {})
    dob = athlete.dob
    today = date.today()
    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    perf_stmt = (
        select(PerformanceIndex)
        .where(PerformanceIndex.athlete_id == athlete_id)
        .order_by(PerformanceIndex.index_name.asc(), PerformanceIndex.computed_at.desc(), PerformanceIndex.id.desc())
    )
    perf_rows = list((await session.execute(perf_stmt)).scalars().all())
    latest_by_name: dict[str, PerformanceIndex] = {}
    for row in perf_rows:
        latest_by_name.setdefault(row.index_name, row)
    best_percentile = max((row.percentile_in_sport for row in latest_by_name.values()), default=0.0)

    eligible: list[dict] = []
    for scheme_name, rule in rules.items():
        min_age = rule.get("min_age", 0)
        max_age = rule.get("max_age", 200)
        allowed_tiers = set(rule.get("min_tiers", []))
        allowed_states = set(rule.get("states", []))
        min_percentile = float(rule.get("min_percentile", 0))
        eligible_sports = rule.get("eligible_sports", ["*"])

        if age < min_age or age > max_age:
            continue
        if allowed_tiers and athlete.tier.value not in allowed_tiers:
            continue
        if allowed_states and athlete.state not in allowed_states:
            continue
        if eligible_sports != ["*"] and sport and sport.name not in eligible_sports:
            continue
        if best_percentile < min_percentile:
            continue

        eligible.append(
            {
                "scheme_name": scheme_name,
                "athlete_id": str(athlete_id),
                "reasons": {
                    "age": age,
                    "tier": athlete.tier.value,
                    "best_percentile": best_percentile,
                    "sport": sport.name if sport else None,
                    "state": athlete.state,
                },
            }
        )
    return eligible
