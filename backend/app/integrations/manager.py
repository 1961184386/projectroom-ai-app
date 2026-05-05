from __future__ import annotations

from app.config import get_settings
from app.integrations.base import AbstractConnector
from app.integrations.dingtalk import DingTalkConnector, DingTalkMockConnector
from app.integrations.tencent import TencentMeetingConnector, TencentMeetingMockConnector
from app.models.integration_config import IntegrationConfig


SUPPORTED_PLATFORMS = {"tencent_meeting", "dingtalk"}


class IntegrationManager:
    def __init__(self) -> None:
        self.settings = get_settings()

    def get_connector(self, platform: str, config: IntegrationConfig | None = None) -> AbstractConnector:
        if platform not in SUPPORTED_PLATFORMS:
            raise ValueError(f"Unsupported platform: {platform}")

        config_json = config.config_json if config else {}
        requested_mode = config.api_mode if config else self._default_mode(platform)
        effective_mode = self._effective_mode(platform, requested_mode, config_json)

        if platform == "tencent_meeting":
            if effective_mode in {"mock", "sandbox"}:
                return TencentMeetingMockConnector()
            return TencentMeetingConnector(self.settings, config_json, effective_mode)

        if effective_mode in {"mock", "sandbox"}:
            return DingTalkMockConnector()
        return DingTalkConnector(self.settings, config_json, effective_mode)

    def get_platform_info(self, platform: str, config: IntegrationConfig | None = None) -> dict:
        connector = self.get_connector(platform, config)
        health = connector.health_check()
        return {
            "platform": platform,
            "requested_mode": config.api_mode if config else self._default_mode(platform),
            "effective_mode": connector.mode,
            "health": health.model_dump(),
        }

    def _default_mode(self, platform: str) -> str:
        if platform == "tencent_meeting":
            return self.settings.tencent_meeting_api_mode
        return self.settings.dingtalk_api_mode

    def _effective_mode(self, platform: str, requested_mode: str, config_json: dict) -> str:
        if requested_mode in {"mock", "sandbox"}:
            return requested_mode
        if platform == "tencent_meeting":
            required = [
                config_json.get("app_id") or self.settings.tencent_meeting_app_id,
                config_json.get("secret_id") or self.settings.tencent_meeting_secret_id,
                config_json.get("secret_key") or self.settings.tencent_meeting_secret_key,
            ]
        else:
            required = [
                config_json.get("app_key") or self.settings.dingtalk_app_key,
                config_json.get("app_secret") or self.settings.dingtalk_app_secret,
            ]
        return "real" if all(required) else "mock"
