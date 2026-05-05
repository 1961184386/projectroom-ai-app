from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./projectroom.db"
    frontend_url: str = "http://localhost:3000"
    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    openai_model: str = "gpt-4o"
    webhook_public_base_url: str = ""

    tencent_meeting_api_mode: Literal["real", "mock", "sandbox"] = "mock"
    tencent_meeting_app_id: str = ""
    tencent_meeting_corp_id: str = ""
    tencent_meeting_secret_id: str = ""
    tencent_meeting_secret_key: str = ""
    tencent_meeting_sdk_id: str = ""
    tencent_meeting_auth_mode: Literal["enterprise_jwt", "oauth"] = "enterprise_jwt"
    tencent_meeting_webhook_token: str = ""
    tencent_meeting_webhook_url: str = ""
    tencent_meeting_base_url: str = "https://api.meeting.qq.com"

    dingtalk_api_mode: Literal["real", "mock", "sandbox"] = "mock"
    dingtalk_app_key: str = ""
    dingtalk_app_secret: str = ""
    dingtalk_corp_id: str = ""
    dingtalk_agent_id: str = ""
    dingtalk_webhook_token: str = ""
    dingtalk_webhook_url: str = ""
    dingtalk_base_url: str = "https://api.dingtalk.com"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
