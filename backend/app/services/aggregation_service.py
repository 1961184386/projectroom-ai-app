from datetime import datetime
from uuid import UUID

from pydantic import BaseModel
from sqlmodel import Session, select

from app.ai.schemas import ActionItem, KeyDecision, RequirementChange, Risk
from app.models.analysis import MeetingAnalysis
from app.models.meeting import Meeting


class AggregatedTodo(BaseModel):
    meeting_id: UUID
    meeting_title: str
    meeting_time: datetime
    task: str
    owner: str = ""
    deadline: str = ""
    priority: str = "medium"
    status: str = "pending"
    evidence: str = ""


class AggregatedRisk(BaseModel):
    meeting_id: UUID
    meeting_title: str
    meeting_time: datetime
    risk: str
    level: str = "medium"
    suggestion: str = ""
    evidence: str = ""


class AggregatedChange(BaseModel):
    meeting_id: UUID
    meeting_title: str
    meeting_time: datetime
    change: str
    type: str = "unclear"
    impact_on_scope: str = ""
    need_confirmation: bool = True
    evidence: str = ""


class AggregatedDecision(BaseModel):
    meeting_id: UUID
    meeting_title: str
    meeting_time: datetime
    decision: str
    owner: str = ""
    impact: str = ""
    evidence: str = ""


def _list_project_analysis_rows(session: Session, project_id: UUID) -> list[tuple[Meeting, MeetingAnalysis]]:
    statement = (
        select(Meeting, MeetingAnalysis)
        .join(MeetingAnalysis, MeetingAnalysis.meeting_id == Meeting.id)
        .where(Meeting.project_id == project_id)
        .order_by(Meeting.meeting_time.desc())
    )
    return list(session.exec(statement).all())


def list_project_todos(session: Session, project_id: UUID) -> list[AggregatedTodo]:
    items: list[AggregatedTodo] = []
    for meeting, analysis in _list_project_analysis_rows(session, project_id):
        for action_item in analysis.action_items:
            payload = ActionItem.model_validate(action_item)
            items.append(
                AggregatedTodo(
                    meeting_id=meeting.id,
                    meeting_title=meeting.title,
                    meeting_time=meeting.meeting_time,
                    **payload.model_dump(),
                )
            )
    return items


def list_project_risks(session: Session, project_id: UUID) -> list[AggregatedRisk]:
    items: list[AggregatedRisk] = []
    for meeting, analysis in _list_project_analysis_rows(session, project_id):
        for risk in analysis.risks:
            payload = Risk.model_validate(risk)
            items.append(
                AggregatedRisk(
                    meeting_id=meeting.id,
                    meeting_title=meeting.title,
                    meeting_time=meeting.meeting_time,
                    **payload.model_dump(),
                )
            )
    return items


def list_project_changes(session: Session, project_id: UUID) -> list[AggregatedChange]:
    items: list[AggregatedChange] = []
    for meeting, analysis in _list_project_analysis_rows(session, project_id):
        for change in analysis.requirement_changes:
            payload = RequirementChange.model_validate(change)
            items.append(
                AggregatedChange(
                    meeting_id=meeting.id,
                    meeting_title=meeting.title,
                    meeting_time=meeting.meeting_time,
                    **payload.model_dump(),
                )
            )
    return items


def list_project_decisions(session: Session, project_id: UUID) -> list[AggregatedDecision]:
    items: list[AggregatedDecision] = []
    for meeting, analysis in _list_project_analysis_rows(session, project_id):
        for decision in analysis.key_decisions:
            payload = KeyDecision.model_validate(decision)
            items.append(
                AggregatedDecision(
                    meeting_id=meeting.id,
                    meeting_title=meeting.title,
                    meeting_time=meeting.meeting_time,
                    **payload.model_dump(),
                )
            )
    return items
