from __future__ import annotations

from datetime import datetime

from sqlmodel import Session, select

from app.integrations import IntegrationManager, SUPPORTED_PLATFORMS
from app.integrations.types import ExternalMeetingCreatePayload, TranscriptImportResult
from app.models.integration_config import IntegrationConfig, IntegrationConfigCreate, IntegrationConfigRead
from app.models.meeting import Meeting, MeetingRead
from app.models.project import Project
from app.services.analysis_service import run_meeting_analysis

MASKED_KEYS = {"app_secret", "secret_key", "secret_id", "access_token", "webhook_token"}


def list_configs(session: Session) -> list[IntegrationConfigRead]:
    statement = select(IntegrationConfig).order_by(IntegrationConfig.platform.asc())
    configs = session.exec(statement).all()
    return [_to_read(config) for config in configs]


def get_config_by_platform(session: Session, platform: str) -> IntegrationConfig | None:
    statement = select(IntegrationConfig).where(IntegrationConfig.platform == platform)
    return session.exec(statement).one_or_none()


def upsert_config(session: Session, payload: IntegrationConfigCreate) -> IntegrationConfigRead:
    statement = select(IntegrationConfig).where(IntegrationConfig.platform == payload.platform)
    config = session.exec(statement).one_or_none()
    now = datetime.utcnow()

    if config is None:
        config = IntegrationConfig(**payload.model_dump(), created_at=now, updated_at=now)
    else:
        config.api_mode = payload.api_mode
        merged_config = dict(config.config_json or {})
        merged_config.update(payload.config_json or {})
        config.config_json = merged_config
        config.is_enabled = payload.is_enabled
        config.updated_at = now

    session.add(config)
    session.commit()
    session.refresh(config)
    return _to_read(config)


def delete_config(session: Session, config_id) -> bool:
    config = session.get(IntegrationConfig, config_id)
    if config is None:
        return False
    session.delete(config)
    session.commit()
    return True


def test_connection(session: Session, platform: str) -> dict:
    _validate_platform(platform)
    config = get_config_by_platform(session, platform)
    connector = IntegrationManager().get_connector(platform, config)
    return connector.test_connection().model_dump()


def get_platform_info(session: Session, platform: str) -> dict:
    _validate_platform(platform)
    config = get_config_by_platform(session, platform)
    return IntegrationManager().get_platform_info(platform, config)


def create_external_meeting(
    session: Session,
    platform: str,
    project: Project,
    payload: ExternalMeetingCreatePayload,
) -> dict:
    _validate_platform(platform)
    config = get_config_by_platform(session, platform)
    connector = IntegrationManager().get_connector(platform, config)
    external_meeting = connector.create_meeting(payload)

    local_meeting = _upsert_local_meeting(
        session=session,
        project=project,
        external_platform=platform,
        external_meeting=external_meeting,
        transcript_text="待导入平台转写文本。",
    )
    return {
        "external_meeting": external_meeting.model_dump(),
        "meeting": local_meeting.model_dump(),
    }


def sync_external_meetings(session: Session, platform: str, project: Project, limit: int) -> list[MeetingRead]:
    _validate_platform(platform)
    config = get_config_by_platform(session, platform)
    connector = IntegrationManager().get_connector(platform, config)
    synced: list[MeetingRead] = []
    for external_meeting in connector.list_meetings(limit=limit):
        synced.append(
            _upsert_local_meeting(
                session=session,
                project=project,
                external_platform=platform,
                external_meeting=external_meeting,
                transcript_text="待导入平台转写文本。",
            )
        )
    return synced


