# Architecture — ProjectRoom AI

## Overview

Three-tier web application: Next.js frontend → FastAPI backend → PostgreSQL database. AI analysis via OpenAI API called server-side.

```
Browser (Next.js)
      │  REST JSON
      ▼
FastAPI Backend
      │           │
      ▼           ▼
PostgreSQL    OpenAI API
```

## Directory Structure

```
projectroom-ai-app/
├── CLAUDE.md
├── AGENTS.md
├── .ai/
│   ├── context/        ← product-brief, architecture, roadmap
│   ├── tasks/          ← TICKET-XXX task handoffs
│   └── reports/        ← TICKET-XXX Codex reports
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                      ← redirect to /projects
│   │   ├── projects/
│   │   │   ├── page.tsx                  ← Project list (Dashboard)
│   │   │   ├── new/page.tsx              ← Create project form
│   │   │   └── [projectId]/
│   │   │       ├── page.tsx              ← Project detail
│   │   │       ├── meetings/
│   │   │       │   ├── new/page.tsx      ← Meeting import form
│   │   │       │   └── [meetingId]/
│   │   │       │       └── page.tsx      ← Meeting analysis result
│   │   │       └── chat/page.tsx         ← Project Q&A
│   ├── components/
│   │   ├── ui/                           ← shadcn/ui primitives
│   │   ├── project/                      ← ProjectCard, ProjectHeader, etc.
│   │   ├── meeting/                      ← MeetingCard, TranscriptForm, etc.
│   │   └── analysis/                     ← SummaryCard, TodoTable, RiskTable, etc.
│   ├── lib/
│   │   ├── api.ts                        ← typed fetch wrappers
│   │   └── types.ts                      ← shared TypeScript types
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── main.py                       ← FastAPI app, CORS, router mount
│   │   ├── database.py                   ← engine, session dependency
│   │   ├── config.py                     ← settings from env
│   │   ├── models/
│   │   │   ├── project.py                ← Project SQLModel
│   │   │   ├── meeting.py                ← Meeting SQLModel
│   │   │   └── analysis.py               ← MeetingAnalysis SQLModel
│   │   ├── routers/
│   │   │   ├── projects.py               ← /api/projects
│   │   │   ├── meetings.py               ← /api/projects/{id}/meetings
│   │   │   ├── analysis.py               ← /api/meetings/{id}/analyze
│   │   │   └── chat.py                   ← /api/projects/{id}/chat
│   │   ├── services/
│   │   │   ├── project_service.py
│   │   │   ├── meeting_service.py
│   │   │   └── analysis_service.py
│   │   └── ai/
│   │       ├── analyzer.py               ← meeting analysis prompt + OpenAI call
│   │       ├── chat.py                   ← project Q&A prompt + OpenAI call
│   │       └── schemas.py                ← Pydantic schema for AI JSON output
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   ├── tests/
│   │   ├── test_projects.py
│   │   ├── test_meetings.py
│   │   └── test_analysis.py
│   ├── requirements.txt
│   └── .env.example
├── docker-compose.yml
└── .env.example
```

## Data Models

### Project

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| name | str | required |
| client_name | str | optional |
| description | text | optional |
| current_stage | str | e.g. "需求确认", "开发中", "测试", "验收" |
| owner_name | str | optional |
| goal | text | project objective |
| acceptance_criteria | text | optional |
| created_at | datetime | auto |
| updated_at | datetime | auto |

### Meeting

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| project_id | UUID | FK → Project |
| title | str | required |
| platform | str | manual / tencent / dingtalk / feishu |
| meeting_time | datetime | required |
| participants | str | comma-separated names |
| agenda | text | optional |
| transcript_text | text | required |
| analysis_status | str | pending / processing / done / failed |
| created_at | datetime | auto |
| updated_at | datetime | auto |

### MeetingAnalysis

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| meeting_id | UUID | FK → Meeting, unique |
| meeting_summary | text | |
| key_decisions | JSONB | list of decision objects |
| action_items | JSONB | list of task objects |
| requirement_changes | JSONB | list of change objects |
| risks | JSONB | list of risk objects |
| open_questions | JSONB | list of question objects |
| next_meeting_topics | JSONB | list of strings |
| created_at | datetime | auto |
| updated_at | datetime | auto |

## AI Output Schema

```json
{
  "meeting_summary": "string",
  "key_decisions": [
    { "decision": "", "owner": "", "impact": "", "evidence": "" }
  ],
  "action_items": [
    { "task": "", "owner": "", "deadline": "", "priority": "high|medium|low", "status": "pending", "evidence": "" }
  ],
  "requirement_changes": [
    { "change": "", "type": "new|modified|removed|unclear", "impact_on_scope": "", "need_confirmation": true, "evidence": "" }
  ],
  "risks": [
    { "risk": "", "level": "high|medium|low", "suggestion": "", "evidence": "" }
  ],
  "open_questions": [
    { "question": "", "owner": "", "reason": "" }
  ],
  "next_meeting_topics": ["string"]
}
```

## API Contract

### Projects
```
GET    /api/projects                        → list projects
POST   /api/projects                        → create project
GET    /api/projects/{project_id}           → get project detail
PATCH  /api/projects/{project_id}           → update project
```

### Meetings
```
GET    /api/projects/{project_id}/meetings             → list meetings
POST   /api/projects/{project_id}/meetings             → create meeting
GET    /api/projects/{project_id}/meetings/{meeting_id} → get meeting detail
```

### Analysis
```
POST   /api/meetings/{meeting_id}/analyze   → trigger AI analysis
GET    /api/meetings/{meeting_id}/analysis  → get analysis result
```

### Project Aggregation
```
GET    /api/projects/{project_id}/todos     → all action items across meetings
GET    /api/projects/{project_id}/risks     → all risks across meetings
GET    /api/projects/{project_id}/changes   → all requirement changes
GET    /api/projects/{project_id}/decisions → all key decisions
GET    /api/projects/{project_id}/summary   → AI-generated project progress summary
```

### Chat
```
POST   /api/projects/{project_id}/chat      → { "question": "..." } → { "answer": "...", "sources": [...] }
```

## Response Envelope

All API responses use:
```json
{ "data": <payload>, "message": "ok" }
```
Errors:
```json
{ "detail": "error description" }
```

## Environment Variables

```
DATABASE_URL=postgresql://user:pass@localhost:5432/projectroom
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
FRONTEND_URL=http://localhost:3000
```

## Local Dev Setup

```bash
# 1. Start database
docker-compose up -d db

# 2. Backend
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# 3. Frontend
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:3000
Backend API: http://localhost:8000
API Docs: http://localhost:8000/docs
