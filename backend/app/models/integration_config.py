import uuid
from datetime import datetime
from typing import Any

import sqlalchemy as sa
from sqlmodel import Column, Field, SQLModel


class IntegrationConfigBase(SQLModel):
    platform: str = Field(max_length=50, index=True)
    api_mode: str = Field(default="mock", max_length=20)
    config_json: dict[str, Any] = Field(default_factory=dict, sa_column=Column(sa.JSON))
    is_enabled: bool = True


class IntegrationConfig(IntegrationConfigBase, table=True):
    __tablename__ = "integration_config"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class IntegrationConfigCreate(IntegrationConfigBase):
    pass


class IntegrationConfigRead(IntegrationConfigBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
