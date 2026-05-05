from datetime import datetime
from uuid import UUID

from sqlmodel import Session, select

from app.ai import analyzer
from app.ai.schemas import ActionItem, AnalysisResult, KeyDecision, RequirementChange, Risk
from app.models.analysis import MeetingAnalysis, MeetingAnalysisRead
from app.models.meeting import Meeting


def get_meeting_by_id(session: Session, meeting_id: UUID) -> Meeting | None:
    return session.get(Meeting, meeting_id)


def get_analysis_by_meeting_id(session: Session, meeting_id: UUID) -> MeetingAnalysisRead | None:
    statement = select(MeetingAnalysis).where(MeetingAnalysis.meeting_id == meeting_id)
    analysis = session.exec(statement).one_or_none()
    if analysis is None:
        return None
    return MeetingAnalysisRead.model_validate(_normalize_analysis(analysis))


def _normalize_confirmed_items(items: list[dict], schema):
    return [schema.model_validate(item).model_dump() for item in items]


def _normalize_analysis(analysis: MeetingAnalysis) -> MeetingAnalysis:
    analysis.action_items = _normalize_confirmed_items(analysis.action_items, ActionItem)
    analysis.risks = _normalize_confirmed_items(analysis.risks, Risk)
    analysis.requirement_changes = _normalize_confirmed_items(analysis.requirement_changes, RequirementChange)
    analysis.key_decisions = _normalize_confirmed_items(analysis.key_decisions, KeyDecision)
    return analysis


def update_analysis_confirmation(
    session: Session,
    meeting: Meeting,
    item_type: str,
    item_index: int,
    confirmed: bool,
) -> MeetingAnalysisRead:
    statement = select(MeetingAnalysis).where(MeetingAnalysis.meeting_id == meeting.id)
    analysis = session.exec(statement).one_or_none()
    if analysis is None:
        raise ValueError("Meeting analysis not found.")

    field_map = {
        "action_item": "action_items",
        "risk": "risks",
        "requirement_change": "requirement_changes",
        "key_decision": "key_decisions",
    }
    field_name = field_map.get(item_type)
    if field_name is None:
        raise ValueError("Invalid item type.")

    items = list(getattr(analysis, field_name) or [])
    if item_index < 0 or item_index >= len(items):
        raise IndexError("Invalid item index.")

    items[item_index] = {
        **items[item_index],
        "confirmed": confirmed,
    }
    setattr(analysis, field_name, items)
    analysis.updated_at = datetime.utcnow()
    session.add(analysis)
    session.commit()
    session.refresh(analysis)

    meeting.updated_at = analysis.updated_at
    session.add(meeting)
    session.commit()
    session.refresh(meeting)
    return MeetingAnalysisRead.model_validate(_normalize_analysis(analysis))


def run_meeting_analysis(session: Session, meeting: Meeting) -> MeetingAnalysisRead:
    meeting.analysis_status = "processing"
    meeting.updated_at = datetime.utcnow()
    session.add(meeting)
    session.commit()
    session.refresh(meeting)

    try:
        result = analyzer.analyze(
            transcript_text=meeting.transcript_text,
            meeting_title=meeting.title,
            participants=meeting.participants or "",
        )
        analysis = upsert_analysis(session, meeting.id, result)
        meeting.analysis_status = "done"
        meeting.updated_at = datetime.utcnow()
        session.add(meeting)
        session.commit()
        session.refresh(meeting)
        return analysis
    except Exception:
        meeting.analysis_status = "failed"
        meeting.updated_at = datetime.utcnow()
        session.add(meeting)
        session.commit()
        raise


def upsert_analysis(
    session: Session,
    meeting_id: UUID,
    result: AnalysisResult,
) -> MeetingAnalysisRead:
    statement = select(MeetingAnalysis).where(MeetingAnalysis.meeting_id == meeting_id)
    analysis = session.exec(statement).one_or_none()
    now = datetime.utcnow()
    payload = result.model_dump()

    if analysis is None:
        analysis = MeetingAnalysis(
            meeting_id=meeting_id,
            created_at=now,
            updated_at=now,
            **payload,
        )
    else:
        for field_name, value in payload.items():
            setattr(analysis, field_name, value)
        analysis.updated_at = now

    session.add(analysis)
    session.commit()
    session.refresh(analysis)
    return MeetingAnalysisRead.model_validate(_normalize_analysis(analysis))
