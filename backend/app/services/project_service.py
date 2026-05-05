from datetime import datetime
from uuid import UUID

from sqlmodel import Session, func, select

from app.models.analysis import MeetingAnalysis
from app.models.meeting import Meeting
from app.models.project import Project, ProjectCreate, ProjectRead, ProjectUpdate


def _to_project_read(
    project: Project,
    meeting_count: int,
    last_meeting_time=None,
    pending_action_count: int = 0,
) -> ProjectRead:
    return ProjectRead.model_validate(
        {
            **project.model_dump(),
            "meeting_count": meeting_count,
            "last_meeting_time": last_meeting_time,
            "pending_action_count": pending_action_count,
        }
    )


def create_project(session: Session, payload: ProjectCreate) -> ProjectRead:
    now = datetime.utcnow()
    project = Project(**payload.model_dump(), created_at=now, updated_at=now)
    session.add(project)
    session.commit()
    session.refresh(project)
    return _to_project_read(project, 0)


def _get_pending_action_count(session: Session, project_id: UUID) -> int:
    statement = (
        select(MeetingAnalysis.action_items)
        .join(Meeting, MeetingAnalysis.meeting_id == Meeting.id)
        .where(Meeting.project_id == project_id)
    )
    rows = session.exec(statement).all()
    count = 0
    for items in rows:
        for item in items or []:
            if item.get("status", "pending") == "pending":
                count += 1
    return count


def list_projects(session: Session, stage: str | None = None) -> list[ProjectRead]:
    statement = (
        select(Project, func.count(Meeting.id), func.max(Meeting.meeting_time))
        .outerjoin(Meeting, Meeting.project_id == Project.id)
        .group_by(Project.id)
        .order_by(Project.updated_at.desc())
    )
    if stage:
        statement = statement.where(Project.current_stage == stage)

    rows = session.exec(statement).all()
    return [
        _to_project_read(
            project,
            meeting_count,
            last_meeting_time=last_meeting_time,
            pending_action_count=_get_pending_action_count(session, project.id),
        )
        for project, meeting_count, last_meeting_time in rows
    ]


def get_project_or_none(session: Session, project_id: UUID) -> Project | None:
    return session.get(Project, project_id)


def get_project_detail(session: Session, project_id: UUID) -> ProjectRead | None:
    statement = (
        select(Project, func.count(Meeting.id), func.max(Meeting.meeting_time))
        .outerjoin(Meeting, Meeting.project_id == Project.id)
        .where(Project.id == project_id)
        .group_by(Project.id)
    )
    row = session.exec(statement).one_or_none()
    if row is None:
        return None
    project, meeting_count, last_meeting_time = row
    return _to_project_read(
        project,
        meeting_count,
        last_meeting_time=last_meeting_time,
        pending_action_count=_get_pending_action_count(session, project.id),
    )


def update_project(session: Session, project: Project, payload: ProjectUpdate) -> ProjectRead:
    updates = payload.model_dump(exclude_unset=True)
    for field_name, value in updates.items():
        setattr(project, field_name, value)
    project.updated_at = datetime.utcnow()
    session.add(project)
    session.commit()
    session.refresh(project)

    meeting_count = session.exec(select(func.count(Meeting.id)).where(Meeting.project_id == project.id)).one()
    last_meeting_time = session.exec(
        select(func.max(Meeting.meeting_time)).where(Meeting.project_id == project.id)
    ).one()
    return _to_project_read(
        project,
        meeting_count,
        last_meeting_time=last_meeting_time,
        pending_action_count=_get_pending_action_count(session, project.id),
    )
