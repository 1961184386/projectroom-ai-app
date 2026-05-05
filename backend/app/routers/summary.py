from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.database import get_session
from app.services.project_service import get_project_or_none
from app.services.summary_service import generate_project_summary, get_project_summary

router = APIRouter(prefix="/api/projects", tags=["summary"])


@router.post("/{project_id}/summary")
def generate_project_summary_endpoint(
    project_id: UUID,
    session: Session = Depends(get_session),
):
    try:
        project = get_project_or_none(session, project_id)
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

        summary = generate_project_summary(session, project_id)
        if summary is None:
            return {"data": None, "message": "该项目暂无可用的会议分析数据"}

        return {"data": summary, "message": "ok"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Project summary generation failed.",
        ) from exc


@router.get("/{project_id}/summary")
def get_project_summary_endpoint(
    project_id: UUID,
    session: Session = Depends(get_session),
):
    try:
        project = get_project_or_none(session, project_id)
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

        summary = get_project_summary(session, project_id)
        if summary is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project summary not found.",
            )

        return {"data": summary, "message": "ok"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load project summary.",
        ) from exc
