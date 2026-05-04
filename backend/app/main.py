from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import create_db_and_tables
from app.routers.meetings import router as meetings_router
from app.routers.projects import router as projects_router

settings = get_settings()

app = FastAPI(title="ProjectRoom AI API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    if settings.database_url.startswith("sqlite"):
        create_db_and_tables()


@app.get("/health")
def health_check():
    return {"data": {"status": "ok"}, "message": "ok"}


app.include_router(projects_router)
app.include_router(meetings_router)
