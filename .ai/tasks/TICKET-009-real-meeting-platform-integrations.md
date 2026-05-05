# Task Handoff for Codex CLI

## 1. Task Name

**TICKET-009 — Real Meeting Platform Integrations (Tencent Meeting + DingTalk)**

## 2. Background

ProjectRoom AI currently only supports "manual" meeting import — users paste transcript text. The product vision requires real integration with Chinese meeting platforms so that:

- Users can create/sync scheduled meetings from within ProjectRoom AI
- When cloud recording/transcription is available on Tencent Meeting or DingTalk, transcripts are automatically imported
- AI analysis runs on imported transcripts without manual copy-paste

This ticket implements the integration layer with proper connector architecture, supporting both real API keys and mock/sandbox fallback so the app never breaks without real credentials.

## 3. Objective

Build an `integrations/` subsystem in the backend that:

1. Provides a clean connector interface for meeting platforms
2. Implements Tencent Meeting connector (create meeting, sync meeting, webhook receiver, transcript import)
3. Implements DingTalk connector (create meeting, sync meeting, webhook receiver, transcript import)
4. Provides admin UI pages for platform configuration and connection testing
5. Supports mock/sandbox mode when no real credentials are configured
6. All secrets read from environment variables only, never committed

## 4. Scope

### 4.1 Integration Architecture

- [ ] `backend/app/integrations/` package
  - `__init__.py` — exports
  - `base.py` — AbstractConnector with interface:
    - `test_connection() -> bool`
    - `create_meeting(meeting_data) -> ExternalMeeting`
    - `get_meeting(external_id) -> ExternalMeeting`
    - `list_recordings(meeting_id) -> list[RecordingInfo]`
    - `get_transcript(recording_id) -> str`
    - `health_check() -> dict`
  - `tencent/` — Tencent Meeting connector
  - `dingtalk/` — DingTalk connector
  - `manager.py` — IntegrationManager: routes to correct connector, handles mock fallback

- [ ] `backend/app/integrations/types.py` — shared Pydantic models:
  - `ExternalMeeting(id, title, start_time, end_time, participants, platform)`
  - `RecordingInfo(id, meeting_id, duration, file_url, status)`

### 4.2 Tencent Meeting Connector

- [ ] `backend/app/integrations/tencent/client.py` — Tencent Meeting REST API client
- [ ] `backend/app/integrations/tencent/auth.py` — signature/auth header generation (enterprise_jwt or OAuth)
- [ ] Support both enterprise_jwt (secret-based) and OAuth2.0 modes
- [ ] `create_meeting()` — call Tencent Meeting API POST /v1/meetings
- [ ] `get_meeting()` — call GET /v1/meetings/{meeting_id}
- [ ] `list_recordings()` — call GET /v1/meetings/{meeting_id}/recordings (enterprise_jwt only)
- [ ] `get_transcript()` — call recording transcript API (enterprise_jwt, as OAuth2.0 not supported for transcript paragraph query)
- [ ] `handle_webhook()` — validate signature, parse event type

**Tencent Meeting API endpoints used:**
- `POST /v1/meetings` (create meeting)
- `GET /v1/meetings/{meeting_id}` (get meeting info)
- `GET /v1/meetings/{meeting_id}/recordings` (list recordings, enterprise_jwt)
- Recording transcript paragraph query (enterprise_jwt)

### 4.3 Tencent Meeting Webhook

- [ ] `POST /api/webhooks/tencent-meeting` — receive Webhook events
- [ ] Validate signature using TOKEN + timestamp + nonce
- [ ] Handle `recording.completed` event → extract recording_files, record_file_id
- [ ] Trigger transcript import + AI analysis pipeline when recording completed
- [ ] Handle `meeting.created`, `meeting.updated`, `meeting.canceled` events for sync

### 4.4 DingTalk Connector

