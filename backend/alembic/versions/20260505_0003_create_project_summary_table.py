"""create project summary table

Revision ID: 20260505_0003
Revises: 20260505_0002
Create Date: 2026-05-05 02:10:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260505_0003"
down_revision: Union[str, None] = "20260505_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "project_summary",
        sa.Column("summary_text", sa.Text(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("generated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["project.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("project_id"),
    )
    op.create_index(op.f("ix_project_summary_project_id"), "project_summary", ["project_id"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_project_summary_project_id"), table_name="project_summary")
    op.drop_table("project_summary")
