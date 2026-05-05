from app.routers.aggregation import router as aggregation_router
from app.routers.analysis import router as analysis_router
from app.routers.meetings import router as meetings_router
from app.routers.projects import router as projects_router

__all__ = ["aggregation_router", "analysis_router", "meetings_router", "projects_router"]
