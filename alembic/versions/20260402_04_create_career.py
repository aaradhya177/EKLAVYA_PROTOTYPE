"""create career module tables

Revision ID: 20260402_04
Revises: 20260402_03
Create Date: 2026-04-02 01:30:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260402_04"
down_revision = "20260402_03"
branch_labels = None
depends_on = None


career_goal_type = sa.Enum("peak_event", "extend_career", "transition", "retirement", name="careergoaltype")
career_goal_status = sa.Enum("active", "achieved", "abandoned", name="careergoalstatus")
talent_signal_type = sa.Enum("breakthrough", "plateau", "decline", "emerging", name="talentsignaltype")


def upgrade() -> None:
    bind = op.get_bind()
    is_postgres = bind.dialect.name == "postgresql"
    json_type = postgresql.JSONB(astext_type=sa.Text()) if is_postgres else sa.JSON()

    career_goal_type.create(bind, checkfirst=True)
    career_goal_status.create(bind, checkfirst=True)
    talent_signal_type.create(bind, checkfirst=True)

    op.create_table(
        "career_goals",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("athlete_id", sa.Uuid(), sa.ForeignKey("athletes.id"), nullable=False),
        sa.Column("goal_type", career_goal_type, nullable=False),
        sa.Column("target_date", sa.Date(), nullable=False),
        sa.Column("priority_event", sa.String(length=255), nullable=True),
        sa.Column("status", career_goal_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_career_goals_athlete_id", "career_goals", ["athlete_id"])
    op.create_index("ix_career_goals_target_date", "career_goals", ["target_date"])

    op.create_table(
        "career_milestones",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("athlete_id", sa.Uuid(), sa.ForeignKey("athletes.id"), nullable=False),
        sa.Column("milestone_type", sa.String(length=255), nullable=False),
        sa.Column("achieved_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("verified_by", sa.Uuid(), sa.ForeignKey("users.id"), nullable=True),
    )
    op.create_index("ix_career_milestones_athlete_id", "career_milestones", ["athlete_id"])
    op.create_index("ix_career_milestones_achieved_at", "career_milestones", ["achieved_at"])

    op.create_table(
        "development_plans",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("athlete_id", sa.Uuid(), sa.ForeignKey("athletes.id"), nullable=False),
        sa.Column("coach_id", sa.Uuid(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("plan_period_start", sa.Date(), nullable=False),
        sa.Column("plan_period_end", sa.Date(), nullable=False),
        sa.Column("goals", json_type, nullable=False, server_default=sa.text("'[]'")),
        sa.Column("periodization_blocks", json_type, nullable=False, server_default=sa.text("'[]'")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_development_plans_athlete_id", "development_plans", ["athlete_id"])
    op.create_index("ix_development_plans_coach_id", "development_plans", ["coach_id"])
    op.create_index("ix_development_plans_plan_period_start", "development_plans", ["plan_period_start"])
    op.create_index("ix_development_plans_plan_period_end", "development_plans", ["plan_period_end"])

    op.create_table(
        "talent_signals",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("athlete_id", sa.Uuid(), sa.ForeignKey("athletes.id"), nullable=False),
        sa.Column("signal_type", talent_signal_type, nullable=False),
        sa.Column("computed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("evidence", json_type, nullable=False, server_default=sa.text("'[]'")),
    )
    op.create_index("ix_talent_signals_athlete_id", "talent_signals", ["athlete_id"])
    op.create_index("ix_talent_signals_computed_at", "talent_signals", ["computed_at"])


def downgrade() -> None:
    bind = op.get_bind()

    op.drop_index("ix_talent_signals_computed_at", table_name="talent_signals")
    op.drop_index("ix_talent_signals_athlete_id", table_name="talent_signals")
    op.drop_table("talent_signals")

    op.drop_index("ix_development_plans_plan_period_end", table_name="development_plans")
    op.drop_index("ix_development_plans_plan_period_start", table_name="development_plans")
    op.drop_index("ix_development_plans_coach_id", table_name="development_plans")
    op.drop_index("ix_development_plans_athlete_id", table_name="development_plans")
    op.drop_table("development_plans")

    op.drop_index("ix_career_milestones_achieved_at", table_name="career_milestones")
    op.drop_index("ix_career_milestones_athlete_id", table_name="career_milestones")
    op.drop_table("career_milestones")

    op.drop_index("ix_career_goals_target_date", table_name="career_goals")
    op.drop_index("ix_career_goals_athlete_id", table_name="career_goals")
    op.drop_table("career_goals")

    talent_signal_type.drop(bind, checkfirst=True)
    career_goal_status.drop(bind, checkfirst=True)
    career_goal_type.drop(bind, checkfirst=True)
