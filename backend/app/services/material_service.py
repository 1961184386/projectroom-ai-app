from datetime import datetime
from uuid import UUID

from sqlmodel import Session, select

from app.models.project import Project
from app.models.project_material import (
    ProjectMaterial,
    ProjectMaterialCreate,
    ProjectMaterialRead,
)


def list_materials(session: Session, project_id: UUID) -> list[ProjectMaterialRead]:
    statement = (
        select(ProjectMaterial)
        .where(ProjectMaterial.project_id == project_id)
        .order_by(ProjectMaterial.updated_at.desc())
    )
    materials = session.exec(statement).all()
    return [ProjectMaterialRead.model_validate(material) for material in materials]


def create_material(
    session: Session,
    project: Project,
    payload: ProjectMaterialCreate,
) -> ProjectMaterialRead:
    now = datetime.utcnow()
    material = ProjectMaterial(
        **payload.model_dump(),
        project_id=project.id,
        created_at=now,
        updated_at=now,
    )
    session.add(material)
    project.updated_at = now
    session.add(project)
    session.commit()
    session.refresh(material)
    return ProjectMaterialRead.model_validate(material)


def delete_material(session: Session, material: ProjectMaterial) -> None:
    session.delete(material)
    session.commit()


def get_material(session: Session, project_id: UUID, material_id: UUID) -> ProjectMaterial | None:
    statement = select(ProjectMaterial).where(
        ProjectMaterial.id == material_id,
        ProjectMaterial.project_id == project_id,
    )
    return session.exec(statement).one_or_none()
