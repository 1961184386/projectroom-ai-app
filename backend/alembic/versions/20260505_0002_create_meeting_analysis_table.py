"""create meeting analysis table

Revision ID: 20260505_0002
Revises: 20260505_0001
Create Date: 2026-05-05 01:20:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260505_0002"
down_revision: Union[str, None] = "20260505_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "meeting_analysis",
        sa.Column("meeting_summary", sa.Text(), nullable=False),
        sa.Column("key_decisions", sa.JSON(), nullable=True),
        sa.Column("action_items", sa.JSON(), nullable=True),
        sa.Column("requirement_changes", sa.JSON(), nullable=True),
        sa.Column("risks", sa.JSON(), nullable=True),
        sa.Column("open_questions", sa.JSON(), nullable=True),
        sa.Column("next_meeting_topics", sa.JSON(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("meeting_id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["meeting_id"], ["meeting.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("meeting_id"),
    )
    op.create_index(op.f("ix_meeting_analysis_meeting_id"), "meeting_analysis", ["meeting_id"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_meeting_analysis_meeting_id"), table_name="meeting_analysis")
    op.drop_table("meeting_analysis")
