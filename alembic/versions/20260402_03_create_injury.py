"""create injury module tables

Revision ID: 20260402_03
Revises: 20260402_02
Create Date: 2026-04-02 01:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260402_03"
down_revision = "20260402_02"
branch_labels = None
depends_on = None


injury_severity = sa.Enum("mild", "moderate", "severe", name="injuryseverity")
risk_level = sa.Enum("low", "medium", "high", "critical", name="risklevel")


def upgrade() -> None:
    bind = op.get_bind()
    is_postgres = bind.dialect.name == "postgresql"
    json_type = postgresql.JSONB(astext_type=sa.Text()) if is_postgres else sa.JSON()

    injury_severity.create(bind, checkfirst=True)
    risk_level.create(bind, checkfirst=True)

    op.create_table(
        "injury_records",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("athlete_id", sa.Uuid(), sa.ForeignKey("athletes.id"), nullable=False),
        sa.Column("body_part", sa.String(length=255), nullable=False),
        sa.Column("injury_type", sa.String(length=255), nullable=False),
        sa.Column("severity", injury_severity, nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("returned_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reported_by", sa.Uuid(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
    )
    op.create_index("ix_injury_records_athlete_id", "injury_records", ["athlete_id"])
    op.create_index("ix_injury_records_occurred_at", "injury_records", ["occurred_at"])
    op.create_index("ix_injury_records_reported_by", "injury_records", ["reported_by"])

    op.create_table(
        "risk_scores",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("athlete_id", sa.Uuid(), sa.ForeignKey("athletes.id"), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("risk_level", risk_level, nullable=False),
        sa.Column("contributing_factors", json_type, nullable=False, server_default=sa.text("'[]'")),
        sa.Column("computed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("model_version", sa.String(length=255), nullable=False),
    )
    op.create_index("ix_risk_scores_athlete_id", "risk_scores", ["athlete_id"])
    op.create_index("ix_risk_scores_computed_at", "risk_scores", ["computed_at"])

    op.create_table(
        "biomechanical_flags",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("athlete_id", sa.Uuid(), sa.ForeignKey("athletes.id"), nullable=False),
        sa.Column("session_id", sa.Integer(), sa.ForeignKey("session_logs.id"), nullable=False),
        sa.Column("flag_type", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("flagged_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_biomechanical_flags_athlete_id", "biomechanical_flags", ["athlete_id"])
    op.create_index("ix_biomechanical_flags_session_id", "biomechanical_flags", ["session_id"])
    op.create_index("ix_biomechanical_flags_flagged_at", "biomechanical_flags", ["flagged_at"])

    if is_postgres:
        op.execute("SELECT create_hypertable('risk_scores', 'computed_at', if_not_exists => TRUE)")


def downgrade() -> None:
    bind = op.get_bind()

    op.drop_index("ix_biomechanical_flags_flagged_at", table_name="biomechanical_flags")
    op.drop_index("ix_biomechanical_flags_session_id", table_name="biomechanical_flags")
    op.drop_index("ix_biomechanical_flags_athlete_id", table_name="biomechanical_flags")
    op.drop_table("biomechanical_flags")

    op.drop_index("ix_risk_scores_computed_at", table_name="risk_scores")
    op.drop_index("ix_risk_scores_athlete_id", table_name="risk_scores")
    op.drop_table("risk_scores")

    op.drop_index("ix_injury_records_reported_by", table_name="injury_records")
    op.drop_index("ix_injury_records_occurred_at", table_name="injury_records")
    op.drop_index("ix_injury_records_athlete_id", table_name="injury_records")
    op.drop_table("injury_records")

    risk_level.drop(bind, checkfirst=True)
    injury_severity.drop(bind, checkfirst=True)
