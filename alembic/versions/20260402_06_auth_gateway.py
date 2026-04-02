"""extend users for auth gateway

Revision ID: 20260402_06
Revises: 20260402_05
Create Date: 2026-04-02 02:30:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "20260402_06"
down_revision = "20260402_05"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("email", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("hashed_password", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("athlete_id", sa.Uuid(), nullable=True))
    op.add_column("users", sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()))
    op.create_foreign_key("fk_users_athlete_id", "users", "athletes", ["athlete_id"], ["id"])
    op.create_index("ix_users_athlete_id", "users", ["athlete_id"])
    op.create_unique_constraint("uq_users_email", "users", ["email"])


def downgrade() -> None:
    op.drop_constraint("uq_users_email", "users", type_="unique")
    op.drop_index("ix_users_athlete_id", table_name="users")
    op.drop_constraint("fk_users_athlete_id", "users", type_="foreignkey")
    op.drop_column("users", "is_active")
    op.drop_column("users", "athlete_id")
    op.drop_column("users", "hashed_password")
    op.drop_column("users", "email")
