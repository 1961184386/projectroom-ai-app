from unittest.mock import patch
from uuid import uuid4

from app.ai.schemas import AnalysisResult


ANALYSIS_RESULT = {
    "meeting_summary": "会议明确了当前开发节奏、接口依赖风险和需求确认动作。",
    "key_decisions": [
        {
            "decision": "本周内锁定接口字段定义",
            "owner": "Alice",
            "impact": "决定联调是否按计划开始",
            "evidence": "Alice 表示本周内必须完成字段确认。",
        }
    ],
    "action_items": [
        {
            "task": "整理接口字段说明",
            "owner": "Bob",
            "deadline": "2026-05-08",
            "priority": "high",
            "status": "pending",
            "evidence": "Bob 负责补齐字段说明。",
        }
    ],
    "requirement_changes": [
        {
            "change": "新增审批抄送配置",
            "type": "new",
            "impact_on_scope": "需要补充一个后台配置项",
            "need_confirmation": True,
            "evidence": "客户提出增加抄送能力。",
        }
    ],
    "risks": [
        {
            "risk": "外部接口字段仍在变更",
            "level": "high",
            "suggestion": "与第三方在本周完成字段冻结",
            "evidence": "字段定义尚未最终确认。",
        }
    ],
    "open_questions": [
        {
            "question": "审批是否支持多人并签",
            "owner": "Client",
            "reason": "影响流程建模",
        }
    ],
    "next_meeting_topics": ["接口冻结确认", "审批流细节对齐"],
}


def create_project(client, name: str = "Summary Project") -> dict:
    return client.post("/api/projects", json={"name": name}).json()["data"]


def create_meeting(
    client,
    project_id: str,
    title: str = "Weekly Sync",
    transcript_text: str = "团队讨论了接口冻结、风险和需求变更。",
) -> dict:
    return client.post(
        f"/api/projects/{project_id}/meetings",
        json={
            "title": title,
            "platform": "manual",
            "meeting_time": "2026-05-05T10:00:00",
            "participants": "Alice,Bob,Client",
            "agenda": "Progress review",
            "transcript_text": transcript_text,
        },
    ).json()["data"]


def create_analyzed_meeting(client, project_id: str) -> dict:
    meeting = create_meeting(client, project_id)
    with patch("app.services.analysis_service.analyzer.analyze") as mock_analyze:
        mock_analyze.return_value = AnalysisResult.model_validate(ANALYSIS_RESULT)
        response = client.post(f"/api/meetings/{meeting['id']}/analyze")
        assert response.status_code == 200
    return meeting


@patch("app.services.summary_service.summarizer.summarize")
def test_generate_project_summary_success(mock_summarize, client):
    mock_summarize.return_value = "项目整体处于联调准备阶段，关键风险集中在外部接口确认。"
    project = create_project(client)
    create_analyzed_meeting(client, project["id"])

    response = client.post(f"/api/projects/{project['id']}/summary")

    assert response.status_code == 200
    payload = response.json()
    assert payload["message"] == "ok"
    assert payload["data"]["project_id"] == project["id"]
    assert payload["data"]["summary_text"] == mock_summarize.return_value
    mock_summarize.assert_called_once()

    get_response = client.get(f"/api/projects/{project['id']}/summary")
    assert get_response.status_code == 200
    assert get_response.json()["data"]["summary_text"] == mock_summarize.return_value


@patch("app.services.summary_service.summarizer.summarize")
def test_generate_project_summary_is_idempotent_and_overwrites(mock_summarize, client):
    mock_summarize.side_effect = [
        "第一次项目摘要：当前重点是接口冻结。",
        "第二次项目摘要：接口已冻结，开始联调准备。",
    ]
    project = create_project(client)
    create_analyzed_meeting(client, project["id"])

    first_response = client.post(f"/api/projects/{project['id']}/summary")
    second_response = client.post(f"/api/projects/{project['id']}/summary")

    assert first_response.status_code == 200
    assert second_response.status_code == 200
    assert first_response.json()["data"]["id"] == second_response.json()["data"]["id"]
    assert second_response.json()["data"]["summary_text"] == "第二次项目摘要：接口已冻结，开始联调准备。"

    get_response = client.get(f"/api/projects/{project['id']}/summary")
    assert get_response.status_code == 200
    assert get_response.json()["data"]["summary_text"] == "第二次项目摘要：接口已冻结，开始联调准备。"


def test_generate_project_summary_without_analyzed_meetings_returns_friendly_message(client):
    project = create_project(client, name="Empty Summary Project")
    create_meeting(client, project["id"])

    response = client.post(f"/api/projects/{project['id']}/summary")

    assert response.status_code == 200
    assert response.json() == {
        "data": None,
        "message": "该项目暂无可用的会议分析数据",
    }


def test_get_project_summary_not_found_returns_404(client):
    project = create_project(client)

    response = client.get(f"/api/projects/{project['id']}/summary")

    assert response.status_code == 404
    assert response.json()["detail"] == "Project summary not found."


def test_project_summary_missing_project_returns_404(client):
    response = client.get(f"/api/projects/{uuid4()}/summary")
    missing_generate = client.post(f"/api/projects/{uuid4()}/summary")

    assert response.status_code == 404
    assert response.json()["detail"] == "Project not found."
    assert missing_generate.status_code == 404
    assert missing_generate.json()["detail"] == "Project not found."
