from unittest.mock import patch
from uuid import uuid4


def create_project(client, name: str = "Chat Project") -> dict:
    return client.post("/api/projects", json={"name": name}).json()["data"]


def create_meeting(
    client,
    project_id: str,
    title: str,
    meeting_time: str,
    transcript_text: str,
    participants: str = "Alice,Bob",
) -> dict:
    return client.post(
        f"/api/projects/{project_id}/meetings",
        json={
            "title": title,
            "platform": "manual",
            "meeting_time": meeting_time,
            "participants": participants,
            "transcript_text": transcript_text,
        },
    ).json()["data"]


@patch("app.services.chat_service.chat.ask")
def test_project_chat_returns_answer_with_sources(mock_ask, client):
    project = create_project(client)
    earlier_meeting = create_meeting(
        client,
        project["id"],
        "Kickoff",
        "2026-05-04T09:00:00",
        "团队确认了里程碑和接口方案。",
    )
    latest_meeting = create_meeting(
        client,
        project["id"],
        "Weekly Sync",
        "2026-05-05T09:00:00",
        "Bob 负责在周五前补充接口文档。",
    )
    mock_ask.return_value = (
        f"最近明确的任务是 Bob 在周五前补充接口文档。"
        f"[SOURCE:{latest_meeting['id']}][SOURCE:{earlier_meeting['id']}]"
    )

    response = client.post(
        f"/api/projects/{project['id']}/chat",
        json={"question": "上次会议确定了哪些任务？"},
    )

    assert response.status_code == 200
    payload = response.json()["data"]
    assert payload["answer"] == "最近明确的任务是 Bob 在周五前补充接口文档。"
    assert payload["sources"] == [
        {
            "meeting_id": latest_meeting["id"],
            "meeting_title": "Weekly Sync",
            "meeting_time": "2026-05-05T09:00:00",
        },
        {
            "meeting_id": earlier_meeting["id"],
            "meeting_title": "Kickoff",
            "meeting_time": "2026-05-04T09:00:00",
        },
    ]
    mock_ask.assert_called_once()


def test_project_chat_without_meetings_returns_friendly_message(client):
    project = create_project(client, name="Empty Project")

    response = client.post(
        f"/api/projects/{project['id']}/chat",
        json={"question": "当前有哪些风险？"},
    )

    assert response.status_code == 200
    assert response.json()["data"] == {
        "answer": "该项目暂无会议记录，无法回答问题。",
        "sources": [],
    }


def test_project_chat_missing_project_returns_404(client):
    response = client.post(
        f"/api/projects/{uuid4()}/chat",
        json={"question": "当前有哪些风险？"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Project not found."
