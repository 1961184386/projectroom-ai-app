# ProjectRoom AI

面向项目交付场景的 AI 会议工作空间。当前已完成 `TICKET-001` 所需的项目与会议基础链路：项目创建、项目列表、项目详情、会议导入、会议详情，以及对应 FastAPI API。

## Environment

- Node.js 18+
- Python 3.11+
- Docker & Docker Compose（可选，用于 PostgreSQL）

## Setup

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Choose one database mode:

PostgreSQL via Docker:

```bash
docker-compose up -d db
```

SQLite fallback for local demo:

Set `DATABASE_URL=sqlite:///./projectroom.db` in `.env`.

## Run Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Backend: `http://localhost:8000`  
Docs: `http://localhost:8000/docs`

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:3000`

If needed, configure `NEXT_PUBLIC_API_BASE_URL` in `frontend/.env.local`. The default is `http://localhost:8000`.

## Test

Backend tests:

```bash
cd backend
pytest
```

Quick API smoke examples:

```bash
curl -X POST http://localhost:8000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo Project","current_stage":"需求确认"}'

curl http://localhost:8000/api/projects
```

## Scope Notes

- AI analysis, project chat, and aggregated action/risk/change/decision data are intentionally placeholders in this phase.
- PostgreSQL remains supported; SQLite fallback is available for no-Docker local demos.
