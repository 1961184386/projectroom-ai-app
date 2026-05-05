from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session

from app.database import get_session
from app.services.analysis_service import (
    get_analysis_by_meeting_id,
    get_meeting_by_id,
    run_meeting_analysis,
    update_analysis_confirmation,
)

router = APIRouter(prefix="/api/meetings", tags=["analysis"])


class AnalysisConfirmPayload(BaseModel):
    item_type: str
    item_index: int
    confirmed: bool


@router.post("/{meeting_id}/analyze")
def analyze_meeting_endpoint(
    meeting_id: UUID,
    session: Session = Depends(get_session),
):
    try:
        meeting = get_meeting_by_id(session, meeting_id)
        if meeting is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found.")
        analysis = run_meeting_analysis(session, meeting)
        return {"data": analysis, "message": "ok"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI analysis failed.",
        ) from exc


@router.get("/{meeting_id}/analysis")
def get_meeting_analysis_endpoint(
    meeting_id: UUID,
    session: Session = Depends(get_session),
):
    try:
        analysis = get_analysis_by_meeting_id(session, meeting_id)
        if analysis is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Meeting analysis not found.",
            )
        return {"data": analysis, "message": "ok"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load meeting analysis.",
        ) from exc


@router.patch("/{meeting_id}/analysis/confirm")
def confirm_meeting_analysis_item_endpoint(
    meeting_id: UUID,
    payload: AnalysisConfirmPayload,
    session: Session = Depends(get_session),
):
    try:
        meeting = get_meeting_by_id(session, meeting_id)
        if meeting is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found.")
        analysis = update_analysis_confirmation(
            session,
            meeting,
            payload.item_type,
            payload.item_index,
            payload.confirmed,
        )
        return {"data": analysis, "message": "ok"}
    except HTTPException:
        raise
    except ValueError as exc:
        detail = str(exc)
        status_code = status.HTTP_404_NOT_FOUND if detail == "Meeting analysis not found." else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=detail) from exc
    except IndexError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update analysis confirmation.",
        ) from exc
