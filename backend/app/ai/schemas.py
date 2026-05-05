from typing import Literal

from pydantic import BaseModel, Field


class KeyDecision(BaseModel):
    decision: str
    owner: str = ""
    impact: str = ""
    evidence: str = ""


class ActionItem(BaseModel):
    task: str
    owner: str = ""
    deadline: str = ""
    priority: Literal["high", "medium", "low"] = "medium"
    status: str = "pending"
    evidence: str = ""


class RequirementChange(BaseModel):
    change: str
    type: Literal["new", "modified", "removed", "unclear"] = "unclear"
    impact_on_scope: str = ""
    need_confirmation: bool = True
    evidence: str = ""


class Risk(BaseModel):
    risk: str
    level: Literal["high", "medium", "low"] = "medium"
    suggestion: str = ""
    evidence: str = ""


class OpenQuestion(BaseModel):
    question: str
    owner: str = ""
    reason: str = ""


class AnalysisResult(BaseModel):
    meeting_summary: str
    key_decisions: list[KeyDecision] = Field(default_factory=list)
    action_items: list[ActionItem] = Field(default_factory=list)
    requirement_changes: list[RequirementChange] = Field(default_factory=list)
    risks: list[Risk] = Field(default_factory=list)
    open_questions: list[OpenQuestion] = Field(default_factory=list)
    next_meeting_topics: list[str] = Field(default_factory=list)
