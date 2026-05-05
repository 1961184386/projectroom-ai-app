from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from app.integrations.base import AbstractConnector
from app.integrations.types import (
    ConnectionTestResult,
    ConnectorHealth,
    ExternalMeeting,
    ExternalMeetingCreatePayload,
    RecordingInfo,
)


class TencentMeetingMockConnector(AbstractConnector):
    platform = "tencent_meeting"
    mode = "mock"

    def test_connection(self) -> ConnectionTestResult:
        return ConnectionTestResult(
            connected=True,
            message="Tencent Meeting mock connector is ready.",
            details={"mode": "mock"},
        )

    def create_meeting(self, meeting_data: ExternalMeetingCreatePayload) -> ExternalMeeting:
        meeting_id = f"tm_mock_{int(meeting_data.start_time.timestamp())}"
        return ExternalMeeting(
            external_id=meeting_id,
            title=meeting_data.title,
            start_time=meeting_data.start_time,
            end_time=meeting_data.end_time,
            participants=meeting_data.participants,
            platform=self.platform,
            status="scheduled",
            join_url=f"https://meeting.tencent.com/mock/{meeting_id}",
            agenda=meeting_data.agenda,
        )

    def get_meeting(self, external_id: str) -> ExternalMeeting:
        start_time = datetime.utcnow() + timedelta(hours=2)
        return ExternalMeeting(
            external_id=external_id,
            title="腾讯会议产品评审",
            start_time=start_time,
            end_time=start_time + timedelta(hours=1),
            participants=["李雷", "韩梅梅", "PM 王敏"],
            platform=self.platform,
            status="completed",
            join_url=f"https://meeting.tencent.com/mock/{external_id}",
            agenda="需求评审与风险对齐",
        )

    def list_meetings(self, limit: int = 10) -> list[ExternalMeeting]:
        return [self.get_meeting(f"tm_sync_{index}") for index in range(1, limit + 1)]

    def list_recordings(self, meeting_id: str) -> list[RecordingInfo]:
        return [
            RecordingInfo(
                id=f"tm_recording_{meeting_id}",
                meeting_id=meeting_id,
                duration=3600,
                file_url=f"https://meeting.tencent.com/mock/recordings/{meeting_id}",
                status="completed",
            )
        ]

    def get_transcript(self, recording_id: str) -> str:
        del recording_id
        return (
            "王敏：今天确认一期范围只包含项目看板与会议分析。\n"
            "李雷：腾讯会议接入先用 mock 和真实环境变量双轨支持。\n"
            "韩梅梅：下周三前完成 webhook 回调联调，并补齐演示录制导入。\n"
            "王敏：风险是客户真实密钥未到位，所以本地必须默认可演示。"
        )

    def health_check(self) -> ConnectorHealth:
        return ConnectorHealth(
            platform=self.platform,
            mode=self.mode,
            configured=True,
            webhook_configured=True,
            capabilities=["test_connection", "create_meeting", "sync_meetings", "import_transcript", "webhook"],
        )

    def validate_webhook(self, headers: dict[str, str], body: bytes) -> bool:
        del headers, body
        return True

    def handle_webhook(self, payload: dict[str, Any]) -> dict[str, Any]:
        event = payload.get("event_type", "recording.completed")
        meeting_id = str(payload.get("meeting_id", "tm_mock_webhook"))
        recording_id = str(payload.get("recording_id", f"tm_recording_{meeting_id}"))
        return {
            "event_type": event,
            "external_meeting_id": meeting_id,
            "recording_id": recording_id,
            "should_import": event == "recording.completed",
        }
