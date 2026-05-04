# Task Handoff for Codex CLI

## 1. Task Name

**TICKET-001 — Project & Meeting Foundation**

## 2. Background

ProjectRoom AI is an AI-powered project meeting workspace. Before AI analysis can work, we need the foundational layer: the ability to create project spaces, import meeting transcripts, and navigate between projects and meetings in the UI.

This ticket establishes the entire scaffold that every subsequent ticket will build on. Getting the data models, API contracts, and page routing right here is critical.

## 3. Objective

Implement a working full-stack foundation:
- Backend: Project and Meeting data models, CRUD APIs
- Frontend: Project list page, project detail page, meeting import form

The app must run locally end-to-end after this ticket. No AI analysis yet.

## 4. Scope

### Backend
- [ ] Docker Compose with PostgreSQL (or SQLite fallback for no-docker dev)
- [ ] FastAPI app scaffold (`backend/app/main.py`, CORS configured)
- [ ] `Project` SQLModel with all fields listed in Data Model section
- [ ] `Meeting` SQLModel with all fields listed in Data Model section
- [ ] Alembic migration for both tables
- [ ] `POST /api/projects` — create project
- [ ] `GET /api/projects` — list all projects (ordered by updated_at desc)
- [ ] `GET /api/projects/{project_id}` — project detail with meeting count
- [ ] `PATCH /api/projects/{project_id}` — update project fields
- [ ] `POST /api/projects/{project_id}/meetings` — create meeting (save transcript text)
- [ ] `GET /api/projects/{project_id}/meetings` — list meetings for project (ordered by meeting_time desc)
- [ ] `GET /api/projects/{project_id}/meetings/{meeting_id}` — meeting detail

### Frontend
- [ ] Next.js 14 App Router project scaffold
- [ ] Tailwind CSS + shadcn/ui installed and configured
- [ ] `lib/api.ts` — typed fetch wrapper pointing to `http://localhost:8000`
- [ ] `lib/types.ts` — TypeScript interfaces for Project and Meeting
- [ ] `/projects` page — project list with cards (Dashboard)
- [ ] `/projects/new` page — create project form
- [ ] `/projects/[projectId]` page — project detail (shows project info + meeting list)
- [ ] `/projects/[projectId]/meetings/new` page — meeting import form (textarea for transcript)
- [ ] `/projects/[projectId]/meetings/[meetingId]` page — meeting detail (shows transcript, analysis placeholder)
- [ ] Loading states on all data-fetching components
- [ ] Empty states when no projects / no meetings exist
- [ ] Basic error handling (show error message if API fails)

### Infrastructure
- [ ] `docker-compose.yml` with `db` service (PostgreSQL 15)
- [ ] `.env.example` with all required variables
- [ ] `backend/requirements.txt` with pinned versions
- [ ] `README.md` at project root with setup instructions

## 5. Out of Scope

Do NOT implement in this ticket:
- AI analysis (no OpenAI calls)
- Meeting analysis result display (just a placeholder)
- Project Q&A / chat
- Aggregated todos, risks, changes on project detail (placeholder sections only)
- File upload
- Authentication / login
- User accounts
- Task status editing
- Export (PDF/Word)
- Tencent / DingTalk / Feishu API

## 6. Existing Context to Read

Before coding, read:
- `CLAUDE.md`
- `AGENTS.md`
- `.ai/context/product-brief.md`
- `.ai/context/architecture.md`
- `.ai/context/roadmap.md`

## 7. Data Model Requirements

### Project