- [ ] `backend/app/integrations/dingtalk/client.py` — DingTalk Open API client
- [ ] `backend/app/integrations/dingtalk/auth.py` — access token management
- [ ] `create_meeting()` — call DingTalk video conference / appointment meeting API
- [ ] `get_meeting()` — get meeting info
- [ ] `list_recordings()` — query cloud recording
- [ ] `get_transcript()` — query cloud recording text (AI minutes)
- [ ] Support AI meeting minutes configuration fields in appointment meeting creation

**DingTalk API endpoints used:**
- Create video conference
- Create appointment meeting (with AI minutes config)
- Query meeting info
- Query cloud recording text info
- Event subscription management

### 4.5 DingTalk Webhook

- [ ] `POST /api/webhooks/dingtalk` — receive DingTalk event callbacks
- [ ] Validate signature
- [ ] Handle cloud recording completed event
- [ ] Handle meeting status change events
- [ ] Trigger transcript import pipeline

### 4.6 Platform Configuration

- [ ] `backend/app/models/integration_config.py` — `IntegrationConfig` SQLModel:
  - platform (tencent_meeting / dingtalk)
  - api_mode (real / mock / sandbox)
  - config_json (JSON: app_id, corp_id, secret_id, secret_key, webhook_token, webhook_url, etc.)
  - is_enabled (bool)
  - created_at, updated_at

- [ ] Alembic migration for `integration_config` table
- [ ] CRUD endpoints for config management:
  - `GET /api/integrations/configs` — list all configs
  - `POST /api/integrations/configs` — create/update config
  - `DELETE /api/integrations/configs/{config_id}` — delete config

### 4.7 Connection Test API

- [ ] `POST /api/integrations/{platform}/test` — test connection for given platform
- [ ] Uses real connector if api_mode=real, mock connector if mock
- [ ] Returns `{ connected: bool, message: str, details: dict }`

### 4.8 External Meeting APIs

- [ ] `POST /api/integrations/{platform}/meetings` — create meeting on external platform
  - Maps external meeting ID to our Meeting record
  - Stores `external_meeting_id` on Meeting model (add field)

- [ ] `POST /api/integrations/{platform}/meetings/sync` — sync meetings from platform
  - Pulls meeting list from platform, creates local Meeting records for new ones

### 4.9 Transcript Import Pipeline

- [ ] `POST /api/integrations/{platform}/import/{external_meeting_id}` — import transcript
  - Fetch transcript text from platform API
  - Create local Meeting record with transcript_text
  - Auto-trigger AI analysis if configured

### 4.10 Mock/Sandbox Mode

- [ ] `backend/app/integrations/tencent/mock.py` — TencentMeetingMockConnector
- [ ] `backend/app/integrations/dingtalk/mock.py` — DingTalkMockConnector
- [ ] Each mock connector returns realistic fake data
- [ ] Mock webhook endpoints accept test payloads
- [ ] When `TENCENT_MEETING_API_MODE=mock` or key not set → use mock connector
- [ ] App must start and run without crash in mock mode

### 4.11 Frontend Pages

- [ ] `/settings/integrations` — integration settings page
  - List configured platforms with status (connected/disconnected/mock)
  - Add/configure platform form
  - Test connection button per platform
  - Toggle mock/real mode

- [ ] Integration section on meeting form — "从腾讯会议/钉钉导入" option
- [ ] Integration status indicator on meeting cards (external_meeting_id badge)

**New files:**
- `frontend/app/settings/integrations/page.tsx`
- `frontend/components/integrations/integration-settings-client.tsx`
- `frontend/components/integrations/platform-config-card.tsx`

**Modified:**
- `frontend/app/layout.tsx` — add settings nav link
- `frontend/components/meeting/create-meeting-form.tsx` — integration source option
- `frontend/lib/api.ts` — integration API methods
- `frontend/lib/types.ts` — integration types

### 4.12 Environment Variables

Add to `.env.example`:

