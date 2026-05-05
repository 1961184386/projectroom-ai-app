from datetime import datetime
from uuid import UUID

from pydantic import BaseModel
from sqlmodel import Session, select

from app.ai import chat
from app.models.analysis import MeetingAnalysis
from app.models.meeting import Meeting
from app.services.project_service import get_project_or_none


class ChatSource(BaseModel):
    meeting_id: UUID
    meeting_title: str
    meeting_time: datetime


class ChatResponse(BaseModel):
    answer: str
    sources: list[ChatSource]


def build_project_context(session: Session, project_id: UUID) -> tuple[str, list[Meeting]]:
    """
    Returns (context_text, meetings_used).
    context_text is the assembled prompt context block.
    meetings_used is the list of Meeting objects included (for source attribution).
    """
    statement = (
        select(Meeting, MeetingAnalysis)
        .outerjoin(MeetingAnalysis, MeetingAnalysis.meeting_id == Meeting.id)
        .where(Meeting.project_id == project_id)
        .order_by(Meeting.meeting_time.desc())
    )
    rows = list(session.exec(statement).all())
    meetings = [meeting for meeting, _ in rows]

    if not rows:
        return "项目下暂无会议记录。", []

    blocks: list[str] = [f"项目下共有 {len(rows)} 次会议记录，以下是各次会议的转写内容和分析摘要："]
    for index, (meeting, analysis) in enumerate(rows, start=1):
        meeting_time = meeting.meeting_time.isoformat()
        analysis_summary = analysis.meeting_summary if analysis else "（尚未分析）"
        blocks.append(
            "\n".join(
                [
                    "---",
                    f"会议 {index}：{meeting.title}（{meeting_time}）",
                    f"会议ID：{meeting.id}",
                    f"参会人：{meeting.participants or '未知'}",
                    "会议转写：",
                    meeting.transcript_text,
                    "",
                    "AI 分析摘要：",
                    analysis_summary,
                ]
            )
        )

    return "\n".join(blocks), meetings


def ask_project_question(session: Session, project_id: UUID, question: str) -> ChatResponse | None:
    project = get_project_or_none(session, project_id)
    if project is None:
        return None

    context, meetings = build_project_context(session, project_id)
    if not meetings:
        return ChatResponse(answer="该项目暂无会议记录，无法回答问题。", sources=[])

    raw_answer = chat.ask(context=context, question=question)
    answer, source_ids = chat.extract_source_ids(raw_answer)

    meeting_map = {meeting.id: meeting for meeting in meetings}
    sources = [
        ChatSource(
            meeting_id=meeting.id,
            meeting_title=meeting.title,
            meeting_time=meeting.meeting_time,
        )
        for source_id in source_ids
        if (meeting := meeting_map.get(source_id)) is not None
    ]
    return ChatResponse(answer=answer, sources=sources)
