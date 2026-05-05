import re
from uuid import UUID

from openai import OpenAI

from app.config import get_settings

SOURCE_TAG_PATTERN = re.compile(r"\[SOURCE:([0-9a-fA-F-]{36})\]")


def ask(context: str, question: str) -> str:
    """Calls OpenAI with project context and user question. Returns answer string."""
    settings = get_settings()
    client = OpenAI(
        api_key=settings.openai_api_key,
        base_url=settings.openai_base_url,
    )

    system_prompt = """你是一个专业的项目管理助手，帮助项目团队回顾会议内容、追踪任务进展。
你只根据以下提供的会议记录回答问题，不要编造没有出现在记录中的内容。
如果记录中找不到答案，请直接说"根据现有会议记录，无法回答这个问题"。
如果回答引用了某次会议的信息，请在回答末尾追加来源标签，格式为[SOURCE:meeting_id]，可以追加多个标签。"""

    user_prompt = f"""{context}

用户问题：{question}"""

    response = client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,
    )
    return response.choices[0].message.content or ""


def extract_source_ids(answer: str) -> tuple[str, list[UUID]]:
    source_ids: list[UUID] = []
    for raw_id in SOURCE_TAG_PATTERN.findall(answer):
        source_id = UUID(raw_id)
        if source_id not in source_ids:
            source_ids.append(source_id)

    clean_answer = SOURCE_TAG_PATTERN.sub("", answer).strip()
    return clean_answer, source_ids
