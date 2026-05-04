"""create project and meeting tables

Revision ID: 20260505_0001
Revises:
Create Date: 2026-05-05 00:40:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260505_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "project",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("client_name", sa.String(length=255), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("current_stage", sa.String(length=50), nullable=False),
        sa.Column("owner_name", sa.String(length=255), nullable=True),
        sa.Column("goal", sa.Text(), nullable=True),
        sa.Column("acceptance_criteria", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_project_name"), "project", ["name"], unique=False)

    op.create_table(
        "meeting",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("platform", sa.String(length=50), nullable=False),
        sa.Column("meeting_time", sa.DateTime(), nullable=False),
        sa.Column("participants", sa.Text(), nullable=True),
        sa.Column("agenda", sa.Text(), nullable=True),
        sa.Column("transcript_text", sa.Text(), nullable=False),
        sa.Column("analysis_status", sa.String(length=50), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["project.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_meeting_project_id"), "meeting", ["project_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_meeting_project_id"), table_name="meeting")
    op.drop_table("meeting")
    op.drop_index(op.f("ix_project_name"), table_name="project")
    op.drop_table("project")
