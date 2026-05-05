from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
from typing import Any


def build_enterprise_jwt_headers(app_id: str, secret_id: str, secret_key: str) -> dict[str, str]:
    issued_at = int(time.time())
    expires_at = issued_at + 3600
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "appId": app_id,
        "sdkId": app_id,
        "iat": issued_at,
        "exp": expires_at,
        "iss": secret_id,
    }

    def _encode(value: dict[str, Any]) -> str:
        raw = json.dumps(value, separators=(",", ":"), ensure_ascii=True).encode("utf-8")
        return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("utf-8")

    signing_input = f"{_encode(header)}.{_encode(payload)}"
    signature = hmac.new(secret_key.encode("utf-8"), signing_input.encode("utf-8"), hashlib.sha256).digest()
    token = f"{signing_input}.{base64.urlsafe_b64encode(signature).rstrip(b'=').decode('utf-8')}"
    return {"X-TC-AppId": app_id, "X-TC-Token": token}


def build_oauth_headers(access_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {access_token}"}


def validate_webhook_signature(token: str, timestamp: str, nonce: str, signature: str, body: bytes) -> bool:
    expected = hashlib.sha256(token.encode("utf-8") + timestamp.encode("utf-8") + nonce.encode("utf-8") + body).hexdigest()
    return hmac.compare_digest(expected, signature)
