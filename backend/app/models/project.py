import uuid
from datetime import datetime
from typing import Optional

from pydantic import field_validator
from sqlmodel import Field, SQLModel


class ProjectBase(SQLModel):
    name: str = Field(index=True, min_length=1, max_length=255)
    client_name: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = None
    current_stage: str = Field(default="需求确认", max_length=50)
    owner_name: Optional[str] = Field(default=None, max_length=255)
    goal: Optional[str] = None
    acceptance_criteria: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Project name is required.")
        return stripped


class Project(ProjectBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(SQLModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    client_name: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = None
    current_stage: Optional[str] = Field(default=None, max_length=50)
    owner_name: Optional[str] = Field(default=None, max_length=255)
    goal: Optional[str] = None
    acceptance_criteria: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        stripped = value.strip()
        if not stripped:
            raise ValueError("Project name is required.")
        return stripped


class ProjectRead(ProjectBase):
    id: uuid.UUID
    meeting_count: int = 0
    last_meeting_time: Optional[datetime] = None
    pending_action_count: int = 0
    created_at: datetime
    updated_at: datetime
