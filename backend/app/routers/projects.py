from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.database import get_session
from app.models.project import ProjectCreate, ProjectUpdate
from app.services.project_service import (
    create_project,
    get_project_detail,
    get_project_or_none,
    list_projects,
    update_project,
)

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.post("", status_code=status.HTTP_201_CREATED)
def create_project_endpoint(
    payload: ProjectCreate,
    session: Session = Depends(get_session),
):
    try:
        project = create_project(session, payload)
        return {"data": project, "message": "ok"}
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create project.") from exc


@router.get("")
def list_projects_endpoint(session: Session = Depends(get_session)):
    try:
        projects = list_projects(session)
        return {"data": projects, "message": "ok"}
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to list projects.") from exc


@router.get("/{project_id}")
def get_project_detail_endpoint(
    project_id: UUID,
    session: Session = Depends(get_session),
):
    try:
        project = get_project_detail(session, project_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to load project.") from exc

    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    return {"data": project, "message": "ok"}


@router.patch("/{project_id}")
def update_project_endpoint(
    project_id: UUID,
    payload: ProjectUpdate,
    session: Session = Depends(get_session),
):
    try:
        project = get_project_or_none(session, project_id)
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
        updated_project = update_project(session, project, payload)
        return {"data": updated_project, "message": "ok"}
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update project.") from exc
