from __future__ import annotations

from datetime import datetime
from typing import Any

import httpx

from app.integrations.base import AbstractConnector
from app.integrations.tencent.auth import build_enterprise_jwt_headers, build_oauth_headers, validate_webhook_signature
from app.integrations.types import (
    ConnectionTestResult,
    ConnectorHealth,
    ExternalMeeting,
    ExternalMeetingCreatePayload,
    RecordingInfo,
)


class TencentMeetingConnector(AbstractConnector):
    platform = "tencent_meeting"

    def __init__(self, settings, config: dict[str, Any], mode: str) -> None:
        self.settings = settings
        self.config = config
        self.mode = mode
        self.base_url = config.get("base_url") or settings.tencent_meeting_base_url
        self.auth_mode = config.get("auth_mode") or settings.tencent_meeting_auth_mode

    def _headers(self) -> dict[str, str]:
        if self.auth_mode == "oauth":
            access_token = self.config.get("access_token", "")
            if not access_token:
                raise ValueError("Tencent Meeting OAuth access_token is required.")
            return build_oauth_headers(access_token)

        app_id = self.config.get("app_id") or self.settings.tencent_meeting_app_id
        secret_id = self.config.get("secret_id") or self.settings.tencent_meeting_secret_id
        secret_key = self.config.get("secret_key") or self.settings.tencent_meeting_secret_key
        if not all([app_id, secret_id, secret_key]):
            raise ValueError("Tencent Meeting enterprise_jwt credentials are required.")
        return build_enterprise_jwt_headers(app_id, secret_id, secret_key)

    def _request(self, method: str, path: str, json_payload: dict[str, Any] | None = None) -> dict[str, Any]:
        headers = {"Content-Type": "application/json", **self._headers()}
        with httpx.Client(timeout=10.0) as client:
            response = client.request(method, f"{self.base_url}{path}", headers=headers, json=json_payload)
            response.raise_for_status()
            if not response.content:
                return {}
            return response.json()

    def test_connection(self) -> ConnectionTestResult:
        try:
            self._headers()
            return ConnectionTestResult(
                connected=True,
                message="Tencent Meeting credentials loaded. Network call deferred until API use.",
                details={"auth_mode": self.auth_mode, "mode": self.mode},
            )
        except Exception as exc:
            return ConnectionTestResult(connected=False, message=str(exc), details={"mode": self.mode})

    def create_meeting(self, meeting_data: ExternalMeetingCreatePayload) -> ExternalMeeting:
        payload = {
            "subject": meeting_data.title,
            "type": 0,
            "start_time": meeting_data.start_time.isoformat(),
            "end_time": meeting_data.end_time.isoformat(),
            "invitees": [{"user_name": participant} for participant in meeting_data.participants],
        }
        response = self._request("POST", "/v1/meetings", payload)
        info = response.get("meeting_info", response)
        return ExternalMeeting(
            external_id=str(info.get("meeting_id") or info.get("id")),
            title=info.get("subject", meeting_data.title),
            start_time=_parse_datetime(info.get("start_time"), meeting_data.start_time),
            end_time=_parse_datetime(info.get("end_time"), meeting_data.end_time),
            participants=meeting_data.participants,
            platform=self.platform,
            status=str(info.get("status", "scheduled")),
            join_url=info.get("join_url"),
            agenda=meeting_data.agenda,
        )

    def get_meeting(self, external_id: str) -> ExternalMeeting:
        response = self._request("GET", f"/v1/meetings/{external_id}")
        info = response.get("meeting_info", response)
        start_time = _parse_datetime(info.get("start_time"), datetime.utcnow())
        end_time = _parse_datetime(info.get("end_time"), start_time)
        participants = [participant.get("user_name", "") for participant in info.get("participants", []) if participant.get("user_name")]
        return ExternalMeeting(
            external_id=external_id,
            title=info.get("subject", "Tencent Meeting"),
            start_time=start_time,
            end_time=end_time,
            participants=participants,
            platform=self.platform,
            status=str(info.get("status", "scheduled")),
            join_url=info.get("join_url"),
            agenda=info.get("agenda"),
        )

    def list_meetings(self, limit: int = 10) -> list[ExternalMeeting]:
        response = self._request("GET", f"/v1/meetings?page_size={limit}")
        meetings = response.get("meeting_info_list", response.get("meetings", []))
        return [
            ExternalMeeting(
                external_id=str(item.get("meeting_id") or item.get("id")),
                title=item.get("subject", "Tencent Meeting"),
                start_time=_parse_datetime(item.get("start_time"), datetime.utcnow()),
                end_time=_parse_datetime(item.get("end_time"), datetime.utcnow()),
                participants=[],
                platform=self.platform,
                status=str(item.get("status", "scheduled")),
                join_url=item.get("join_url"),
                agenda=item.get("agenda"),
            )
            for item in meetings
        ]

    def list_recordings(self, meeting_id: str) -> list[RecordingInfo]:
        response = self._request("GET", f"/v1/meetings/{meeting_id}/recordings")
        recordings = response.get("recording_files", response.get("recordings", []))
        return [
            RecordingInfo(
                id=str(item.get("record_file_id") or item.get("id")),
                meeting_id=meeting_id,
                duration=int(item.get("duration", 0)),
                file_url=item.get("download_url"),
                status=str(item.get("status", "completed")),
            )
            for item in recordings
        ]

    def get_transcript(self, recording_id: str) -> str:
        response = self._request("GET", f"/v1/recordings/{recording_id}/transcript")
        paragraphs = response.get("paragraphs", [])
        if not paragraphs:
            return response.get("transcript_text", "")
        return "\n".join(
            f"{item.get('speaker', 'Speaker')}：{item.get('text', '')}".strip()
            for item in paragraphs
        )

    def health_check(self) -> ConnectorHealth:
        if self.auth_mode == "enterprise_jwt":
            configured = bool(
                (self.config.get("app_id") or self.settings.tencent_meeting_app_id)
                and (self.config.get("secret_id") or self.settings.tencent_meeting_secret_id)
                and (self.config.get("secret_key") or self.settings.tencent_meeting_secret_key)
            )
        else:
            configured = bool(self.config.get("access_token"))
        return ConnectorHealth(
            platform=self.platform,
            mode=self.mode,
            configured=configured,
            webhook_configured=bool(self.config.get("webhook_token") or self.settings.tencent_meeting_webhook_token),
            capabilities=["test_connection", "create_meeting", "sync_meetings", "recordings", "transcript", "webhook"],
            warnings=[] if configured else ["Missing Tencent Meeting credentials."],
        )

    def validate_webhook(self, headers: dict[str, str], body: bytes) -> bool:
        token = self.config.get("webhook_token") or self.settings.tencent_meeting_webhook_token
        if not token:
            return False
        timestamp = headers.get("x-tencent-signature-timestamp", "")
        nonce = headers.get("x-tencent-signature-nonce", "")
        signature = headers.get("x-tencent-signature", "")
        if not all([timestamp, nonce, signature]):
            return False
        return validate_webhook_signature(token, timestamp, nonce, signature, body)

    def handle_webhook(self, payload: dict[str, Any]) -> dict[str, Any]:
        event = payload.get("event", payload.get("event_type", ""))
        meeting_info = payload.get("meeting_info", {})
        external_meeting_id = str(
            payload.get("meeting_id")
            or meeting_info.get("meeting_id")
            or payload.get("meeting", {}).get("meeting_id", "")
        )
        recording_files = payload.get("recording_files", [])
        recording_id = None
        if recording_files:
            recording_id = str(recording_files[0].get("record_file_id") or recording_files[0].get("id"))
        recording_id = str(payload.get("recording_id") or recording_id or "")
        return {
            "event_type": event,
            "external_meeting_id": external_meeting_id,
            "recording_id": recording_id,
            "should_import": event == "recording.completed",
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
