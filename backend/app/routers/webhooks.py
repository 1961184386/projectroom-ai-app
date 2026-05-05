from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlmodel import Session

from app.database import get_session
from app.integrations import IntegrationManager
from app.services.integration_service import get_config_by_platform, handle_webhook, import_transcript
from app.services.project_service import get_project_or_none

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


# ---------- GET: callback URL verification ----------

@router.get("/tencent-meeting")
def verify_tencent_callback_url(
    timestamp: str = Query(...),
    nonce: str = Query(...),
    signature: str = Query(...),
    session: Session = Depends(get_session),
):
    config = get_config_by_platform(session, "tencent_meeting")
    connector = IntegrationManager().get_connector("tencent_meeting", config)
    if connector.validate_callback_url({"timestamp": timestamp, "nonce": nonce, "signature": signature}):
        return timestamp
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Signature verification failed.")


@router.get("/dingtalk")
def verify_dingtalk_callback_url(
    timestamp: str = Query(...),
    sign: str = Query(...),
    session: Session = Depends(get_session),
):
    config = get_config_by_platform(session, "dingtalk")
    connector = IntegrationManager().get_connector("dingtalk", config)
    if connector.validate_callback_url({"timestamp": timestamp, "sign": sign}):
        return timestamp
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Signature verification failed.")


# ---------- POST: event delivery ----------

@router.post("/tencent-meeting")
async def receive_tencent_webhook(request: Request, session: Session = Depends(get_session)):
    return await _handle_platform_webhook("tencent_meeting", request, session)


@router.post("/dingtalk")
async def receive_dingtalk_webhook(request: Request, session: Session = Depends(get_session)):
    return await _handle_platform_webhook("dingtalk", request, session)


async def _handle_platform_webhook(platform: str, request: Request, session: Session):
    try:
        body = await request.body()
        payload = await request.json()
        result = handle_webhook(
            session=session,
            platform=platform,
            headers={key.lower(): value for key, value in request.headers.items()},
            body=body,
            payload=payload,
        )
        imported = None
        project_id = payload.get("project_id")
        if result.get("should_import") and project_id:
            project = get_project_or_none(session, UUID(str(project_id)))
            if project is not None:
                imported = import_transcript(
                    session=session,
                    platform=platform,
                    project=project,
                    external_meeting_id=result.get("external_meeting_id", ""),
                    recording_id=result.get("recording_id"),
                    auto_analyze=True,
                ).model_dump()
        return {"data": {**result, "import_result": imported}, "message": "ok"}
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to handle webhook.") from exc
