from datetime import datetime
from uuid import UUID

from sqlmodel import Session, func, select

from app.models.meeting import Meeting
from app.models.project import Project, ProjectCreate, ProjectRead, ProjectUpdate


def _to_project_read(project: Project, meeting_count: int) -> ProjectRead:
    return ProjectRead.model_validate(
        {
            **project.model_dump(),
            "meeting_count": meeting_count,
        }
    )


def create_project(session: Session, payload: ProjectCreate) -> ProjectRead:
    now = datetime.utcnow()
    project = Project(**payload.model_dump(), created_at=now, updated_at=now)
    session.add(project)
    session.commit()
    session.refresh(project)
    return _to_project_read(project, 0)


def list_projects(session: Session) -> list[ProjectRead]:
    statement = (
        select(Project, func.count(Meeting.id))
        .outerjoin(Meeting, Meeting.project_id == Project.id)
        .group_by(Project.id)
        .order_by(Project.updated_at.desc())
    )
    rows = session.exec(statement).all()
    return [_to_project_read(project, meeting_count) for project, meeting_count in rows]


def get_project_or_none(session: Session, project_id: UUID) -> Project | None:
    return session.get(Project, project_id)


def get_project_detail(session: Session, project_id: UUID) -> ProjectRead | None:
    statement = (
        select(Project, func.count(Meeting.id))
        .outerjoin(Meeting, Meeting.project_id == Project.id)
        .where(Project.id == project_id)
        .group_by(Project.id)
    )
    row = session.exec(statement).one_or_none()
    if row is None:
        return None
    project, meeting_count = row
    return _to_project_read(project, meeting_count)


def update_project(session: Session, project: Project, payload: ProjectUpdate) -> ProjectRead:
    updates = payload.model_dump(exclude_unset=True)
    for field_name, value in updates.items():
        setattr(project, field_name, value)
    project.updated_at = datetime.utcnow()
    session.add(project)
    session.commit()
    session.refresh(project)

    meeting_count = session.exec(
        select(func.count(Meeting.id)).where(Meeting.project_id == project.id)
    ).one()
    return _to_project_read(project, meeting_count)
