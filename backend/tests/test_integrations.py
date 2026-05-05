def test_integration_config_crud_and_test_connection(client):
    create_response = client.post(
        "/api/integrations/configs",
        json={
            "platform": "tencent_meeting",
            "api_mode": "mock",
            "config_json": {"app_id": "demo-app", "secret_key": "very-secret"},
            "is_enabled": True,
        },
    )

    assert create_response.status_code == 200
    created = create_response.json()["data"]
    assert created["platform"] == "tencent_meeting"
    assert created["config_json"]["secret_key"] == "******"

    list_response = client.get("/api/integrations/configs")
    assert list_response.status_code == 200
    assert len(list_response.json()["data"]) == 1

    info_response = client.get("/api/integrations/tencent_meeting/info")
    assert info_response.status_code == 200
    assert info_response.json()["data"]["effective_mode"] == "mock"

    test_response = client.post("/api/integrations/tencent_meeting/test")
    assert test_response.status_code == 200
    assert test_response.json()["data"]["connected"] is True

    delete_response = client.delete(f"/api/integrations/configs/{created['id']}")
    assert delete_response.status_code == 200


def test_create_sync_and_import_external_meeting_mock(client):
    project = client.post("/api/projects", json={"name": "Integration Project"}).json()["data"]

    create_response = client.post(
        "/api/integrations/tencent_meeting/meetings",
        json={
            "project_id": project["id"],
            "title": "平台创建会议",
            "start_time": "2026-05-06T10:00:00",
            "end_time": "2026-05-06T11:00:00",
            "participants": ["Alice", "Bob"],
            "agenda": "Demo",
        },
    )
    assert create_response.status_code == 200
    create_payload = create_response.json()["data"]
    assert create_payload["meeting"]["external_platform"] == "tencent_meeting"
    assert create_payload["meeting"]["external_meeting_id"].startswith("tm_mock_")

    sync_response = client.post(
        "/api/integrations/tencent_meeting/meetings/sync",
        json={"project_id": project["id"], "limit": 2},
    )
    assert sync_response.status_code == 200
    assert len(sync_response.json()["data"]) == 2

    import_response = client.post(
        "/api/integrations/tencent_meeting/import/tm_sync_1",
        json={"project_id": project["id"], "auto_analyze": False},
    )
    assert import_response.status_code == 200
    imported = import_response.json()["data"]
    assert imported["imported"] is True
    assert imported["platform"] == "tencent_meeting"

    meeting_detail = client.get(f"/api/projects/{project['id']}/meetings/{imported['meeting_id']}")
    assert meeting_detail.status_code == 200
    assert "mock" in meeting_detail.json()["data"]["transcript_text"] or "范围" in meeting_detail.json()["data"]["transcript_text"]
