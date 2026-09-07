"""Participant endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Query

from app.api.deps import get_db
from app.schemas import ParticipantCreate, ParticipantListResponse
from app.services import ParticipantService
from sqlalchemy.orm import Session
from fastapi import Depends

router = APIRouter(prefix="/participants", tags=["participants"])


@router.get("", response_model=ParticipantListResponse)
def list_participants(
    q: str | None = Query(default=None, max_length=200),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> ParticipantListResponse:
    return ParticipantService(db).list(q=q, page=page, page_size=page_size)


@router.post("", response_model=ParticipantCreate, status_code=201)
def create_participant(
    payload: ParticipantCreate,
    db: Session = Depends(get_db),
) -> ParticipantCreate:
    return ParticipantService(db).create(payload)