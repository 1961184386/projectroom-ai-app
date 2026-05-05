from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ExternalMeeting(BaseModel):
    external_id: str
    title: str
    start_time: datetime
    end_time: datetime
    participants: list[str] = Field(default_factory=list)
    platform: str
    status: str = "scheduled"
    join_url: str | None = None
    agenda: str | None = None


class RecordingInfo(BaseModel):
    id: str
    meeting_id: str
    duration: int = 0
    file_url: str | None = None
    status: str = "completed"


class ConnectionTestResult(BaseModel):
    connected: bool
    message: str
    details: dict[str, Any] = Field(default_factory=dict)


class ConnectorHealth(BaseModel):
    platform: str
    mode: str
    configured: bool
    webhook_configured: bool
    capabilities: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class ExternalMeetingCreatePayload(BaseModel):
    title: str
    start_time: datetime
    end_time: datetime
    participants: list[str] = Field(default_factory=list)
    agenda: str | None = None
    project_id: str | None = None


class SyncMeetingsPayload(BaseModel):
    project_id: str
    limit: int = 10


class TranscriptImportResult(BaseModel):
    meeting_id: str
    external_meeting_id: str
    imported: bool
    transcript_preview: str
    analysis_status: str
    platform: str
