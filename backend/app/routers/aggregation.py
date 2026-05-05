from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.database import get_session
from app.services.aggregation_service import (
    list_project_changes,
    list_project_decisions,
    list_project_risks,
    list_project_todos,
)
from app.services.project_service import get_project_or_none

router = APIRouter(prefix="/api/projects", tags=["aggregation"])


@router.get("/{project_id}/todos")
def list_project_todos_endpoint(
    project_id: UUID,
    session: Session = Depends(get_session),
):
    try:
        project = get_project_or_none(session, project_id)
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
        return {"data": list_project_todos(session, project_id), "message": "ok"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load project todos.",
        ) from exc


@router.get("/{project_id}/risks")
def list_project_risks_endpoint(
    project_id: UUID,
    session: Session = Depends(get_session),
):
    try:
        project = get_project_or_none(session, project_id)
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
        return {"data": list_project_risks(session, project_id), "message": "ok"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load project risks.",
        ) from exc


@router.get("/{project_id}/changes")
def list_project_changes_endpoint(
    project_id: UUID,
    session: Session = Depends(get_session),
):
    try:
        project = get_project_or_none(session, project_id)
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
        return {"data": list_project_changes(session, project_id), "message": "ok"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load project changes.",
        ) from exc


@router.get("/{project_id}/decisions")
def list_project_decisions_endpoint(
    project_id: UUID,
    session: Session = Depends(get_session),
):
    try:
        project = get_project_or_none(session, project_id)
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
        return {"data": list_project_decisions(session, project_id), "message": "ok"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load project decisions.",
        ) from exc
