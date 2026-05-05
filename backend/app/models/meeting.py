import uuid
from datetime import datetime
from typing import Optional

from pydantic import field_validator
from sqlmodel import Field, SQLModel


class MeetingBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    platform: str = Field(default="manual", max_length=50)
    meeting_time: datetime
    participants: Optional[str] = None
    agenda: Optional[str] = None
    transcript_text: str = Field(min_length=1)
    analysis_status: str = Field(default="pending", max_length=50)
    external_meeting_id: Optional[str] = Field(default=None, max_length=255)
    external_platform: Optional[str] = Field(default=None, max_length=50)

    @field_validator("title", "transcript_text")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("This field is required.")
        return stripped


class Meeting(MeetingBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    project_id: uuid.UUID = Field(foreign_key="project.id", index=True, nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class MeetingCreate(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    platform: str = Field(default="manual", max_length=50)
    meeting_time: datetime
    participants: Optional[str] = None
    agenda: Optional[str] = None
    transcript_text: str = Field(min_length=1)

    @field_validator("title", "transcript_text")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("This field is required.")
        return stripped


class MeetingRead(MeetingBase):
    id: uuid.UUID
    project_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
