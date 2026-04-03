"""create ml models table

Revision ID: 20260403_07
Revises: 20260402_06
Create Date: 2026-04-03 09:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "20260403_07"
down_revision = "20260402_06"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "ml_models",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("version", sa.String(length=64), nullable=False),
        sa.Column("artifact_path", sa.String(length=1024), nullable=False),
        sa.Column("metrics", sa.JSON(), nullable=False),
        sa.Column("trained_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ml_models_name", "ml_models", ["name"])
    op.create_index("ix_ml_models_version", "ml_models", ["version"])
    op.create_index("ix_ml_models_trained_at", "ml_models", ["trained_at"])


def downgrade() -> None:
    op.drop_index("ix_ml_models_trained_at", table_name="ml_models")
    op.drop_index("ix_ml_models_version", table_name="ml_models")
    op.drop_index("ix_ml_models_name", table_name="ml_models")
    op.drop_table("ml_models")
