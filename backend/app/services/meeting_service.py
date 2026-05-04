from datetime import datetime
from uuid import UUID

from sqlmodel import Session, select

from app.models.meeting import Meeting, MeetingCreate, MeetingRead
from app.models.project import Project


def create_meeting(session: Session, project: Project, payload: MeetingCreate) -> MeetingRead:
    now = datetime.utcnow()
    meeting = Meeting(
        **payload.model_dump(),
        project_id=project.id,
        created_at=now,
        updated_at=now,
    )
    session.add(meeting)
    project.updated_at = now
    session.add(project)
    session.commit()
    session.refresh(meeting)
    return MeetingRead.model_validate(meeting)


def list_meetings(session: Session, project_id: UUID) -> list[MeetingRead]:
    statement = (
        select(Meeting)
        .where(Meeting.project_id == project_id)
        .order_by(Meeting.meeting_time.desc())
    )
    meetings = session.exec(statement).all()
    return [MeetingRead.model_validate(meeting) for meeting in meetings]


def get_meeting_detail(session: Session, project_id: UUID, meeting_id: UUID) -> MeetingRead | None:
    statement = select(Meeting).where(
        Meeting.id == meeting_id,
        Meeting.project_id == project_id,
    )
    meeting = session.exec(statement).one_or_none()
    if meeting is None:
        return None
    return MeetingRead.model_validate(meeting)
