"""create financial module tables

Revision ID: 20260402_05
Revises: 20260402_04
Create Date: 2026-04-02 02:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "20260402_05"
down_revision = "20260402_04"
branch_labels = None
depends_on = None


income_source_type = sa.Enum("prize_money", "sponsorship", "government_grant", "appearance_fee", "other", name="incomesourcetype")
expense_category = sa.Enum("coaching", "equipment", "travel", "medical", "academy_fee", "other", name="expensecategory")
grant_scheme = sa.Enum("TOPS", "KheloIndia", "StateGovt", "Other", name="grantscheme")


def upgrade() -> None:
    bind = op.get_bind()

    income_source_type.create(bind, checkfirst=True)
    expense_category.create(bind, checkfirst=True)
    grant_scheme.create(bind, checkfirst=True)

    op.create_table(
        "income_records",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("athlete_id", sa.Uuid(), sa.ForeignKey("athletes.id"), nullable=False),
        sa.Column("source_type", income_source_type, nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(length=8), nullable=False),
        sa.Column("received_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("fiscal_year", sa.String(length=16), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("verified", sa.Boolean(), nullable=False),
    )
    op.create_index("ix_income_records_athlete_id", "income_records", ["athlete_id"])
    op.create_index("ix_income_records_received_at", "income_records", ["received_at"])
    op.create_index("ix_income_records_fiscal_year", "income_records", ["fiscal_year"])

    op.create_table(
        "expense_records",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("athlete_id", sa.Uuid(), sa.ForeignKey("athletes.id"), nullable=False),
        sa.Column("category", expense_category, nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("fiscal_year", sa.String(length=16), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
    )
    op.create_index("ix_expense_records_athlete_id", "expense_records", ["athlete_id"])
    op.create_index("ix_expense_records_paid_at", "expense_records", ["paid_at"])
    op.create_index("ix_expense_records_fiscal_year", "expense_records", ["fiscal_year"])

    op.create_table(
        "grant_records",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("athlete_id", sa.Uuid(), sa.ForeignKey("athletes.id"), nullable=False),
        sa.Column("grant_scheme", grant_scheme, nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("disbursed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("next_disbursement_date", sa.Date(), nullable=True),
        sa.Column("conditions", sa.Text(), nullable=True),
    )
    op.create_index("ix_grant_records_athlete_id", "grant_records", ["athlete_id"])
    op.create_index("ix_grant_records_disbursed_at", "grant_records", ["disbursed_at"])

    op.create_table(
        "financial_summaries",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("athlete_id", sa.Uuid(), sa.ForeignKey("athletes.id"), nullable=False),
        sa.Column("fiscal_year", sa.String(length=16), nullable=False),
        sa.Column("total_income", sa.Numeric(12, 2), nullable=False),
        sa.Column("total_expense", sa.Numeric(12, 2), nullable=False),
        sa.Column("net_savings", sa.Numeric(12, 2), nullable=False),
        sa.Column("computed_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_financial_summaries_athlete_id", "financial_summaries", ["athlete_id"])
    op.create_index("ix_financial_summaries_fiscal_year", "financial_summaries", ["fiscal_year"])
    op.create_index("ix_financial_summaries_computed_at", "financial_summaries", ["computed_at"])

    op.create_table(
        "cashflow_forecasts",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("athlete_id", sa.Uuid(), sa.ForeignKey("athletes.id"), nullable=False),
        sa.Column("month", sa.Date(), nullable=False),
        sa.Column("projected_income", sa.Numeric(12, 2), nullable=False),
        sa.Column("projected_expense", sa.Numeric(12, 2), nullable=False),
        sa.Column("deficit_flag", sa.Boolean(), nullable=False),
        sa.Column("computed_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_cashflow_forecasts_athlete_id", "cashflow_forecasts", ["athlete_id"])
    op.create_index("ix_cashflow_forecasts_month", "cashflow_forecasts", ["month"])
    op.create_index("ix_cashflow_forecasts_computed_at", "cashflow_forecasts", ["computed_at"])


def downgrade() -> None:
    bind = op.get_bind()

    op.drop_index("ix_cashflow_forecasts_computed_at", table_name="cashflow_forecasts")
    op.drop_index("ix_cashflow_forecasts_month", table_name="cashflow_forecasts")
    op.drop_index("ix_cashflow_forecasts_athlete_id", table_name="cashflow_forecasts")
    op.drop_table("cashflow_forecasts")

    op.drop_index("ix_financial_summaries_computed_at", table_name="financial_summaries")
    op.drop_index("ix_financial_summaries_fiscal_year", table_name="financial_summaries")
    op.drop_index("ix_financial_summaries_athlete_id", table_name="financial_summaries")
    op.drop_table("financial_summaries")

    op.drop_index("ix_grant_records_disbursed_at", table_name="grant_records")
    op.drop_index("ix_grant_records_athlete_id", table_name="grant_records")
    op.drop_table("grant_records")

    op.drop_index("ix_expense_records_fiscal_year", table_name="expense_records")
    op.drop_index("ix_expense_records_paid_at", table_name="expense_records")
    op.drop_index("ix_expense_records_athlete_id", table_name="expense_records")
    op.drop_table("expense_records")

    op.drop_index("ix_income_records_fiscal_year", table_name="income_records")
    op.drop_index("ix_income_records_received_at", table_name="income_records")
    op.drop_index("ix_income_records_athlete_id", table_name="income_records")
    op.drop_table("income_records")

    grant_scheme.drop(bind, checkfirst=True)
    expense_category.drop(bind, checkfirst=True)
    income_source_type.drop(bind, checkfirst=True)