def import_transcript(
    session: Session,
    platform: str,
    project: Project,
    external_meeting_id: str,
    recording_id: str | None = None,
    auto_analyze: bool = True,
) -> TranscriptImportResult:
    _validate_platform(platform)
    config = get_config_by_platform(session, platform)
    connector = IntegrationManager().get_connector(platform, config)
    external_meeting = connector.get_meeting(external_meeting_id)
    recordings = connector.list_recordings(external_meeting_id)
    target_recording_id = recording_id or (recordings[0].id if recordings else "")
    transcript_text = connector.get_transcript(target_recording_id) if target_recording_id else ""
    if not transcript_text.strip():
        transcript_text = "平台未返回转写文本。"

    local_meeting = _upsert_local_meeting(
        session=session,
        project=project,
        external_platform=platform,
        external_meeting=external_meeting,
        transcript_text=transcript_text,
    )

    analysis_status = local_meeting.analysis_status
    if auto_analyze:
        db_meeting = session.get(Meeting, local_meeting.id)
        if db_meeting is not None:
            try:
                run_meeting_analysis(session, db_meeting)
                session.refresh(db_meeting)
                analysis_status = db_meeting.analysis_status
            except Exception:
                db_meeting.analysis_status = "pending"
                db_meeting.updated_at = datetime.utcnow()
                session.add(db_meeting)
                session.commit()
                analysis_status = "pending"

    return TranscriptImportResult(
        meeting_id=str(local_meeting.id),
        external_meeting_id=external_meeting_id,
        imported=True,
        transcript_preview=transcript_text[:200],
        analysis_status=analysis_status,
        platform=platform,
    )


def handle_webhook(
    session: Session,
    platform: str,
    headers: dict[str, str],
    body: bytes,
    payload: dict,
) -> dict:
    _validate_platform(platform)
    config = get_config_by_platform(session, platform)
    manager = IntegrationManager()
    connector = manager.get_connector(platform, config)
    if connector.mode == "real" and not connector.validate_webhook(headers, body):
        raise ValueError("Invalid webhook signature.")
    return {**connector.handle_webhook(payload), "accepted": True}


def _upsert_local_meeting(
    session: Session,
    project: Project,
    external_platform: str,
    external_meeting,
    transcript_text: str,
) -> MeetingRead:
    statement = select(Meeting).where(
        Meeting.project_id == project.id,
        Meeting.external_meeting_id == external_meeting.external_id,
        Meeting.external_platform == external_platform,
    )
    meeting = session.exec(statement).one_or_none()
    now = datetime.utcnow()

    if meeting is None:
        meeting = Meeting(
            title=external_meeting.title,
            platform=external_platform,
            meeting_time=external_meeting.start_time,
            participants=", ".join(external_meeting.participants) if external_meeting.participants else None,
            agenda=external_meeting.agenda,
            transcript_text=transcript_text,
            analysis_status="pending",
            external_meeting_id=external_meeting.external_id,
            external_platform=external_platform,
            project_id=project.id,
            created_at=now,
            updated_at=now,
        )
    else:
        meeting.title = external_meeting.title
        meeting.platform = external_platform
        meeting.meeting_time = external_meeting.start_time
        meeting.participants = ", ".join(external_meeting.participants) if external_meeting.participants else meeting.participants
        meeting.agenda = external_meeting.agenda or meeting.agenda
        if transcript_text and transcript_text != "待导入平台转写文本。":
            meeting.transcript_text = transcript_text
        meeting.external_meeting_id = external_meeting.external_id
        meeting.external_platform = external_platform
        meeting.updated_at = now

    project.updated_at = now
    session.add(meeting)
    session.add(project)
    session.commit()
    session.refresh(meeting)
    return MeetingRead.model_validate(meeting)


def _to_read(config: IntegrationConfig) -> IntegrationConfigRead:
    masked = {}
    for key, value in (config.config_json or {}).items():
        if value and key in MASKED_KEYS:
            masked[key] = "******"
        else:
            masked[key] = value
    return IntegrationConfigRead.model_validate({**config.model_dump(), "config_json": masked})


def _validate_platform(platform: str) -> None:
    if platform not in SUPPORTED_PLATFORMS:
        raise ValueError("Unsupported platform.")
