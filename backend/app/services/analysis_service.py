from datetime import datetime
from uuid import UUID

from sqlmodel import Session, select

from app.ai import analyzer
from app.ai.schemas import AnalysisResult
from app.models.analysis import MeetingAnalysis, MeetingAnalysisRead
from app.models.meeting import Meeting


def get_meeting_by_id(session: Session, meeting_id: UUID) -> Meeting | None:
    return session.get(Meeting, meeting_id)


def get_analysis_by_meeting_id(session: Session, meeting_id: UUID) -> MeetingAnalysisRead | None:
    statement = select(MeetingAnalysis).where(MeetingAnalysis.meeting_id == meeting_id)
    analysis = session.exec(statement).one_or_none()
    if analysis is None:
        return None
    return MeetingAnalysisRead.model_validate(analysis)


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
    return MeetingAnalysisRead.model_validate(analysis)
