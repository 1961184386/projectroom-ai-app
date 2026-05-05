from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlmodel import Session

from app.database import get_session
from app.services.chat_service import ChatResponse, ask_project_question


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1000)


router = APIRouter(prefix="/api/projects", tags=["chat"])


@router.post("/{project_id}/chat")
def ask_project_question_endpoint(
    project_id: UUID,
    payload: ChatRequest,
    session: Session = Depends(get_session),
):
    try:
        response = ask_project_question(session, project_id, payload.question)
        if response is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
        return {"data": ChatResponse.model_validate(response), "message": "ok"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Project chat failed.",
        ) from exc
