from __future__ import annotations

import base64
import hashlib
import hmac
import time

import httpx


def get_access_token(base_url: str, app_key: str, app_secret: str) -> tuple[str, int]:
    with httpx.Client(timeout=10.0) as client:
        response = client.post(
            f"{base_url}/v1.0/oauth2/accessToken",
            json={"appKey": app_key, "appSecret": app_secret},
        )
        response.raise_for_status()
        payload = response.json()
        return payload.get("accessToken", ""), int(payload.get("expireIn", 7200))


def validate_webhook_signature(token: str, timestamp: str, signature: str) -> bool:
    string_to_sign = f"{timestamp}\n{token}".encode("utf-8")
    digest = hmac.new(token.encode("utf-8"), string_to_sign, hashlib.sha256).digest()
    expected = base64.b64encode(digest).decode("utf-8")
    return hmac.compare_digest(expected, signature)


def build_cached_token_expiry(expires_in: int) -> float:
    return time.time() + max(expires_in - 60, 60)
