from urllib.parse import quote


def build_dingtalk_oauth_url(redirect_uri: str) -> str:
    """Reserved: build actual DingTalk OAuth URL when credentials are configured."""

    encoded_redirect_uri = quote(redirect_uri, safe="")
    return (
        "https://login.dingtalk.com/oauth2/auth"
        f"?redirect_uri={encoded_redirect_uri}"
        "&response_type=code"
        "&client_id=reserved-client-id"
        "&scope=openid"
        "&prompt=consent"
    )


def exchange_code_for_token(code: str) -> dict:
    """Reserved: exchange OAuth code for access_token."""

    return {
        "status": "not_configured",
        "code": code,
        "message": "DingTalk OAuth token exchange is reserved for a future task.",
    }
