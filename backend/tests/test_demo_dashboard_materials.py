from uuid import uuid4

from scripts.seed_demo import PROJECT_NAME


def test_demo_status_and_seed_endpoint(client):
    status_response = client.get("/api/demo/status")
    assert status_response.status_code == 200
    assert status_response.json()["data"]["seeded"] is False

    seed_response = client.post("/api/demo/seed")
    assert seed_response.status_code == 200
    seed_payload = seed_response.json()["data"]
    assert seed_payload["seeded"] is True
    assert seed_payload["project_name"] == PROJECT_NAME

    second_seed_response = client.post("/api/demo/seed")
    assert second_seed_response.status_code == 200
    assert second_seed_response.json()["data"]["seeded"] is False

    status_after_seed = client.get("/api/demo/status")
    assert status_after_seed.status_code == 200
    assert status_after_seed.json()["data"]["seeded"] is True


def test_dashboard_stats_returns_expected_counts(client):
    project = client.post("/api/projects", json={"name": "Stats Project"}).json()["data"]
    meeting = client.post(
        f"/api/projects/{project['id']}/meetings",
        json={
            "title": "Stats Meeting",
            "platform": "manual",
            "meeting_time": "2026-05-05T10:00:00",
            "participants": "Alice,Bob",
            "agenda": "Stats",
            "transcript_text": "Transcript",
        },
    ).json()["data"]
    client.post(
        f"/api/meetings/{meeting['id']}/analysis/confirm",
        json={
            "item_type": "action_item",
            "item_index": 0,
            "confirmed": True,
        },
    )

    client.post("/api/demo/seed")

    response = client.get("/api/dashboard/stats")
    assert response.status_code == 200
    payload = response.json()["data"]
    assert payload["total_projects"] == 2
    assert payload["total_meetings"] == 4
    assert payload["pending_action_items"] >= 1
    assert payload["active_risks"] >= 1


def test_materials_crud_endpoints(client):
    project = client.post("/api/projects", json={"name": "Materials Project"}).json()["data"]

    create_response = client.post(
        f"/api/projects/{project['id']}/materials",
        json={
            "title": "PRD 摘要",
            "material_type": "prd",
            "content": "核心目标和范围说明",
        },
    )
    assert create_response.status_code == 201
    material = create_response.json()["data"]

    list_response = client.get(f"/api/projects/{project['id']}/materials")
    assert list_response.status_code == 200
    materials = list_response.json()["data"]
    assert len(materials) == 1
    assert materials[0]["title"] == "PRD 摘要"

    delete_response = client.delete(f"/api/projects/{project['id']}/materials/{material['id']}")
    assert delete_response.status_code == 200

    list_after_delete = client.get(f"/api/projects/{project['id']}/materials")
    assert list_after_delete.status_code == 200
    assert list_after_delete.json()["data"] == []


def test_materials_returns_404_for_missing_resources(client):
    project = client.post("/api/projects", json={"name": "Missing Material Project"}).json()["data"]

    missing_project_response = client.get(f"/api/projects/{uuid4()}/materials")
    assert missing_project_response.status_code == 404

    missing_material_response = client.delete(f"/api/projects/{project['id']}/materials/{uuid4()}")
    assert missing_material_response.status_code == 404
