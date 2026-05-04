from uuid import uuid4


def test_create_meeting_returns_201(client):
    project = client.post("/api/projects", json={"name": "Meeting Project"}).json()["data"]

    response = client.post(
        f"/api/projects/{project['id']}/meetings",
        json={
            "title": "Weekly Sync",
            "platform": "manual",
            "meeting_time": "2026-05-05T09:30:00",
            "participants": "Alice,Bob",
            "agenda": "Status sync",
            "transcript_text": "We aligned on the next milestone.",
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["message"] == "ok"
    assert payload["data"]["title"] == "Weekly Sync"
    assert payload["data"]["project_id"] == project["id"]


def test_list_meetings_returns_project_scoped_order(client):
    project_a = client.post("/api/projects", json={"name": "Project A"}).json()["data"]
    project_b = client.post("/api/projects", json={"name": "Project B"}).json()["data"]

    client.post(
        f"/api/projects/{project_a['id']}/meetings",
        json={
            "title": "Older Meeting",
            "platform": "manual",
            "meeting_time": "2026-05-04T09:00:00",
            "transcript_text": "Older transcript",
        },
    )
    newest = client.post(
        f"/api/projects/{project_a['id']}/meetings",
        json={
            "title": "Newer Meeting",
            "platform": "manual",
            "meeting_time": "2026-05-05T09:00:00",
            "transcript_text": "Newer transcript",
        },
    ).json()["data"]
    client.post(
        f"/api/projects/{project_b['id']}/meetings",
        json={
            "title": "Other Project Meeting",
            "platform": "manual",
            "meeting_time": "2026-05-06T09:00:00",
            "transcript_text": "Other project transcript",
        },
    )

    response = client.get(f"/api/projects/{project_a['id']}/meetings")

    assert response.status_code == 200
    payload = response.json()["data"]
    assert len(payload) == 2
    assert payload[0]["id"] == newest["id"]


def test_get_meeting_detail_and_404(client):
    project = client.post("/api/projects", json={"name": "Meeting Detail"}).json()["data"]
    meeting = client.post(
        f"/api/projects/{project['id']}/meetings",
        json={
            "title": "Detail Meeting",
            "platform": "manual",
            "meeting_time": "2026-05-05T09:00:00",
            "transcript_text": "Detailed transcript",
        },
    ).json()["data"]

    response = client.get(f"/api/projects/{project['id']}/meetings/{meeting['id']}")
    missing_response = client.get(f"/api/projects/{project['id']}/meetings/{uuid4()}")

    assert response.status_code == 200
    assert response.json()["data"]["id"] == meeting["id"]
    assert missing_response.status_code == 404