```
# Tencent Meeting Integration
# API mode: real | mock (default: mock)
TENCENT_MEETING_API_MODE=mock
TENCENT_MEETING_APP_ID=
TENCENT_MEETING_CORP_ID=
TENCENT_MEETING_SECRET_ID=
TENCENT_MEETING_SECRET_KEY=
TENCENT_MEETING_SDK_ID=
TENCENT_MEETING_AUTH_MODE=enterprise_jwt
# Webhook
TENCENT_MEETING_WEBHOOK_TOKEN=
TENCENT_MEETING_WEBHOOK_URL=

# DingTalk Integration
# API mode: real | mock (default: mock)
DINGTALK_API_MODE=mock
DINGTALK_APP_KEY=
DINGTALK_APP_SECRET=
DINGTALK_CORP_ID=
DINGTALK_AGENT_ID=
# Webhook
DINGTALK_WEBHOOK_TOKEN=
DINGTALK_WEBHOOK_URL=

# Webhook public URL for local dev (ngrok/cloudflared tunnel)
WEBHOOK_PUBLIC_BASE_URL=
```

### 4.13 Backend Config

Update `backend/app/config.py` to read all integration env vars with defaults.

## 5. Out of Scope

Do NOT implement:
- Feishu/Lark integration
- Real-time transcription streaming
- OAuth authorization flow UI (the callbacks, consent screens)
- Multi-account per platform (one config per platform for MVP)
- Billing/usage tracking per integration
- Integration analytics dashboard
- Automated webhook URL registration (must be done manually in platform console)

## 6. Data Model

### IntegrationConfig
```python
class IntegrationConfig(SQLModel, table=True):
    __tablename__ = "integration_config"

    id: uuid.UUID = primary_key
    platform: str  # "tencent_meeting" | "dingtalk"
    api_mode: str = "mock"  # "real" | "mock"
    config_json: dict = {}  # JSON: sensitive config (masked in API response)
    is_enabled: bool = True
    created_at: datetime
    updated_at: datetime
```

### Meeting — add field
```python
external_meeting_id: Optional[str] = None  # platform meeting ID
external_platform: Optional[str] = None    # tencent_meeting / dingtalk
```

### ExternalMeeting (Pydantic, not DB)
```python
class ExternalMeeting(BaseModel):
    external_id: str
    title: str
    start_time: datetime
    end_time: datetime
    participants: list[str]
    platform: str
    status: str
    join_url: Optional[str] = None
```

## 7. API Contract

### Integration Config Management
```
GET    /api/integrations/configs                     → list configs (masked)
POST   /api/integrations/configs                     → create/update config
DELETE /api/integrations/configs/{config_id}         → delete config
```

### Connection Test
```
POST   /api/integrations/{platform}/test             → test connection
```

### External Meeting Operations
```
POST   /api/integrations/{platform}/meetings         → create external meeting
POST   /api/integrations/{platform}/meetings/sync    → sync meetings from platform
POST   /api/integrations/{platform}/import/{external_meeting_id} → import transcript
```

### Webhooks
```
POST   /api/webhooks/tencent-meeting                 → Tencent Meeting events
POST   /api/webhooks/dingtalk                        → DingTalk events
```

### Platform Info
```
GET    /api/integrations/{platform}/info              → platform capabilities + mode
```

## 8. Backend Services

### New
- `backend/app/integrations/__init__.py`
- `backend/app/integrations/base.py` — AbstractConnector
- `backend/app/integrations/types.py` — shared types
- `backend/app/integrations/manager.py` — IntegrationManager
- `backend/app/integrations/tencent/__init__.py`
- `backend/app/integrations/tencent/client.py` — API client
- `backend/app/integrations/tencent/auth.py` — auth helpers
- `backend/app/integrations/tencent/mock.py` — mock connector
- `backend/app/integrations/dingtalk/__init__.py`
- `backend/app/integrations/dingtalk/client.py` — API client
- `backend/app/integrations/dingtalk/auth.py` — auth helpers
- `backend/app/integrations/dingtalk/mock.py` — mock connector
- `backend/app/models/integration_config.py` — DB model
- `backend/app/routers/integrations.py` — all integration endpoints
- `backend/app/routers/webhooks.py` — webhook receiver endpoints
- `backend/app/services/integration_service.py` — business logic

