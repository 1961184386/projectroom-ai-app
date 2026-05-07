from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import create_db_and_tables
from app.routers.aggregation import router as aggregation_router
from app.routers.analysis import router as analysis_router
from app.routers.auth import router as auth_router
from app.routers.chat import router as chat_router
from app.routers.dashboard import router as dashboard_router
from app.routers.demo import router as demo_router
from app.routers.integrations import router as integrations_router
from app.routers.materials import router as materials_router
from app.routers.meetings import router as meetings_router
from app.routers.projects import router as projects_router
from app.routers.summary import router as summary_router
from app.routers.transcript_fetch import router as transcript_fetch_router
from app.routers.webhooks import router as webhooks_router

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.database_url.startswith("sqlite"):
        create_db_and_tables()
    yield


app = FastAPI(title="ProjectRoom AI API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"data": {"status": "ok"}, "message": "ok"}


app.include_router(projects_router)
app.include_router(meetings_router)
app.include_router(analysis_router)
app.include_router(auth_router)
app.include_router(aggregation_router)
app.include_router(chat_router)
app.include_router(summary_router)
app.include_router(materials_router)
app.include_router(dashboard_router)
app.include_router(demo_router)
app.include_router(integrations_router)
app.include_router(webhooks_router)
app.include_router(transcript_fetch_router)
