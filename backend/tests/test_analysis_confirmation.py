from unittest.mock import patch

from app.ai.schemas import AnalysisResult


ANALYSIS_RESULT = {
    "meeting_summary": "确认流程测试摘要",
    "key_decisions": [
        {
            "decision": "锁定接口方案",
            "owner": "Alice",
            "impact": "推进联调",
            "evidence": "今天确认接口方案。",
        }
    ],
    "action_items": [
        {
            "task": "整理接口文档",
            "owner": "Bob",
            "deadline": "2026-05-09",
            "priority": "high",
            "status": "pending",
            "evidence": "Bob 负责接口文档。",
        }
    ],
    "requirement_changes": [
        {
            "change": "新增移动端审批入口",
            "type": "new",
            "impact_on_scope": "前端工作量增加",
            "need_confirmation": True,
            "evidence": "客户提出移动端入口。",
        }
    ],
    "risks": [
        {
            "risk": "接口字段仍可能变更",
            "level": "medium",
            "suggestion": "本周锁定字段",
            "evidence": "接口定义未定稿。",
        }
    ],
    "open_questions": [],
    "next_meeting_topics": [],
}


def create_meeting(client):
    project = client.post("/api/projects", json={"name": "Confirm Project"}).json()["data"]
    meeting = client.post(
        f"/api/projects/{project['id']}/meetings",
        json={
            "title": "Confirm Meeting",
            "platform": "manual",
            "meeting_time": "2026-05-05T10:00:00",
            "participants": "Alice,Bob",
            "agenda": "Confirm",
            "transcript_text": "Discussed tasks and risks.",
        },
    ).json()["data"]
    return project, meeting


@patch("app.services.analysis_service.analyzer.analyze")
def test_confirm_analysis_item_updates_analysis_and_aggregations(mock_analyze, client):
    mock_analyze.return_value = AnalysisResult.model_validate(ANALYSIS_RESULT)
    project, meeting = create_meeting(client)
    client.post(f"/api/meetings/{meeting['id']}/analyze")

    response = client.patch(
        f"/api/meetings/{meeting['id']}/analysis/confirm",
        json={
            "item_type": "action_item",
            "item_index": 0,
            "confirmed": True,
        },
    )

    assert response.status_code == 200
    assert response.json()["data"]["action_items"][0]["confirmed"] is True

    analysis_response = client.get(f"/api/meetings/{meeting['id']}/analysis")
    assert analysis_response.status_code == 200
    assert analysis_response.json()["data"]["action_items"][0]["confirmed"] is True
    assert analysis_response.json()["data"]["risks"][0]["confirmed"] is False

    todos_response = client.get(f"/api/projects/{project['id']}/todos")
    assert todos_response.status_code == 200
    assert todos_response.json()["data"][0]["confirmed"] is True


@patch("app.services.analysis_service.analyzer.analyze")
def test_confirm_analysis_item_validates_inputs(mock_analyze, client):
    mock_analyze.return_value = AnalysisResult.model_validate(ANALYSIS_RESULT)
    _, meeting = create_meeting(client)
    client.post(f"/api/meetings/{meeting['id']}/analyze")

    invalid_type_response = client.patch(
        f"/api/meetings/{meeting['id']}/analysis/confirm",
        json={
            "item_type": "unknown",
            "item_index": 0,
            "confirmed": True,
        },
    )
    assert invalid_type_response.status_code == 400

    invalid_index_response = client.patch(
        f"/api/meetings/{meeting['id']}/analysis/confirm",
        json={
            "item_type": "risk",
            "item_index": 99,
            "confirmed": True,
        },
    )
    assert invalid_index_response.status_code == 400
