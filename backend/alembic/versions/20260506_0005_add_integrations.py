"""add integration config table and external meeting fields

Revision ID: 20260506_0005
Revises: 20260506_0004
Create Date: 2026-05-06 14:10:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision: str = "20260506_0005"
down_revision: Union[str, None] = "20260506_0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    if "integration_config" not in inspector.get_table_names():
        op.create_table(
            "integration_config",
            sa.Column("platform", sa.String(length=50), nullable=False),
            sa.Column("api_mode", sa.String(length=20), nullable=False),
            sa.Column("config_json", sa.JSON(), nullable=True),
            sa.Column("is_enabled", sa.Boolean(), nullable=False),
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_integration_config_platform"), "integration_config", ["platform"], unique=False)

    meeting_columns = {column["name"] for column in inspector.get_columns("meeting")}
    if "external_meeting_id" not in meeting_columns:
        op.add_column("meeting", sa.Column("external_meeting_id", sa.String(length=255), nullable=True))
    if "external_platform" not in meeting_columns:
        op.add_column("meeting", sa.Column("external_platform", sa.String(length=50), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    meeting_columns = {column["name"] for column in inspector.get_columns("meeting")}
    if "external_platform" in meeting_columns:
        op.drop_column("meeting", "external_platform")
    if "external_meeting_id" in meeting_columns:
        op.drop_column("meeting", "external_meeting_id")

    if "integration_config" in inspector.get_table_names():
        op.drop_index(op.f("ix_integration_config_platform"), table_name="integration_config")
        op.drop_table("integration_config")
