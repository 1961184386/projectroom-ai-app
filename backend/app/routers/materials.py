from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.database import get_session
from app.models.project_material import ProjectMaterialCreate
from app.services.material_service import create_material, delete_material, get_material, list_materials
from app.services.project_service import get_project_or_none

router = APIRouter(prefix="/api/projects/{project_id}/materials", tags=["materials"])


@router.get("")
def list_materials_endpoint(
    project_id: UUID,
    session: Session = Depends(get_session),
):
    try:
        project = get_project_or_none(session, project_id)
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
        return {"data": list_materials(session, project_id), "message": "ok"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load project materials.",
        ) from exc


@router.post("", status_code=status.HTTP_201_CREATED)
def create_material_endpoint(
    project_id: UUID,
    payload: ProjectMaterialCreate,
    session: Session = Depends(get_session),
):
    try:
        project = get_project_or_none(session, project_id)
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
        material = create_material(session, project, payload)
        return {"data": material, "message": "ok"}
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create project material.",
        ) from exc


@router.delete("/{material_id}")
def delete_material_endpoint(
    project_id: UUID,
    material_id: UUID,
    session: Session = Depends(get_session),
):
    try:
        project = get_project_or_none(session, project_id)
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
        material = get_material(session, project_id, material_id)
        if material is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project material not found.")
        delete_material(session, material)
        return {"data": {"id": str(material_id)}, "message": "ok"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete project material.",
        ) from exc
