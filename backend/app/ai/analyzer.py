import json

from openai import OpenAI

from app.ai.schemas import AnalysisResult
from app.config import get_settings


def analyze(transcript_text: str, meeting_title: str, participants: str = "") -> AnalysisResult:
    settings = get_settings()
    client = OpenAI(
        api_key=settings.openai_api_key,
        base_url=settings.openai_base_url,
    )

    system_prompt = """你是一个专业的项目管理助手。
请分析以下会议转写内容，提取结构化信息，用 JSON 格式输出。
输出必须是合法的 JSON，不要包含任何额外文字。"""

    user_prompt = f"""会议主题：{meeting_title}
参会人：{participants or "未知"}

会议转写内容：
{transcript_text}

请按照以下 JSON schema 输出分析结果：
{{
  "meeting_summary": "会议摘要，100-200字，说明本次会议讨论了什么、形成了哪些主要结论",
  "key_decisions": [
    {{"decision": "决策内容", "owner": "负责人或空字符串", "impact": "影响描述", "evidence": "原文引用"}}
  ],
  "action_items": [
    {{"task": "任务名称", "owner": "负责人或空字符串", "deadline": "截止时间或空字符串", "priority": "high|medium|low", "status": "pending", "evidence": "原文引用"}}
  ],
  "requirement_changes": [
    {{"change": "变更内容", "type": "new|modified|removed|unclear", "impact_on_scope": "对范围的影响", "need_confirmation": true, "evidence": "原文引用"}}
  ],
  "risks": [
    {{"risk": "风险描述", "level": "high|medium|low", "suggestion": "建议措施", "evidence": "原文引用"}}
  ],
  "open_questions": [
    {{"question": "问题内容", "owner": "负责人或空字符串", "reason": "为什么需要确认"}}
  ],
  "next_meeting_topics": ["议题1", "议题2"]
}}"""

    response = client.chat.completions.create(
        model=settings.openai_model,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,
    )

    raw_content = response.choices[0].message.content
    data = json.loads(raw_content or "{}")
    return AnalysisResult.model_validate(data)
