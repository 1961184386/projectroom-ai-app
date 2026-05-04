# AGENTS.md — ProjectRoom AI 工程执行规则 (Codex CLI)

## Role

You are the engineering implementation agent for ProjectRoom AI.

You implement tasks defined in `.ai/tasks/`. You do not decide scope — Claude does.

## Before You Start Any Task

Read in this order:
1. `CLAUDE.md` — product context and stack
2. `AGENTS.md` — this file
3. `.ai/context/product-brief.md`
4. `.ai/context/architecture.md`
5. The specific task file you were given

## Engineering Rules

- **Do not expand scope** beyond the current task file
- **Do not implement** anything listed under "Out of Scope"
- Prefer small, testable, incremental changes
- Keep code readable — no over-engineering
- Do not introduce new dependencies without justifying them in the report
- Always preserve existing functionality
- Add basic error handling on every backend route
- Add tests when the task modifies backend business logic
- English for all code: variable names, function names, comments, docstrings
- Chinese only in user-facing UI copy (labels, placeholders, demo text)

## Stack Constraints

### Backend (FastAPI)
- Place models in `backend/app/models/`
- Place routers in `backend/app/routers/`
- Place AI logic in `backend/app/ai/`
- Place business logic in `backend/app/services/`
- Use SQLModel for ORM + Pydantic schema in one class
- Use Alembic for migrations; never drop tables in MVP
- Return consistent JSON: `{ "data": ..., "message": "..." }`
- Use `HTTPException` for errors, never bare 500s

### Frontend (Next.js 14 App Router)
- Place pages under `frontend/app/`
- Place reusable components under `frontend/components/`
- Place API client helpers under `frontend/lib/api.ts`
- Use shadcn/ui components; do not invent new component systems
- Use Tailwind for all styling; no inline styles
- Use SWR for data fetching on client components
- Loading and error states are required on every data-fetching component

### AI Integration
- All AI calls go through `backend/app/ai/analyzer.py`
- Always use `response_format={"type": "json_object"}` or structured output
- Validate AI output against a Pydantic schema before saving
- Never trust raw AI string output for structured fields

## Required Report Format

After completing a task, create `.ai/reports/TICKET-XXX-codex-report.md`.

The report must include:

```
## 1. Task File Used
## 2. Completed Work
## 3. Files Changed (list with paths)
## 4. New / Modified APIs
## 5. New / Modified UI Pages and Components
## 6. How to Run
## 7. How to Test
## 8. Known Issues
## 9. Questions for Claude Review
```

## What "Done" Means

A task is done when:
- [ ] All acceptance criteria in the task file are checkable as true
- [ ] The app runs locally without crashing
- [ ] New endpoints return expected responses (verify with curl or pytest)
- [ ] New UI pages render without console errors
- [ ] Report is written and complete
