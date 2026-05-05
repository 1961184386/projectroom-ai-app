import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlmodel import Column, Field, SQLModel


class MeetingAnalysisBase(SQLModel):
    meeting_summary: str
    key_decisions: list[dict] = Field(default_factory=list, sa_column=Column(sa.JSON))
    action_items: list[dict] = Field(default_factory=list, sa_column=Column(sa.JSON))
    requirement_changes: list[dict] = Field(default_factory=list, sa_column=Column(sa.JSON))
    risks: list[dict] = Field(default_factory=list, sa_column=Column(sa.JSON))
    open_questions: list[dict] = Field(default_factory=list, sa_column=Column(sa.JSON))
    next_meeting_topics: list[str] = Field(default_factory=list, sa_column=Column(sa.JSON))


class MeetingAnalysis(MeetingAnalysisBase, table=True):
    __tablename__ = "meeting_analysis"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    meeting_id: uuid.UUID = Field(
        foreign_key="meeting.id",
        unique=True,
        index=True,
        nullable=False,
    )
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class MeetingAnalysisRead(MeetingAnalysisBase):
    id: uuid.UUID
    meeting_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
