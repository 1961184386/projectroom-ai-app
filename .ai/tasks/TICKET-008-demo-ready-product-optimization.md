# Task Handoff for Codex CLI

## 1. Task Name

**TICKET-008 — Demo-Ready Product Optimization**

## 2. Background

TICKET-001 through TICKET-007 established the full MVP foundation: project spaces, meeting import, AI analysis, aggregation views, project Q&A, progress summary, demo data seed, and UI polish. However, the current product still feels "rough" for a partner/investor demo because:

- Action items extracted by AI have no confirmation workflow (read-only)
- Create-project form lacks batch import / auto-fill capabilities
- No obvious "one-click demo" entry point for reviewers
- B2B SaaS visual identity is functional but not polished
- Meeting transcript import UX is basic (just a textarea)
- No acceptance criteria tracking in project detail
- Structure lacks explicit "decision log" or "confirmation toggle" on extracted items

This ticket bridges the gap from "MVP that works" to "polished product suitable for a live demo to partners/investors."

## 3. Objective

Transform ProjectRoom AI from a functional prototype into a demo-ready SaaS product:

1. **Project List / Dashboard** — stats cards, quick actions, "one-click demo" entry
2. **Project Detail Page** — tabbed navigation with dedicated sections
3. **Create Project Form** — templates, auto-fill from material paste
4. **Meeting Transcript Import UX** — character count, platform hints
5. **AI Analysis Confirmation Workflow** — toggle each item confirmed/unconfirmed
6. **Project Materials** — store PRD/SOW/RFP excerpts per project
7. **Demo Data API** — seed demo data via API call
8. **B2B SaaS Visual Polish** — gradient header, footer, refined palette

## 4. Scope

### 4.1 Dashboard Stats & Demo Entry

- [ ] Stats cards: total projects, total meetings, pending actions, active risks
- [ ] "Load Demo Data" button in empty state (calls POST /api/demo/seed)
- [ ] Project card shows last meeting time + pending task count
- [ ] Optional stage filter (query param)
- [ ] Hero subtitle refined

**Files:** `frontend/app/projects/page.tsx`, `frontend/components/project/project-list-client.tsx`, `frontend/components/project/project-card.tsx`

### 4.2 Project Detail Tabbed Layout

- [ ] Replace single-page layout with tabs: 概览 | 会议记录 | 任务清单 | 风险台账 | 需求变更 | 决策记录 | 验收标准
- [ ] Each tab has item count badge
- [ ] 概览 tab: project info cards + ProjectSummary
- [ ] 验收标准 tab: aggregated acceptance criteria items

**Files:** `frontend/components/project/project-detail-client.tsx`, new `frontend/components/project/project-tabs.tsx`

### 4.3 Create Project Form Enhancement

- [ ] 3 built-in templates (software delivery, consulting, product launch)
- [ ] "Paste project brief to auto-fill" section
- [ ] Enhanced stage selector

**Files:** `frontend/components/project/create-project-form.tsx`

### 4.4 Project Materials

- [ ] `ProjectMaterial` SQLModel (project_id FK, title, material_type, content)
- [ ] Alembic migration
- [ ] CRUD endpoints: GET/POST/DELETE materials
- [ ] UI section on project detail to add/view materials

**New files:** `backend/app/models/project_material.py`, `backend/app/services/material_service.py`, `backend/app/routers/materials.py`
**Modified:** `backend/app/models/__init__.py`, `backend/app/main.py`

### 4.5 Meeting Import UX

- [ ] Character count display
- [ ] Platform-specific import hints
- [ ] Better textarea styling

**Files:** `frontend/components/meeting/create-meeting-form.tsx`

### 4.6 Confirmation Workflow

- [ ] Add `confirmed: bool` to each JSON item in MeetingAnalysis
- [ ] `PATCH /api/meetings/{meeting_id}/analysis/confirm` endpoint
  - Request: `{ "item_type": "action_item|risk|requirement_change|key_decision", "item_index": 0, "confirmed": true }`
