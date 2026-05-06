from fastapi import APIRouter, HTTPException, Query, status

from app.config import get_settings
from app.services.auth_service import build_dingtalk_oauth_url, exchange_code_for_token

router = APIRouter(prefix="/api/auth", tags=["auth"])
settings = get_settings()


@router.get("/dingtalk/login-url")
def get_dingtalk_login_url():
    try:
        redirect_uri = settings.dingtalk_oauth_redirect_uri or f"{settings.frontend_url}/auth/dingtalk/callback"
        login_url = build_dingtalk_oauth_url(redirect_uri)
        return {
            "data": {"url": login_url, "configured": False},
            "message": "钉钉扫码登录即将开放",
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to prepare DingTalk login URL.",
        ) from exc


@router.get("/dingtalk/callback")
def handle_dingtalk_callback(code: str | None = Query(default=None)):
    try:
        token_payload = exchange_code_for_token(code or "")
        return {
            "data": token_payload,
            "message": "钉钉登录即将开放",
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to handle DingTalk callback.",
        ) from exc


@router.get("/dingtalk/status")
def get_dingtalk_auth_status():
    try:
        return {
            "data": {"configured": False},
            "message": "钉钉扫码登录即将开放",
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load DingTalk auth status.",
        ) from exc
