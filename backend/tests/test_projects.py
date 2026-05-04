from uuid import uuid4


def test_create_project_returns_201(client):
    response = client.post(
        "/api/projects",
        json={
            "name": "Project Atlas",
            "client_name": "Example Client",
            "description": "Migration delivery",
            "current_stage": "开发中",
            "owner_name": "Alice",
            "goal": "Ship the MVP",
            "acceptance_criteria": "Stakeholder approval",
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["message"] == "ok"
    assert payload["data"]["name"] == "Project Atlas"
    assert payload["data"]["meeting_count"] == 0


def test_list_projects_returns_meeting_count_sorted(client):
    first = client.post("/api/projects", json={"name": "First Project"}).json()["data"]
    second = client.post("/api/projects", json={"name": "Second Project"}).json()["data"]
    client.post(
        f"/api/projects/{first['id']}/meetings",
        json={
            "title": "Kickoff",
            "platform": "manual",
            "meeting_time": "2026-05-04T10:00:00",
            "participants": "Alice,Bob",
            "agenda": "Start",
            "transcript_text": "Transcript content",
        },
    )

    response = client.get("/api/projects")

    assert response.status_code == 200
    payload = response.json()["data"]
    assert payload[0]["id"] == first["id"]
    assert payload[0]["meeting_count"] == 1
    assert payload[1]["id"] == second["id"]
    assert payload[1]["meeting_count"] == 0


def test_get_project_detail_and_missing_404(client):
    project = client.post("/api/projects", json={"name": "Detail Project"}).json()["data"]

    response = client.get(f"/api/projects/{project['id']}")
    missing_response = client.get(f"/api/projects/{uuid4()}")

    assert response.status_code == 200
    assert response.json()["data"]["id"] == project["id"]
    assert missing_response.status_code == 404


def test_patch_project_updates_fields(client):
    project = client.post("/api/projects", json={"name": "Patch Project"}).json()["data"]

    response = client.patch(
        f"/api/projects/{project['id']}",
        json={
            "current_stage": "测试",
            "owner_name": "Bob",
        },
    )

    assert response.status_code == 200
    payload = response.json()["data"]
    assert payload["current_stage"] == "测试"
    assert payload["owner_name"] == "Bob"
