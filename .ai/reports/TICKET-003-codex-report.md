## 1. Task File Used

`.ai/tasks/TICKET-003-project-aggregation.md`

## 2. Completed Work

- Implemented project-level aggregation service to flatten `action_items`, `risks`, `requirement_changes`, and `key_decisions` across all analyzed meetings in a project.
- Added 4 aggregation response models with source meeting metadata attached to each flattened record.
- Added 4 project aggregation APIs under `/api/projects/{project_id}`.
- Registered `aggregation_router` in the FastAPI app.
- Added backend tests covering:
  - cross-meeting merge behavior
  - descending `meeting_time` order
  - empty analyzed data returning `[]`
  - missing project returning `404`
- Added frontend aggregated types and API client methods.
- Added 4 frontend aggregation components:
  - aggregated todos
  - aggregated risks
  - aggregated changes
  - aggregated decisions
- Replaced the 4 placeholder sections on the project detail page with real independently loaded aggregated views.
- Verified backend test suite and frontend production build.

## 3. Files Changed (list with paths)

- `backend/app/services/aggregation_service.py`
- `backend/app/routers/aggregation.py`
- `backend/app/main.py`
- `backend/app/services/__init__.py`
- `backend/app/routers/__init__.py`
- `backend/tests/test_aggregation.py`
- `frontend/lib/types.ts`
- `frontend/lib/api.ts`
- `frontend/components/project/aggregated-todos.tsx`
- `frontend/components/project/aggregated-risks.tsx`
- `frontend/components/project/aggregated-changes.tsx`
- `frontend/components/project/aggregated-decisions.tsx`
- `frontend/components/project/project-detail-client.tsx`
- `.ai/reports/TICKET-003-codex-report.md`

## 4. New / Modified APIs

- `GET /api/projects/{project_id}/todos`
  - Return flattened `action_items` across all analyzed meetings in the project
  - Each item includes `meeting_id`, `meeting_title`, and `meeting_time`

- `GET /api/projects/{project_id}/risks`
  - Return flattened `risks` across all analyzed meetings in the project
  - Each item includes source meeting metadata

- `GET /api/projects/{project_id}/changes`
  - Return flattened `requirement_changes` across all analyzed meetings in the project
  - Each item includes source meeting metadata

- `GET /api/projects/{project_id}/decisions`
  - Return flattened `key_decisions` across all analyzed meetings in the project
  - Each item includes source meeting metadata

## 5. New / Modified UI Pages and Components

- Updated:
  - `frontend/components/project/project-detail-client.tsx`
  - Replaced 4 placeholder cards with real aggregated data views

- Added:
  - `frontend/components/project/aggregated-todos.tsx`
  - `frontend/components/project/aggregated-risks.tsx`
  - `frontend/components/project/aggregated-changes.tsx`
  - `frontend/components/project/aggregated-decisions.tsx`

These components each use independent `useSWR` requests, so one failing aggregation endpoint does not block the other sections.

## 6. How to Run

Backend:

```bash
cd backend
source .venv/bin/activate
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Open:

- Frontend: `http://localhost:3000`
- Backend docs: `http://localhost:8000/docs`

## 7. How to Test

Backend tests:

```bash
cd backend
source .venv/bin/activate
pytest
```

Pytest output:

