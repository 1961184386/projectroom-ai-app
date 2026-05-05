from __future__ import annotations

from datetime import datetime
from typing import Any

import httpx

from app.integrations.base import AbstractConnector
from app.integrations.dingtalk.auth import (
    build_cached_token_expiry,
    get_access_token,
    validate_webhook_signature,
)
from app.integrations.types import (
    ConnectionTestResult,
    ConnectorHealth,
    ExternalMeeting,
    ExternalMeetingCreatePayload,
    RecordingInfo,
)


class DingTalkConnector(AbstractConnector):
    platform = "dingtalk"
    _cached_token: str | None = None
    _token_expiry: float = 0

    def __init__(self, settings, config: dict[str, Any], mode: str) -> None:
        self.settings = settings
        self.config = config
        self.mode = mode
        self.base_url = config.get("base_url") or settings.dingtalk_base_url

    def _get_token(self) -> str:
        if self._cached_token and self._token_expiry:
            import time

            if time.time() < self._token_expiry:
                return self._cached_token
        app_key = self.config.get("app_key") or self.settings.dingtalk_app_key
        app_secret = self.config.get("app_secret") or self.settings.dingtalk_app_secret
        if not all([app_key, app_secret]):
            raise ValueError("DingTalk app_key and app_secret are required.")
        token, expires_in = get_access_token(self.base_url, app_key, app_secret)
        self._cached_token = token
        self._token_expiry = build_cached_token_expiry(expires_in)
        return token

    def _request(self, method: str, path: str, json_payload: dict[str, Any] | None = None) -> dict[str, Any]:
        headers = {"x-acs-dingtalk-access-token": self._get_token(), "Content-Type": "application/json"}
        with httpx.Client(timeout=10.0) as client:
            response = client.request(method, f"{self.base_url}{path}", headers=headers, json=json_payload)
            response.raise_for_status()
            if not response.content:
                return {}
            return response.json()

    def test_connection(self) -> ConnectionTestResult:
        try:
            token = self._get_token()
            return ConnectionTestResult(
                connected=bool(token),
                message="DingTalk access token acquired." if token else "DingTalk token is empty.",
                details={"mode": self.mode},
            )
        except Exception as exc:
            return ConnectionTestResult(connected=False, message=str(exc), details={"mode": self.mode})

    def create_meeting(self, meeting_data: ExternalMeetingCreatePayload) -> ExternalMeeting:
        payload = {
            "title": meeting_data.title,
            "startTime": meeting_data.start_time.isoformat(),
            "endTime": meeting_data.end_time.isoformat(),
            "participantUserIds": meeting_data.participants,
            "minutesConfig": {"enableAiMinutes": True},
        }
        response = self._request("POST", "/v1.0/calendar/users/me/events", payload)
        return ExternalMeeting(
            external_id=str(response.get("id") or response.get("meetingId")),
            title=response.get("summary", meeting_data.title),
            start_time=_parse_datetime(response.get("start", {}).get("dateTime"), meeting_data.start_time),
            end_time=_parse_datetime(response.get("end", {}).get("dateTime"), meeting_data.end_time),
            participants=meeting_data.participants,
            platform=self.platform,
            status=str(response.get("status", "scheduled")),
            join_url=response.get("onlineMeetingUrl"),
            agenda=meeting_data.agenda,
        )

    def get_meeting(self, external_id: str) -> ExternalMeeting:
        response = self._request("GET", f"/v1.0/calendar/events/{external_id}")
        start_time = _parse_datetime(response.get("start", {}).get("dateTime"), datetime.utcnow())
        end_time = _parse_datetime(response.get("end", {}).get("dateTime"), start_time)
        return ExternalMeeting(
            external_id=external_id,
            title=response.get("summary", "DingTalk Meeting"),
            start_time=start_time,
            end_time=end_time,
            participants=[],
            platform=self.platform,
            status=str(response.get("status", "scheduled")),
            join_url=response.get("onlineMeetingUrl"),
            agenda=response.get("description"),
        )

    def list_meetings(self, limit: int = 10) -> list[ExternalMeeting]:
        response = self._request("GET", f"/v1.0/calendar/events?top={limit}")
        items = response.get("value", [])
        return [
            ExternalMeeting(
                external_id=str(item.get("id")),
                title=item.get("summary", "DingTalk Meeting"),
                start_time=_parse_datetime(item.get("start", {}).get("dateTime"), datetime.utcnow()),
                end_time=_parse_datetime(item.get("end", {}).get("dateTime"), datetime.utcnow()),
                participants=[],
                platform=self.platform,
                status=str(item.get("status", "scheduled")),
                join_url=item.get("onlineMeetingUrl"),
                agenda=item.get("description"),
            )
            for item in items
        ]

    def list_recordings(self, meeting_id: str) -> list[RecordingInfo]:
        response = self._request("GET", f"/v1.0/meeting/recordings/{meeting_id}")
        items = response.get("recordings", response.get("value", []))
        return [
            RecordingInfo(
                id=str(item.get("recordingId") or item.get("id")),
                meeting_id=meeting_id,
                duration=int(item.get("duration", 0)),
                file_url=item.get("downloadUrl"),
                status=str(item.get("status", "completed")),
            )
            for item in items
        ]

    def get_transcript(self, recording_id: str) -> str:
        response = self._request("GET", f"/v1.0/meeting/minutes/{recording_id}")
        paragraphs = response.get("paragraphs", [])
        if not paragraphs:
            return response.get("content", "")
        return "\n".join(
            f"{item.get('speaker', 'Speaker')}：{item.get('text', '')}".strip()
            for item in paragraphs
        )

    def health_check(self) -> ConnectorHealth:
        configured = bool(
            (self.config.get("app_key") or self.settings.dingtalk_app_key)
            and (self.config.get("app_secret") or self.settings.dingtalk_app_secret)
        )
        return ConnectorHealth(
            platform=self.platform,
            mode=self.mode,
            configured=configured,
            webhook_configured=bool(self.config.get("webhook_token") or self.settings.dingtalk_webhook_token),
            capabilities=["test_connection", "create_meeting", "sync_meetings", "recordings", "transcript", "webhook"],
            warnings=[] if configured else ["Missing DingTalk credentials."],
        )

    def validate_webhook(self, headers: dict[str, str], body: bytes) -> bool:
        del body
        token = self.config.get("webhook_token") or self.settings.dingtalk_webhook_token
        timestamp = headers.get("timestamp", "")
        signature = headers.get("sign", "")
        if not all([token, timestamp, signature]):
            return False
        return validate_webhook_signature(token, timestamp, signature)

    def validate_callback_url(self, params: dict[str, str]) -> bool:
        """Validate DingTalk callback URL verification.

        DingTalk sends encrypted challenge during event subscription setup.
        For now, delegate to validate_webhook style check on query params.
        """
        token = self.config.get("webhook_token") or self.settings.dingtalk_webhook_token
        if not token:
            return False
        timestamp = params.get("timestamp", "")
        signature = params.get("sign", "")
        if not all([timestamp, signature]):
            return False
        return validate_webhook_signature(token, timestamp, signature)

    def handle_webhook(self, payload: dict[str, Any]) -> dict[str, Any]:
        event = payload.get("EventType", payload.get("eventType", payload.get("event_type", "")))
        meeting_id = str(payload.get("meetingId") or payload.get("meeting_id") or "")
        recording_id = str(payload.get("recordingId") or payload.get("recording_id") or "")
        return {
            "event_type": event,
            "external_meeting_id": meeting_id,
            "recording_id": recording_id,
            "should_import": event in {"cloud_recording.completed", "meeting.recording.completed"},
        }


def _parse_datetime(value: Any, fallback: datetime) -> datetime:
    if isinstance(value, datetime):
        return value
    if isinstance(value, str) and value:
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return fallback
    return fallback
