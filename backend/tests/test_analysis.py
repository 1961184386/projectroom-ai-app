from unittest.mock import patch
from uuid import uuid4

from app.ai.schemas import AnalysisResult


ANALYSIS_RESULT = {
    "meeting_summary": "会议围绕项目排期、需求确认和风险暴露展开，明确了下一阶段责任人和关键交付节点。",
    "key_decisions": [
        {
            "decision": "本周五前确认接口方案",
            "owner": "Alice",
            "impact": "影响前后端联调节奏",
            "evidence": "Alice 说本周五前需要把接口方案定下来。",
        }
    ],
    "action_items": [
        {
            "task": "整理接口文档",
            "owner": "Bob",
            "deadline": "2026-05-09",
            "priority": "high",
            "status": "pending",
            "evidence": "Bob 负责补充接口文档。",
        }
    ],
    "requirement_changes": [
        {
            "change": "新增审批流抄送节点",
            "type": "new",
            "impact_on_scope": "需要追加一个配置项",
            "need_confirmation": True,
            "evidence": "客户提出增加抄送节点。",
        }
    ],
    "risks": [
        {
            "risk": "第三方接口文档未最终确认",
            "level": "medium",
            "suggestion": "与对方尽快锁定字段",
            "evidence": "接口定义还在变。",
        }
    ],
    "open_questions": [
        {
            "question": "审批节点是否支持多人并签",
            "owner": "Client",
            "reason": "影响流程设计",
        }
    ],
    "next_meeting_topics": ["接口评审", "审批流细节确认"],
}


def create_meeting(client):
    project = client.post("/api/projects", json={"name": "AI Project"}).json()["data"]
    meeting = client.post(
        f"/api/projects/{project['id']}/meetings",
        json={
            "title": "AI Analysis Meeting",
            "platform": "manual",
            "meeting_time": "2026-05-05T10:00:00",
            "participants": "Alice,Bob",
            "agenda": "Review project risks",
            "transcript_text": "Alice 说本周五前需要把接口方案定下来。Bob 负责补充接口文档。",
        },
    ).json()["data"]
    return meeting


@patch("app.services.analysis_service.analyzer.analyze")
def test_analyze_meeting_creates_analysis(mock_analyze, client):
    mock_analyze.return_value = AnalysisResult.model_validate(ANALYSIS_RESULT)
    meeting = create_meeting(client)

    response = client.post(f"/api/meetings/{meeting['id']}/analyze")

    assert response.status_code == 200
    payload = response.json()["data"]
    assert payload["meeting_id"] == meeting["id"]
    assert payload["meeting_summary"] == ANALYSIS_RESULT["meeting_summary"]

    meeting_detail = client.get(
        f"/api/projects/{meeting['project_id']}/meetings/{meeting['id']}"
    ).json()["data"]
    assert meeting_detail["analysis_status"] == "done"


@patch("app.services.analysis_service.analyzer.analyze")
def test_analyze_meeting_is_idempotent_and_overwrites(mock_analyze, client):
    first_result = AnalysisResult.model_validate(ANALYSIS_RESULT)
    second_payload = {
        **ANALYSIS_RESULT,
        "meeting_summary": "更新后的分析摘要",
        "action_items": [],
    }
    second_result = AnalysisResult.model_validate(second_payload)
    mock_analyze.side_effect = [first_result, second_result]
    meeting = create_meeting(client)

    first_response = client.post(f"/api/meetings/{meeting['id']}/analyze")
    second_response = client.post(f"/api/meetings/{meeting['id']}/analyze")

    assert first_response.status_code == 200
    assert second_response.status_code == 200
    assert second_response.json()["data"]["meeting_summary"] == "更新后的分析摘要"
    assert second_response.json()["data"]["action_items"] == []

    get_response = client.get(f"/api/meetings/{meeting['id']}/analysis")
    assert get_response.status_code == 200
    assert get_response.json()["data"]["meeting_summary"] == "更新后的分析摘要"


@patch("app.services.analysis_service.analyzer.analyze")
def test_analyze_meeting_failure_marks_status_failed(mock_analyze, client):
    mock_analyze.side_effect = RuntimeError("OpenAI error")
    meeting = create_meeting(client)

    response = client.post(f"/api/meetings/{meeting['id']}/analyze")

    assert response.status_code == 500
    assert response.json()["detail"] == "AI analysis failed."

    meeting_detail = client.get(
        f"/api/projects/{meeting['project_id']}/meetings/{meeting['id']}"
    ).json()["data"]
    assert meeting_detail["analysis_status"] == "failed"


def test_get_analysis_not_found_and_missing_meeting_404(client):
    meeting = create_meeting(client)

    missing_analysis = client.get(f"/api/meetings/{meeting['id']}/analysis")
    missing_meeting = client.post(f"/api/meetings/{uuid4()}/analyze")

    assert missing_analysis.status_code == 404
    assert missing_meeting.status_code == 404
