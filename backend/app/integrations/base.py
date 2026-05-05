from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from app.integrations.types import (
    ConnectionTestResult,
    ConnectorHealth,
    ExternalMeeting,
    ExternalMeetingCreatePayload,
    RecordingInfo,
)


class AbstractConnector(ABC):
    platform: str
    mode: str

    @abstractmethod
    def test_connection(self) -> ConnectionTestResult:
        raise NotImplementedError

    @abstractmethod
    def create_meeting(self, meeting_data: ExternalMeetingCreatePayload) -> ExternalMeeting:
        raise NotImplementedError

    @abstractmethod
    def get_meeting(self, external_id: str) -> ExternalMeeting:
        raise NotImplementedError

    @abstractmethod
    def list_meetings(self, limit: int = 10) -> list[ExternalMeeting]:
        raise NotImplementedError

    @abstractmethod
    def list_recordings(self, meeting_id: str) -> list[RecordingInfo]:
        raise NotImplementedError

    @abstractmethod
    def get_transcript(self, recording_id: str) -> str:
        raise NotImplementedError

    @abstractmethod
    def health_check(self) -> ConnectorHealth:
        raise NotImplementedError

    @abstractmethod
    def validate_webhook(self, headers: dict[str, str], body: bytes) -> bool:
        raise NotImplementedError

    @abstractmethod
    def handle_webhook(self, payload: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError
