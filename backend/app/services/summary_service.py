from datetime import datetime
from uuid import UUID

from sqlmodel import Session, select

from app.ai import summarizer
from app.models.analysis import MeetingAnalysis
from app.models.meeting import Meeting
from app.models.project_summary import ProjectSummary, ProjectSummaryRead
from app.services.project_service import get_project_or_none


def get_project_summary(session: Session, project_id: UUID) -> ProjectSummaryRead | None:
    statement = select(ProjectSummary).where(ProjectSummary.project_id == project_id)
    summary = session.exec(statement).one_or_none()
    if summary is None:
        return None
    return ProjectSummaryRead.model_validate(summary)


def build_summary_context(session: Session, project_id: UUID) -> tuple[str, int]:
    statement = (
        select(Meeting, MeetingAnalysis)
        .join(MeetingAnalysis, MeetingAnalysis.meeting_id == Meeting.id)
        .where(Meeting.project_id == project_id)
        .where(Meeting.analysis_status == "done")
        .order_by(Meeting.meeting_time.desc())
    )
    rows = list(session.exec(statement).all())
    if not rows:
        return "", 0

    blocks: list[str] = [f"项目下共有 {len(rows)} 次已完成分析的会议，以下是关键上下文："]
    for index, (meeting, analysis) in enumerate(rows, start=1):
        blocks.append(
            "\n".join(
                [
                    "---",
                    f"会议 {index}：{meeting.title}（{meeting.meeting_time.isoformat()}）",
                    f"参会人：{meeting.participants or '未知'}",
                    f"会议摘要：{analysis.meeting_summary}",
                    f"关键决策：{analysis.key_decisions}",
                    f"行动项：{analysis.action_items}",
                    f"需求变更：{analysis.requirement_changes}",
                    f"风险：{analysis.risks}",
                    f"开放问题：{analysis.open_questions}",
                    f"下次会议议题：{analysis.next_meeting_topics}",
                ]
            )
        )

    return "\n".join(blocks), len(rows)


def generate_project_summary(session: Session, project_id: UUID) -> ProjectSummaryRead | None:
    project = get_project_or_none(session, project_id)
    if project is None:
        return None

    context, meeting_count = build_summary_context(session, project_id)
    if meeting_count == 0:
        return None

    summary_text = summarizer.summarize(project.name, context)
    return upsert_project_summary(session, project_id, summary_text)


def upsert_project_summary(
    session: Session,
    project_id: UUID,
    summary_text: str,
) -> ProjectSummaryRead:
    statement = select(ProjectSummary).where(ProjectSummary.project_id == project_id)
    summary = session.exec(statement).one_or_none()
    now = datetime.utcnow()

    if summary is None:
        summary = ProjectSummary(
            project_id=project_id,
            summary_text=summary_text,
            generated_at=now,
        )
    else:
        summary.summary_text = summary_text
        summary.generated_at = now

    session.add(summary)
    session.commit()
    session.refresh(summary)
    return ProjectSummaryRead.model_validate(summary)
