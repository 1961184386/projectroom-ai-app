def test_dingtalk_login_url_returns_placeholder_payload(client):
    response = client.get("/api/auth/dingtalk/login-url")

    assert response.status_code == 200
    payload = response.json()

    assert payload["message"] == "钉钉扫码登录即将开放"
    assert payload["data"]["configured"] is False
    assert payload["data"]["url"].startswith("https://login.dingtalk.com/oauth2/auth")


def test_dingtalk_callback_returns_placeholder_payload(client):
    response = client.get("/api/auth/dingtalk/callback?code=demo-code")

    assert response.status_code == 200
    payload = response.json()

    assert payload["message"] == "钉钉登录即将开放"
    assert payload["data"]["status"] == "not_configured"
    assert payload["data"]["code"] == "demo-code"


def test_dingtalk_status_returns_placeholder_payload(client):
    response = client.get("/api/auth/dingtalk/status")

    assert response.status_code == 200
    payload = response.json()

    assert payload == {
        "data": {"configured": False},
        "message": "钉钉扫码登录即将开放",
    }
