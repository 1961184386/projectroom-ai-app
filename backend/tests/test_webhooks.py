import base64
import hashlib
import hmac


def test_mock_tencent_webhook_imports_without_signature(client):
    project = client.post("/api/projects", json={"name": "Webhook Project"}).json()["data"]

    response = client.post(
        "/api/webhooks/tencent-meeting",
        json={
          "event_type": "recording.completed",
          "meeting_id": "tm_webhook_1",
          "recording_id": "tm_recording_tm_webhook_1",
          "project_id": project["id"],
        },
    )

    assert response.status_code == 200
    payload = response.json()["data"]
    assert payload["accepted"] is True
    assert payload["import_result"]["platform"] == "tencent_meeting"


def test_real_dingtalk_webhook_signature_validation(client):
    client.post(
        "/api/integrations/configs",
        json={
            "platform": "dingtalk",
            "api_mode": "real",
            "config_json": {
                "app_key": "******",
                "app_secret": "******",
                "webhook_token": "demo-token",
            },
            "is_enabled": True,
        },
    )

    bad_response = client.post(
        "/api/webhooks/dingtalk",
        headers={"timestamp": "1710000000", "sign": "invalid"},
        json={"event_type": "cloud_recording.completed", "meeting_id": "dt1"},
    )
    assert bad_response.status_code == 400

    timestamp = "1710000000"
    token = "demo-token"
    string_to_sign = f"{timestamp}\n{token}".encode("utf-8")
    signature = base64.b64encode(hmac.new(token.encode("utf-8"), string_to_sign, hashlib.sha256).digest()).decode("utf-8")

    good_response = client.post(
        "/api/webhooks/dingtalk",
        headers={"timestamp": timestamp, "sign": signature},
        json={"event_type": "cloud_recording.completed", "meeting_id": "dt1"},
    )
    assert good_response.status_code == 200
