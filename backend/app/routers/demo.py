from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.database import get_session
from scripts.seed_demo import PROJECT_NAME, project_exists, seed_demo_data

router = APIRouter(prefix="/api/demo", tags=["demo"])


@router.get("/status")
def get_demo_status_endpoint(session: Session = Depends(get_session)):
    try:
        return {
            "data": {
                "seeded": project_exists(session),
                "project_name": PROJECT_NAME,
            },
            "message": "ok",
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check demo status.",
        ) from exc


@router.post("/seed")
def seed_demo_endpoint(session: Session = Depends(get_session)):
    try:
        seeded, project = seed_demo_data(session)
        return {
            "data": {
                "seeded": seeded,
                "project_id": str(project.id),
                "project_name": project.name,
            },
            "message": "ok",
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to seed demo data.",
        ) from exc
