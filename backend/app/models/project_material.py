import uuid
from datetime import datetime
from typing import Optional

from pydantic import field_validator
from sqlmodel import Field, SQLModel


class ProjectMaterialBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    material_type: str = Field(default="other", max_length=50)
    content: str = Field(min_length=1)

    @field_validator("title", "content")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("This field is required.")
        return stripped


class ProjectMaterial(ProjectMaterialBase, table=True):
    __tablename__ = "project_material"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    project_id: uuid.UUID = Field(foreign_key="project.id", index=True, nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class ProjectMaterialCreate(ProjectMaterialBase):
    pass


class ProjectMaterialDelete(SQLModel):
    id: uuid.UUID


class ProjectMaterialRead(ProjectMaterialBase):
    id: uuid.UUID
    project_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
