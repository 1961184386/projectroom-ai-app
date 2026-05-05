from pydantic import BaseModel
from sqlmodel import Session, func, select

from app.models.analysis import MeetingAnalysis
from app.models.meeting import Meeting
from app.models.project import Project


class DashboardStats(BaseModel):
    total_projects: int
    total_meetings: int
    pending_action_items: int
    active_risks: int


def get_dashboard_stats(session: Session) -> DashboardStats:
    total_projects = session.exec(select(func.count(Project.id))).one()
    total_meetings = session.exec(select(func.count(Meeting.id))).one()
    analysis_rows = session.exec(select(MeetingAnalysis.action_items, MeetingAnalysis.risks)).all()

    pending_action_items = 0
    active_risks = 0
    for action_items, risks in analysis_rows:
        pending_action_items += sum(1 for item in action_items or [] if item.get("status", "pending") == "pending")
        active_risks += len(risks or [])

    return DashboardStats(
        total_projects=total_projects,
        total_meetings=total_meetings,
        pending_action_items=pending_action_items,
        active_risks=active_risks,
    )