```python
class Project(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str                        # required, project name
    client_name: Optional[str]       # client / customer name
    description: Optional[str]       # project background
    current_stage: str = "需求确认"  # 需求确认 / 开发中 / 测试 / 验收 / 完成
    owner_name: Optional[str]        # project manager name
    goal: Optional[str]              # project objective
    acceptance_criteria: Optional[str]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

### Meeting

```python
class Meeting(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    project_id: uuid.UUID = Field(foreign_key="project.id")
    title: str                       # meeting title / topic
    platform: str = "manual"         # manual / tencent_meeting / dingtalk / feishu
    meeting_time: datetime           # when the meeting happened
    participants: Optional[str]      # comma-separated participant names
    agenda: Optional[str]            # meeting agenda / topics
    transcript_text: str             # the raw transcript content (required)
    analysis_status: str = "pending" # pending / processing / done / failed
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

## 8. API Requirements

### Response Envelope
All successful responses:
```json
{ "data": <payload>, "message": "ok" }
```
All errors use `HTTPException` with appropriate status codes.

### POST /api/projects
Request body:
```json
{
  "name": "string (required)",
  "client_name": "string (optional)",
  "description": "string (optional)",
  "current_stage": "string (default: 需求确认)",
  "owner_name": "string (optional)",
  "goal": "string (optional)",
  "acceptance_criteria": "string (optional)"
}
```
Response `data`: full Project object
Status: 201

### GET /api/projects
Response `data`: array of Project objects, ordered by `updated_at` desc
Each project should include a computed field: `meeting_count: int`

### GET /api/projects/{project_id}
Response `data`: Project object + `meeting_count`
404 if not found

### PATCH /api/projects/{project_id}
Request body: partial Project fields (any subset)
Response `data`: updated Project
404 if not found

### POST /api/projects/{project_id}/meetings
Request body:
```json
{
  "title": "string (required)",
  "platform": "manual | tencent_meeting | dingtalk | feishu",
  "meeting_time": "ISO datetime string (required)",
  "participants": "string (optional, comma-separated)",
  "agenda": "string (optional)",
  "transcript_text": "string (required)"
}
```
Response `data`: full Meeting object
Status: 201

### GET /api/projects/{project_id}/meetings
Response `data`: array of Meeting objects for this project, ordered by `meeting_time` desc

### GET /api/projects/{project_id}/meetings/{meeting_id}
Response `data`: Meeting object
404 if not found or wrong project

## 9. UI Requirements

### Global Layout
- Top navigation bar with: "ProjectRoom AI" logo (left), "新建项目" button (right)
- Main content area with max-width container (max-w-6xl, centered)
- Background: light gray (`bg-gray-50`)

### `/projects` — Project List (Dashboard)
- Page title: "项目空间"
- If no projects: empty state card with "还没有项目，点击新建项目开始" + button
- Project cards in a responsive grid (1 col mobile, 2 col md, 3 col lg)
- Each card shows:
  - Project name (bold, large)
  - Client name (if set, muted)
  - Current stage (badge/chip with color coding)
  - Owner name
  - Meeting count: "X 次会议"
  - Updated at: relative time ("2天前")
  - "查看详情" link button

### `/projects/new` — Create Project Form
- Form fields: 项目名称 (required), 客户名称, 项目描述, 当前阶段 (select), 负责人, 项目目标, 验收标准
- Submit button: "创建项目"
- On success: redirect to `/projects/{id}`
- On error: show inline error message

### `/projects/[projectId]` — Project Detail
- Header: project name, client name, stage badge, owner
- Tabs or sections:
  1. **概览** — project goal, description, acceptance criteria
  2. **会议记录** — list of meetings with title, date, platform, analysis status badge; "导入会议" button
  3. **任务清单** — placeholder section: "完成会议 AI 分析后自动汇总" (disabled/grayed out)
  4. **风险台账** — placeholder section
  5. **需求变更** — placeholder section
  6. **决策记录** — placeholder section
- "项目问答" entry point button (disabled in this ticket)

### `/projects/[projectId]/meetings/new` — Meeting Import Form
- Form fields:
  - 会议主题 (required)
  - 会议时间 (datetime picker, required)
  - 会议平台 (select: 手动输入 / 腾讯会议 / 钉钉会议 / 飞书妙记)
  - 参会人 (text, comma-separated hint)
  - 会议议题 (textarea, optional)
  - 会议转写内容 (large textarea, required, placeholder: "请粘贴会议转写文本…")
- Submit button: "保存会议记录"
- On success: redirect to `/projects/{projectId}/meetings/{meetingId}`

### `/projects/[projectId]/meetings/[meetingId]` — Meeting Detail
- Header: meeting title, date, platform badge, participants
- Section: "会议转写内容" — display transcript text (scrollable, monospace-ish)
- Section: "AI 分析结果" — placeholder card: "点击开始 AI 分析，自动提取任务、风险、需求变更和决策" with a disabled "开始 AI 分析" button (will be wired in TICKET-002)
- Link back to project detail

## 10. AI Analysis Requirements

**Not applicable for this ticket.** Do not call OpenAI. The "开始 AI 分析" button on the meeting detail page should be visible but disabled (or show "即将开放").

## 11. Acceptance Criteria

- [ ] `docker-compose up -d db` starts PostgreSQL successfully
- [ ] `alembic upgrade head` creates `project` and `meeting` tables without error
- [ ] `POST /api/projects` creates a project and returns it with 201
- [ ] `GET /api/projects` returns a list including `meeting_count`
- [ ] `GET /api/projects/{id}` returns project detail, 404 for missing id
- [ ] `POST /api/projects/{id}/meetings` creates a meeting with transcript text
- [ ] `GET /api/projects/{id}/meetings` returns meetings for that project only
- [ ] Frontend project list page loads and shows empty state when no projects
- [ ] User can fill the create-project form and see new project appear in list
- [ ] User can navigate to project detail and see project info + empty meeting list
- [ ] User can fill the meeting import form (paste transcript) and save
- [ ] Saved meeting appears in the project detail meeting list
- [ ] Clicking a meeting opens the meeting detail page with transcript visible
- [ ] All pages have loading spinners while fetching
- [ ] All pages show an error message if the API returns an error
- [ ] `.env.example` documents all required env variables
- [ ] `README.md` has working setup instructions

## 12. Deliverables

After completing this task, create:

**`.ai/reports/TICKET-001-codex-report.md`**

Report must include:
1. Task file used
2. Completed work summary
3. All files created or modified (with paths)
4. All APIs implemented (method + path + brief description)
5. All UI pages implemented
6. How to run locally (exact commands)
7. How to test (curl examples or pytest commands)
8. Known issues or limitations
9. Questions or decisions that need Claude review
