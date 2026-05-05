from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlmodel import Session

from app.database import get_session
from app.integrations import SUPPORTED_PLATFORMS
from app.integrations.types import ExternalMeetingCreatePayload, SyncMeetingsPayload
from app.models.integration_config import IntegrationConfigCreate
from app.services.integration_service import (
    create_external_meeting,
    delete_config,
    get_platform_info,
    import_transcript,
    list_configs,
    sync_external_meetings,
    test_connection,
    upsert_config,
)
from app.services.project_service import get_project_or_none

router = APIRouter(prefix="/api/integrations", tags=["integrations"])


class TranscriptImportPayload(BaseModel):
    project_id: UUID
    recording_id: str | None = None
    auto_analyze: bool = True


@router.get("/configs")
def list_integration_configs(session: Session = Depends(get_session)):
    try:
        return {"data": list_configs(session), "message": "ok"}
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to load integration configs.") from exc


@router.post("/configs")
def upsert_integration_config(
    payload: IntegrationConfigCreate,
    session: Session = Depends(get_session),
):
    try:
        if payload.platform not in SUPPORTED_PLATFORMS:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported platform.")
        config = upsert_config(session, payload)
        return {"data": config, "message": "ok"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to save integration config.") from exc


@router.delete("/configs/{config_id}")
def delete_integration_config(config_id: UUID, session: Session = Depends(get_session)):
    try:
        deleted = delete_config(session, config_id)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Integration config not found.")
        return {"data": {"id": str(config_id)}, "message": "ok"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete integration config.") from exc


@router.post("/{platform}/test")
def test_platform_connection(platform: str, session: Session = Depends(get_session)):
    try:
        result = test_connection(session, platform)
        return {"data": result, "message": "ok"}
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to test platform connection.") from exc


@router.get("/{platform}/info")
def get_platform_metadata(platform: str, session: Session = Depends(get_session)):
    try:
        return {"data": get_platform_info(session, platform), "message": "ok"}
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to load platform info.") from exc


@router.post("/{platform}/meetings")
def create_platform_meeting(
    platform: str,
    payload: ExternalMeetingCreatePayload,
    session: Session = Depends(get_session),
):
    try:
        if not payload.project_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="project_id is required.")
        project = get_project_or_none(session, UUID(payload.project_id))
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
        created = create_external_meeting(session, platform, project, payload)
        return {"data": created, "message": "ok"}
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create external meeting.") from exc


@router.post("/{platform}/meetings/sync")
def sync_platform_meetings(
    platform: str,
    payload: SyncMeetingsPayload,
    session: Session = Depends(get_session),
):
    try:
        project = get_project_or_none(session, UUID(payload.project_id))
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
        meetings = sync_external_meetings(session, platform, project, payload.limit)
        return {"data": meetings, "message": "ok"}
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to sync external meetings.") from exc


@router.post("/{platform}/import/{external_meeting_id}")
def import_platform_transcript(
    platform: str,
    external_meeting_id: str,
    payload: TranscriptImportPayload,
    session: Session = Depends(get_session),
):
    try:
        project = get_project_or_none(session, payload.project_id)
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
        result = import_transcript(
            session=session,
            platform=platform,
            project=project,
            external_meeting_id=external_meeting_id,
            recording_id=payload.recording_id,
            auto_analyze=payload.auto_analyze,
        )
        return {"data": result, "message": "ok"}
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to import platform transcript.") from exc
