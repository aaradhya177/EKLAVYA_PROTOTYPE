"""create uadp module tables

Revision ID: 20260402_01
Revises:
Create Date: 2026-04-02 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260402_01"
down_revision = None
branch_labels = None
depends_on = None


athlete_tier = sa.Enum("grassroots", "state", "national", "elite", name="athletetier")
sport_category = sa.Enum("individual", "team", name="sportcategory")
event_source = sa.Enum("wearable", "manual", "api", name="eventsource")
data_category = sa.Enum("health", "financial", "performance", name="datacategory")
feature_window = sa.Enum("7d", "28d", "90d", name="featurewindow")


def upgrade() -> None:
    bind = op.get_bind()
    is_postgres = bind.dialect.name == "postgresql"

    if is_postgres:
        op.execute("CREATE EXTENSION IF NOT EXISTS timescaledb")

    sport_category.create(bind, checkfirst=True)
    athlete_tier.create(bind, checkfirst=True)
    event_source.create(bind, checkfirst=True)
    data_category.create(bind, checkfirst=True)
    feature_window.create(bind, checkfirst=True)

    json_type = postgresql.JSONB(astext_type=sa.Text()) if is_postgres else sa.JSON()

    op.create_table(
        "sports",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=255), nullable=False, unique=True),
        sa.Column("category", sport_category, nullable=False),
        sa.Column("ontology_tags", json_type, nullable=False, server_default=sa.text("'{}'")),
    )

    op.create_table(
        "athletes",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("dob", sa.Date(), nullable=False),
        sa.Column("gender", sa.String(length=32), nullable=False),
        sa.Column("sport_id", sa.Integer(), sa.ForeignKey("sports.id"), nullable=False),
        sa.Column("state", sa.String(length=128), nullable=False),
        sa.Column("tier", athlete_tier, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "event_logs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("athlete_id", sa.Uuid(), sa.ForeignKey("athletes.id"), nullable=False),
        sa.Column("event_type", sa.String(length=255), nullable=False),
        sa.Column("payload", json_type, nullable=False),
        sa.Column("source", event_source, nullable=False),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_event_logs_athlete_id", "event_logs", ["athlete_id"])
    op.create_index("ix_event_logs_event_type", "event_logs", ["event_type"])
    op.create_index("ix_event_logs_recorded_at", "event_logs", ["recorded_at"])

    op.create_table(
        "consent_ledgers",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("athlete_id", sa.Uuid(), sa.ForeignKey("athletes.id"), nullable=False),
        sa.Column("data_category", data_category, nullable=False),
        sa.Column("consented", sa.Boolean(), nullable=False),
        sa.Column("consented_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("athlete_id", "data_category", name="uq_consent_athlete_category"),
    )
    op.create_index("ix_consent_ledgers_athlete_id", "consent_ledgers", ["athlete_id"])

    op.create_table(
        "feature_snapshots",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("athlete_id", sa.Uuid(), sa.ForeignKey("athletes.id"), nullable=False),
        sa.Column("feature_name", sa.String(length=255), nullable=False),
        sa.Column("value", sa.Float(), nullable=False),
        sa.Column("window", feature_window, nullable=False),
        sa.Column("computed_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("athlete_id", "feature_name", "window", name="uq_feature_snapshot_key"),
    )
    op.create_index("ix_feature_snapshots_athlete_id", "feature_snapshots", ["athlete_id"])
    op.create_index("ix_feature_snapshots_computed_at", "feature_snapshots", ["computed_at"])

    if is_postgres:
        op.execute("SELECT create_hypertable('event_logs', 'recorded_at', if_not_exists => TRUE)")
        op.execute("SELECT create_hypertable('feature_snapshots', 'computed_at', if_not_exists => TRUE)")


def downgrade() -> None:
    bind = op.get_bind()

    op.drop_index("ix_feature_snapshots_computed_at", table_name="feature_snapshots")
    op.drop_index("ix_feature_snapshots_athlete_id", table_name="feature_snapshots")
    op.drop_table("feature_snapshots")

    op.drop_index("ix_consent_ledgers_athlete_id", table_name="consent_ledgers")
    op.drop_table("consent_ledgers")

    op.drop_index("ix_event_logs_recorded_at", table_name="event_logs")
    op.drop_index("ix_event_logs_event_type", table_name="event_logs")
    op.drop_index("ix_event_logs_athlete_id", table_name="event_logs")
    op.drop_table("event_logs")

    op.drop_table("athletes")
    op.drop_table("sports")

    feature_window.drop(bind, checkfirst=True)
    data_category.drop(bind, checkfirst=True)
    event_source.drop(bind, checkfirst=True)
    athlete_tier.drop(bind, checkfirst=True)
    sport_category.drop(bind, checkfirst=True)
