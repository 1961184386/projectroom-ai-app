from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.database import get_session
from app.models.meeting import MeetingCreate
from app.services.meeting_service import create_meeting, get_meeting_detail, list_meetings
from app.services.project_service import get_project_or_none

router = APIRouter(prefix="/api/projects/{project_id}/meetings", tags=["meetings"])


@router.post("", status_code=status.HTTP_201_CREATED)
def create_meeting_endpoint(
    project_id: UUID,
    payload: MeetingCreate,
    session: Session = Depends(get_session),
):
    try:
        project = get_project_or_none(session, project_id)
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
        meeting = create_meeting(session, project, payload)
        return {"data": meeting, "message": "ok"}
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create meeting.") from exc


@router.get("")
def list_meetings_endpoint(
    project_id: UUID,
    session: Session = Depends(get_session),
):
    try:
        project = get_project_or_none(session, project_id)
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
        meetings = list_meetings(session, project_id)
        return {"data": meetings, "message": "ok"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to list meetings.") from exc


@router.get("/{meeting_id}")
def get_meeting_detail_endpoint(
    project_id: UUID,
    meeting_id: UUID,
    session: Session = Depends(get_session),
):
    try:
        project = get_project_or_none(session, project_id)
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
        meeting = get_meeting_detail(session, project_id, meeting_id)
        if meeting is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found.")
        return {"data": meeting, "message": "ok"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to load meeting.") from exc
