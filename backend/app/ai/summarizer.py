from openai import OpenAI

from app.config import get_settings


def summarize(project_name: str, context: str) -> str:
    """Calls OpenAI and returns a structured progress summary as plain text."""
    settings = get_settings()
    client = OpenAI(
        api_key=settings.openai_api_key,
        base_url=settings.openai_base_url,
    )

    system_prompt = """你是一个专业的项目管理助手，擅长生成项目进度报告。
请根据以下会议记录和分析结果，生成一份简洁的项目进度摘要（300-500字）。
摘要应包含：
1. 项目当前阶段和整体进展
2. 已确定的关键决策（最多3条）
3. 当前主要风险（最多3条）
4. 待解决的需求变更（如有）
5. 下一步行动建议

用中文输出，保持客观、专业的风格，避免重复罗列原始内容。"""

    user_prompt = f"""项目名称：{project_name}

{context}

请生成项目进度摘要："""

    response = client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,
    )
    return (response.choices[0].message.content or "").strip()
