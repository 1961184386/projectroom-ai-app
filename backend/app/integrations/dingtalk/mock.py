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


class DingTalkMockConnector(AbstractConnector):
    platform = "dingtalk"
    mode = "mock"

    def test_connection(self) -> ConnectionTestResult:
        return ConnectionTestResult(
            connected=True,
            message="DingTalk mock connector is ready.",
            details={"mode": "mock"},
        )

    def create_meeting(self, meeting_data: ExternalMeetingCreatePayload) -> ExternalMeeting:
        meeting_id = f"dt_mock_{int(meeting_data.start_time.timestamp())}"
        return ExternalMeeting(
            external_id=meeting_id,
            title=meeting_data.title,
            start_time=meeting_data.start_time,
            end_time=meeting_data.end_time,
            participants=meeting_data.participants,
            platform=self.platform,
            status="scheduled",
            join_url=f"https://dingtalk.com/mock/{meeting_id}",
            agenda=meeting_data.agenda,
        )

    def get_meeting(self, external_id: str) -> ExternalMeeting:
        start_time = datetime.utcnow() + timedelta(days=1)
        return ExternalMeeting(
            external_id=external_id,
            title="钉钉交付周会",
            start_time=start_time,
            end_time=start_time + timedelta(hours=1),
            participants=["产品 张婷", "研发 刘洋", "测试 陈浩"],
            platform=self.platform,
            status="completed",
            join_url=f"https://dingtalk.com/mock/{external_id}",
            agenda="交付排期与分钟纪要确认",
        )

    def list_meetings(self, limit: int = 10) -> list[ExternalMeeting]:
        return [self.get_meeting(f"dt_sync_{index}") for index in range(1, limit + 1)]

    def list_recordings(self, meeting_id: str) -> list[RecordingInfo]:
        return [
            RecordingInfo(
                id=f"dt_recording_{meeting_id}",
                meeting_id=meeting_id,
                duration=3300,
                file_url=f"https://dingtalk.com/mock/recordings/{meeting_id}",
                status="completed",
            )
        ]

    def get_transcript(self, recording_id: str) -> str:
        del recording_id
        return (
            "张婷：本周先完成腾讯会议和钉钉接入骨架，真实密钥后补联调。\n"
            "刘洋：创建会议、同步会议、Webhook 和录制转写导入都要有可运行 fallback。\n"
            "陈浩：测试会覆盖 mock 配置、导入链路、Webhook 签名和前端构建。"
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
        event = payload.get("event_type", "cloud_recording.completed")
        meeting_id = str(payload.get("meeting_id", "dt_mock_webhook"))
        recording_id = str(payload.get("recording_id", f"dt_recording_{meeting_id}"))
        return {
            "event_type": event,
            "external_meeting_id": meeting_id,
            "recording_id": recording_id,
            "should_import": event == "cloud_recording.completed",
        }
