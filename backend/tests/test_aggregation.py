from unittest.mock import patch
from uuid import uuid4

from app.ai.schemas import AnalysisResult


def create_project(client, name: str = "Aggregation Project"):
    return client.post("/api/projects", json={"name": name}).json()["data"]


def create_meeting(client, project_id: str, title: str, meeting_time: str, transcript_text: str):
    return client.post(
        f"/api/projects/{project_id}/meetings",
        json={
            "title": title,
            "platform": "manual",
            "meeting_time": meeting_time,
            "participants": "Alice,Bob",
            "agenda": "Aggregation",
            "transcript_text": transcript_text,
        },
    ).json()["data"]


@patch("app.services.analysis_service.analyzer.analyze")
def test_aggregation_endpoints_flatten_across_meetings_in_desc_order(mock_analyze, client):
    project = create_project(client)
    older_meeting = create_meeting(
        client,
        project["id"],
        "Weekly Sync",
        "2026-05-03T09:00:00",
        "Discussed older tasks and risks.",
    )
    newer_meeting = create_meeting(
        client,
        project["id"],
        "Steering Committee",
        "2026-05-05T09:00:00",
        "Discussed newest tasks and decisions.",
    )

    older_result = AnalysisResult.model_validate(
        {
            "meeting_summary": "Older summary",
            "key_decisions": [
                {
                    "decision": "Older decision",
                    "owner": "Alice",
                    "impact": "Older impact",
                    "evidence": "Older evidence",
                }
            ],
            "action_items": [
                {
                    "task": "Older task",
                    "owner": "Bob",
                    "deadline": "2026-05-06",
                    "priority": "low",
                    "status": "pending",
                    "evidence": "Older task evidence",
                }
            ],
            "requirement_changes": [
                {
                    "change": "Older change",
                    "type": "modified",
                    "impact_on_scope": "Older scope impact",
                    "need_confirmation": False,
                    "evidence": "Older change evidence",
                }
            ],
            "risks": [
                {
                    "risk": "Older risk",
                    "level": "medium",
                    "suggestion": "Older suggestion",
                    "evidence": "Older risk evidence",
                }
            ],
            "open_questions": [],
            "next_meeting_topics": [],
        }
    )
    newer_result = AnalysisResult.model_validate(
        {
            "meeting_summary": "Newer summary",
            "key_decisions": [
                {
                    "decision": "Newest decision",
                    "owner": "Client",
                    "impact": "Newest impact",
                    "evidence": "Newest evidence",
                }
            ],
            "action_items": [
                {
                    "task": "Newest task A",
                    "owner": "Alice",
                    "deadline": "2026-05-08",
                    "priority": "high",
                    "status": "pending",
                    "evidence": "Newest task evidence A",
                },
                {
                    "task": "Newest task B",
                    "owner": "",
                    "deadline": "",
                    "priority": "medium",
                    "status": "pending",
                    "evidence": "Newest task evidence B",
                },
            ],
            "requirement_changes": [
                {
                    "change": "Newest change",
                    "type": "new",
                    "impact_on_scope": "Newest scope impact",
                    "need_confirmation": True,
                    "evidence": "Newest change evidence",
                }
            ],
            "risks": [
                {
                    "risk": "Newest risk",
                    "level": "high",
                    "suggestion": "Newest suggestion",
                    "evidence": "Newest risk evidence",
                }
            ],
            "open_questions": [],
            "next_meeting_topics": [],
        }
    )
    mock_analyze.side_effect = [older_result, newer_result]

    client.post(f"/api/meetings/{older_meeting['id']}/analyze")
    client.post(f"/api/meetings/{newer_meeting['id']}/analyze")

    todos_response = client.get(f"/api/projects/{project['id']}/todos")
    risks_response = client.get(f"/api/projects/{project['id']}/risks")
    changes_response = client.get(f"/api/projects/{project['id']}/changes")
    decisions_response = client.get(f"/api/projects/{project['id']}/decisions")

    assert todos_response.status_code == 200
    todos = todos_response.json()["data"]
    assert [item["task"] for item in todos] == ["Newest task A", "Newest task B", "Older task"]
    assert todos[0]["meeting_id"] == newer_meeting["id"]
    assert todos[0]["meeting_title"] == "Steering Committee"

    assert risks_response.status_code == 200
    risks = risks_response.json()["data"]
    assert [item["risk"] for item in risks] == ["Newest risk", "Older risk"]
    assert risks[0]["meeting_time"] == "2026-05-05T09:00:00"

    assert changes_response.status_code == 200
    changes = changes_response.json()["data"]
    assert [item["change"] for item in changes] == ["Newest change", "Older change"]
    assert changes[1]["need_confirmation"] is False

    assert decisions_response.status_code == 200
    decisions = decisions_response.json()["data"]
    assert [item["decision"] for item in decisions] == ["Newest decision", "Older decision"]
    assert decisions[1]["meeting_title"] == "Weekly Sync"


def test_aggregation_endpoints_return_empty_lists_for_project_without_analysis(client):
    project = create_project(client)
    create_meeting(
        client,
        project["id"],
        "Kickoff",
        "2026-05-02T10:00:00",
        "No analysis yet.",
    )

    for path in ("todos", "risks", "changes", "decisions"):
        response = client.get(f"/api/projects/{project['id']}/{path}")
        assert response.status_code == 200
        assert response.json()["data"] == []


def test_aggregation_endpoints_return_404_for_missing_project(client):
    for path in ("todos", "risks", "changes", "decisions"):
        response = client.get(f"/api/projects/{uuid4()}/{path}")
        assert response.status_code == 404
        assert response.json()["detail"] == "Project not found."
