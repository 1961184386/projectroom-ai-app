import uuid
from datetime import datetime

from sqlmodel import Field, SQLModel


class ProjectSummaryBase(SQLModel):
    summary_text: str


class ProjectSummary(ProjectSummaryBase, table=True):
    __tablename__ = "project_summary"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    project_id: uuid.UUID = Field(
        foreign_key="project.id",
        unique=True,
        index=True,
        nullable=False,
    )
    generated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class ProjectSummaryRead(SQLModel):
    id: uuid.UUID
    project_id: uuid.UUID
    summary_text: str
    generated_at: datetime