- [ ] UI toggle buttons on each analysis result item (green check / orange question)
- [ ] Aggregated views show confirmed status

**Files:** `backend/app/routers/analysis.py`, `backend/app/services/analysis_service.py`, `frontend/components/analysis/*.tsx`

### 4.7 Demo Data API

- [ ] `POST /api/demo/seed` — triggers seed via API
- [ ] `GET /api/demo/status` — check if demo exists
- [ ] Frontend button calls seed API, then refreshes

**New:** `backend/app/routers/demo.py`
**Modified:** `frontend/components/project/project-list-client.tsx`

### 4.8 Dashboard Stats API

- [ ] `GET /api/dashboard/stats` — total_projects, total_meetings, pending_action_items, active_risks

**New:** `backend/app/routers/dashboard.py`

### 4.9 Visual Polish

- [ ] Header gradient background
- [ ] Footer with copyright
- [ ] Refined button & badge styles
- [ ] Consistent card shadows

**Files:** `frontend/app/layout.tsx`, `frontend/app/globals.css`

### 4.10 README Demo Path

- [ ] "Demo Walkthrough" section with step-by-step flow

**Files:** `README.md`

## 5. Out of Scope

- Real platform integrations (Tencent/DingTalk/Feishu) → TICKET-009
- Auth, export, email, RAG, streaming, dark mode, i18n

## 6. API Contract

### New APIs
```
POST   /api/demo/seed                              → seed demo data
GET    /api/demo/status                            → check demo exists
GET    /api/dashboard/stats                        → dashboard stats
GET    /api/projects/{project_id}/materials        → list materials
POST   /api/projects/{project_id}/materials        → add material
DELETE /api/projects/{project_id}/materials/{id}   → delete material
PATCH  /api/meetings/{meeting_id}/analysis/confirm → toggle confirmed
```

### Modified APIs
```
GET  /api/projects                → add ?stage= filter
GET  /api/projects/{id}/todos     → include confirmed field
GET  /api/projects/{id}/risks     → include confirmed field
GET  /api/projects/{id}/changes   → include confirmed field
GET  /api/projects/{id}/decisions → include confirmed field
```

## 7. Data Model

### ProjectMaterial
```python
class ProjectMaterial(SQLModel, table=True):
    __tablename__ = "project_material"
    id: uuid.UUID = primary_key
    project_id: uuid.UUID = FK → project
    title: str
    material_type: str = "other"  # prd/sow/rfp/meeting_notes/other
    content: str
    created_at: datetime
    updated_at: datetime
```

### MeetingAnalysis JSON items gain `confirmed: bool` (default false)

## 8. Acceptance Criteria

- [ ] Dashboard shows stats cards (total projects, meetings, pending actions)
- [ ] Empty project list shows "快速体验" button → loads demo data
- [ ] `POST /api/demo/seed` returns success
- [ ] `GET /api/demo/status` returns correct status
- [ ] Project detail has tabbed layout with 7 tabs + count badges
- [ ] Create project form has 3 templates
- [ ] Project materials CRUD works (add/list/delete)
- [ ] Meeting import shows character count + platform hints
- [ ] Analysis items have confirmation toggles in UI
- [ ] `PATCH /api/meetings/{id}/analysis/confirm` works
- [ ] Aggregated views show confirmed status
- [ ] `GET /api/projects?stage=` filtering works
- [ ] `GET /api/dashboard/stats` returns correct counts
- [ ] Header has gradient, footer with copyright
- [ ] All existing functionality preserved
- [ ] `pytest` all passing
- [ ] `npm run build` passing
- [ ] README has demo walkthrough

## 9. Deliverables

After completion, create `.ai/reports/TICKET-008-codex-report.md` with:
1. Task file used
2. Completed work summary
3. All files created/modified
4. All APIs implemented
5. All UI changes
6. How to run
7. How to test
8. Known issues
9. Questions for Claude review