### Modified
- `backend/app/models/__init__.py` — add new models
- `backend/app/models/meeting.py` — add external_meeting_id, external_platform
- `backend/app/config.py` — add integration settings
- `backend/app/main.py` — register new routers
- `.env.example` — add integration vars

### Alembic Migrations
- `add_integration_config_table`
- `add_external_meeting_fields_to_meeting_table`

## 9. Frontend

### New
- `frontend/app/settings/integrations/page.tsx`
- `frontend/components/integrations/integration-settings-client.tsx`
- `frontend/components/integrations/platform-config-card.tsx`

### Modified
- `frontend/app/layout.tsx` — settings nav
- `frontend/lib/api.ts` — integration methods
- `frontend/lib/types.ts` — integration types

## 10. Webhook Signature Validation

### Tencent Meeting Webhook
- Validate signature: SHA256(TOKEN + timestamp + nonce + body) compare with header
- Replay attack protection (check timestamp window)
- Event types: recording.completed, meeting.created, meeting.updated, meeting.canceled

### DingTalk Webhook
- Validate signature per DingTalk event subscription spec
- Event types: cloud recording completed, meeting status change

## 11. Test Plan

### Backend
- `test_integrations.py` — mock connector tests, config CRUD, connection test
- `test_webhooks.py` — signature validation, event parsing, mock payloads
- `test_integration_service.py` — import pipeline, meeting sync logic
- Update existing tests for Meeting model changes

### Frontend
- `npm run build` must pass
- Manual: navigate to /settings/integrations, configure mock, test connection, create mock meeting, import mock transcript

## 12. Acceptance Criteria

### Architecture
- [ ] `backend/app/integrations/` package with clear base/tencent/dingtalk separation
- [ ] AbstractConnector interface defined and implemented by both real and mock connectors
- [ ] IntegrationManager routes to correct connector based on platform + mode

### Mock/Sandbox
- [ ] Without any env vars set, app starts with mock mode (no crash)
- [ ] Mock connectors return realistic fake data
- [ ] Mock webhook endpoint accepts test payloads
- [ ] Creating meeting via mock returns fake meeting data
- [ ] Importing transcript via mock returns fake transcript text

### Tencent Meeting
- [ ] Real connector reads credentials from env vars only
- [ ] Connection test endpoint works with real keys
- [ ] Create meeting API maps correctly to Tencent Meeting API
- [ ] Webhook signature validation implemented
- [ ] recording.completed event triggers transcript import pipeline
- [ ] Enterprise_jwt auth mode supported for transcript operations

### DingTalk
- [ ] Real connector reads credentials from env vars only
- [ ] Access token management (acquire, cache, refresh)
- [ ] Create appointment meeting with AI meeting minutes config
- [ ] Webhook signature validation implemented
- [ ] Cloud recording text query and import works

### Configuration
- [ ] Integration config CRUD works via API
- [ ] Config page in frontend with add/configure/test
- [ ] Test connection button shows real result or mock indicator
- [ ] API mode toggle visible (real/mock)

### Data Integrity
- [ ] No hardcoded secrets anywhere
- [ ] `.env.example` documents all integration env vars
- [ ] Config JSON is masked in API responses
- [ ] `git diff` shows no secrets

### Overall
- [ ] All existing functionality preserved
- [ ] `pytest` passes all tests (use mock for integration tests)
- [ ] `npm run build` passes
- [ ] App starts without crash in mock mode

## 13. Deliverables

After completion, create `.ai/reports/TICKET-009-codex-report.md` with:
1. Task file used
2. Completed work summary
3. All files created/modified
4. All APIs implemented
5. All UI changes
6. How to run (mock mode)
7. How to configure real keys
8. How to test (pytest + curl examples)
9. Known issues
10. Questions for Claude review
