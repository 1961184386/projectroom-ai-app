"""add project materials table

Revision ID: 20260506_0004
Revises: 20260505_0003
Create Date: 2026-05-06 09:30:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision: str = "20260506_0004"
down_revision: Union[str, None] = "20260505_0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if "project_material" in inspector.get_table_names():
        return

    op.create_table(
        "project_material",
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("material_type", sa.String(length=50), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["project.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_project_material_project_id"), "project_material", ["project_id"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if "project_material" not in inspector.get_table_names():
        return

    op.drop_index(op.f("ix_project_material_project_id"), table_name="project_material")
    op.drop_table("project_material")