```text
============================= test session starts ==============================
platform darwin -- Python 3.12.10, pytest-8.3.2, pluggy-1.6.0
rootdir: /Users/guojilong/projectroom/projectroom-ai-app/backend
plugins: anyio-4.13.0
collected 14 items

tests/test_aggregation.py ...                                            [ 21%]
tests/test_analysis.py ....                                              [ 50%]
tests/test_meetings.py ...                                               [ 71%]
tests/test_projects.py ....                                              [100%]

=============================== warnings summary ===============================
tests/test_aggregation.py: 2 warnings
tests/test_analysis.py: 4 warnings
tests/test_meetings.py: 4 warnings
tests/test_projects.py: 5 warnings
  /Users/guojilong/projectroom/projectroom-ai-app/backend/app/services/project_service.py:20: DeprecationWarning: datetime.datetime.utcnow() is deprecated and scheduled for removal in a future version. Use timezone-aware objects to represent datetimes in UTC: datetime.datetime.now(datetime.UTC).
    now = datetime.utcnow()

tests/test_aggregation.py: 3 warnings
tests/test_analysis.py: 4 warnings
tests/test_meetings.py: 5 warnings
tests/test_projects.py: 1 warning
  /Users/guojilong/projectroom/projectroom-ai-app/backend/app/services/meeting_service.py:11: DeprecationWarning: datetime.datetime.utcnow() is deprecated and scheduled for removal in a future version. Use timezone-aware objects to represent datetimes in UTC: datetime.datetime.now(datetime.UTC).
    now = datetime.utcnow()

tests/test_aggregation.py::test_aggregation_endpoints_flatten_across_meetings_in_desc_order
tests/test_aggregation.py::test_aggregation_endpoints_flatten_across_meetings_in_desc_order
tests/test_analysis.py::test_analyze_meeting_creates_analysis
tests/test_analysis.py::test_analyze_meeting_is_idempotent_and_overwrites
tests/test_analysis.py::test_analyze_meeting_is_idempotent_and_overwrites
tests/test_analysis.py::test_analyze_meeting_failure_marks_status_failed
  /Users/guojilong/projectroom/projectroom-ai-app/backend/app/services/analysis_service.py:26: DeprecationWarning: datetime.datetime.utcnow() is deprecated and scheduled for removal in a future version. Use timezone-aware objects to represent datetimes in UTC: datetime.datetime.now(datetime.UTC).
    meeting.updated_at = datetime.utcnow()

tests/test_aggregation.py::test_aggregation_endpoints_flatten_across_meetings_in_desc_order
tests/test_aggregation.py::test_aggregation_endpoints_flatten_across_meetings_in_desc_order
tests/test_analysis.py::test_analyze_meeting_creates_analysis
tests/test_analysis.py::test_analyze_meeting_is_idempotent_and_overwrites
tests/test_analysis.py::test_analyze_meeting_is_idempotent_and_overwrites
  /Users/guojilong/projectroom/projectroom-ai-app/backend/app/services/analysis_service.py:59: DeprecationWarning: datetime.datetime.utcnow() is deprecated and scheduled for removal in a future version. Use timezone-aware objects to represent datetimes in UTC: datetime.datetime.now(datetime.UTC).
    now = datetime.utcnow()

tests/test_aggregation.py::test_aggregation_endpoints_flatten_across_meetings_in_desc_order
tests/test_aggregation.py::test_aggregation_endpoints_flatten_across_meetings_in_desc_order
tests/test_analysis.py::test_analyze_meeting_creates_analysis
tests/test_analysis.py::test_analyze_meeting_is_idempotent_and_overwrites
tests/test_analysis.py::test_analyze_meeting_is_idempotent_and_overwrites
  /Users/guojilong/projectroom/projectroom-ai-app/backend/app/services/analysis_service.py:39: DeprecationWarning: datetime.datetime.utcnow() is deprecated and scheduled for removal in a future version. Use timezone-aware objects to represent datetimes in UTC: datetime.datetime.now(datetime.UTC).
    meeting.updated_at = datetime.utcnow()

tests/test_analysis.py::test_analyze_meeting_failure_marks_status_failed
  /Users/guojilong/projectroom/projectroom-ai-app/backend/app/services/analysis_service.py:46: DeprecationWarning: datetime.datetime.utcnow() is deprecated and scheduled for removal in a future version. Use timezone-aware objects to represent datetimes in UTC: datetime.datetime.now(datetime.UTC).
    meeting.updated_at = datetime.utcnow()

tests/test_projects.py::test_patch_project_updates_fields
  /Users/guojilong/projectroom/projectroom-ai-app/backend/app/services/project_service.py:61: DeprecationWarning: datetime.datetime.utcnow() is deprecated and scheduled for removal in a future version. Use timezone-aware objects to represent datetimes in UTC: datetime.datetime.now(datetime.UTC).
    project.updated_at = datetime.utcnow()

-- Docs: https://docs.pytest.org/en/stable/how-to/capture-warnings.html
======================= 14 passed, 46 warnings in 0.19s ========================
```

Example curl:

```bash
curl http://localhost:8000/api/projects/<project_id>/todos
curl http://localhost:8000/api/projects/<project_id>/risks
curl http://localhost:8000/api/projects/<project_id>/changes
curl http://localhost:8000/api/projects/<project_id>/decisions
```

Frontend build verification:

```bash
cd frontend
npm run build
```

## 8. Known Issues

- Backend still emits existing `datetime.utcnow()` deprecation warnings from previously implemented service code.
- Aggregation returns all matching items with no pagination or filtering, which is intentional for MVP scope.
- Project chat and project AI progress summary remain out of scope for this ticket.

## 9. Questions for Claude Review

- The backend aggregation service validates flattened JSON entries back through existing analysis schemas before returning them. This keeps API output consistent, but it also means malformed historical JSON rows would be rejected instead of passed through. Confirm this strictness is preferred for future migration-safe behavior.
