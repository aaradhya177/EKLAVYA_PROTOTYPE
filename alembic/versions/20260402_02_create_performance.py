"""create performance module tables

Revision ID: 20260402_02
Revises: 20260402_01
Create Date: 2026-04-02 00:30:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260402_02"
down_revision = "20260402_01"
branch_labels = None
depends_on = None


session_type = sa.Enum("training", "competition", "recovery", name="sessiontype")
user_role = sa.Enum("athlete", "coach", "federation_admin", "sys_admin", name="userrole")


def upgrade() -> None:
    bind = op.get_bind()
    is_postgres = bind.dialect.name == "postgresql"
    json_type = postgresql.JSONB(astext_type=sa.Text()) if is_postgres else sa.JSON()

    user_role.create(bind, checkfirst=True)
    session_type.create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("role", user_role, nullable=False),
    )

    op.create_table(
        "session_logs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("athlete_id", sa.Uuid(), sa.ForeignKey("athletes.id"), nullable=False),
        sa.Column("sport_id", sa.Integer(), sa.ForeignKey("sports.id"), nullable=False),
        sa.Column("session_type", session_type, nullable=False),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rpe", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("raw_metrics", json_type, nullable=False, server_default=sa.text("'{}'")),
        sa.Column("computed_metrics", json_type, nullable=False, server_default=sa.text("'{}'")),
        sa.Column("coach_id", sa.Uuid(), sa.ForeignKey("users.id"), nullable=True),
    )
    op.create_index("ix_session_logs_athlete_id", "session_logs", ["athlete_id"])
    op.create_index("ix_session_logs_sport_id", "session_logs", ["sport_id"])
    op.create_index("ix_session_logs_start_time", "session_logs", ["start_time"])

    op.create_table(
        "performance_indices",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("athlete_id", sa.Uuid(), sa.ForeignKey("athletes.id"), nullable=False),
        sa.Column("session_id", sa.Integer(), sa.ForeignKey("session_logs.id"), nullable=True),
        sa.Column("index_name", sa.String(length=255), nullable=False),
        sa.Column("value", sa.Float(), nullable=False),
        sa.Column("percentile_in_sport", sa.Float(), nullable=False, server_default="0"),
        sa.Column("computed_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_performance_indices_athlete_id", "performance_indices", ["athlete_id"])
    op.create_index("ix_performance_indices_session_id", "performance_indices", ["session_id"])
    op.create_index("ix_performance_indices_index_name", "performance_indices", ["index_name"])
    op.create_index("ix_performance_indices_computed_at", "performance_indices", ["computed_at"])

    if is_postgres:
        op.execute("SELECT create_hypertable('performance_indices', 'computed_at', if_not_exists => TRUE)")


def downgrade() -> None:
    bind = op.get_bind()

    op.drop_index("ix_performance_indices_computed_at", table_name="performance_indices")
    op.drop_index("ix_performance_indices_index_name", table_name="performance_indices")
    op.drop_index("ix_performance_indices_session_id", table_name="performance_indices")
    op.drop_index("ix_performance_indices_athlete_id", table_name="performance_indices")
    op.drop_table("performance_indices")

    op.drop_index("ix_session_logs_start_time", table_name="session_logs")
    op.drop_index("ix_session_logs_sport_id", table_name="session_logs")
    op.drop_index("ix_session_logs_athlete_id", table_name="session_logs")
    op.drop_table("session_logs")

    op.drop_table("users")

    session_type.drop(bind, checkfirst=True)
    user_role.drop(bind, checkfirst=True)
