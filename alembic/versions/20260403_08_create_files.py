"""create files tables

Revision ID: 20260403_08
Revises: 20260403_07
Create Date: 2026-04-03 13:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "20260403_08"
down_revision = "20260403_07"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "file_records",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("uploader_id", sa.Uuid(), nullable=False),
        sa.Column("athlete_id", sa.Uuid(), nullable=False),
        sa.Column("file_type", sa.Enum("video", "medical_report", "document", "profile_photo", "training_plan", name="filetype"), nullable=False),
        sa.Column("original_filename", sa.String(length=255), nullable=False),
        sa.Column("stored_key", sa.String(length=1024), nullable=False),
        sa.Column("mime_type", sa.String(length=255), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("access_level", sa.Enum("private", "coach_visible", "federation_visible", "public", name="fileaccesslevel"), nullable=False),
        sa.Column("upload_status", sa.Enum("pending", "processing", "ready", "failed", "flagged", "deleted", name="fileuploadstatus"), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["athlete_id"], ["athletes.id"]),
        sa.ForeignKeyConstraint(["uploader_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("stored_key"),
    )
    op.create_index("ix_file_records_uploader_id", "file_records", ["uploader_id"])
    op.create_index("ix_file_records_athlete_id", "file_records", ["athlete_id"])
    op.create_index("ix_file_records_file_type", "file_records", ["file_type"])
    op.create_index("ix_file_records_upload_status", "file_records", ["upload_status"])
    op.create_index("ix_file_records_created_at", "file_records", ["created_at"])

    op.create_table(
        "file_tags",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("file_id", sa.Uuid(), nullable=False),
        sa.Column("tag", sa.String(length=255), nullable=False),
        sa.ForeignKeyConstraint(["file_id"], ["file_records.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_file_tags_file_id", "file_tags", ["file_id"])
    op.create_index("ix_file_tags_tag", "file_tags", ["tag"])


def downgrade() -> None:
    op.drop_index("ix_file_tags_tag", table_name="file_tags")
    op.drop_index("ix_file_tags_file_id", table_name="file_tags")
    op.drop_table("file_tags")

    op.drop_index("ix_file_records_created_at", table_name="file_records")
    op.drop_index("ix_file_records_upload_status", table_name="file_records")
    op.drop_index("ix_file_records_file_type", table_name="file_records")
    op.drop_index("ix_file_records_athlete_id", table_name="file_records")
    op.drop_index("ix_file_records_uploader_id", table_name="file_records")
    op.drop_table("file_records")

    sa.Enum(name="fileuploadstatus").drop(op.get_bind(), checkfirst=False)
    sa.Enum(name="fileaccesslevel").drop(op.get_bind(), checkfirst=False)
    sa.Enum(name="filetype").drop(op.get_bind(), checkfirst=False)
