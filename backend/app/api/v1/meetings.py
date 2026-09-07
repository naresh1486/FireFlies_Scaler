"""Meetings endpoints (Phase 6: includes summary, notes, action items)."""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models import User
from app.schemas import (
    ActionItemCreate,
    ActionItemListResponse,
    ActionItemRead,
    ActionItemUpdate,
    ChaptersRead,
    MeetingCreate,
    MeetingListResponse,
    MeetingRead,
    MeetingUpdate,
    NotesRead,
    SortOption,
    SummaryRead,
    TopicsRead,
    TranscriptRead,
    TranscriptSegmentRead,
)
from app.services import (
    ActionItemService,
    MeetingService,
    NotesService,
    SummaryService,
)

router = APIRouter(prefix="/meetings", tags=["meetings"])


def _default_user_id(db: Session) -> int:
    user = db.query(User).first()
    if user is None:
        from app.core.errors import NotFoundError
        raise NotFoundError("Default user not seeded")
    return user.id


@router.get("", response_model=MeetingListResponse)
def list_meetings(
    q: str | None = Query(default=None, max_length=200),
    channel: str | None = Query(default=None),
    hosted_by_me: bool = Query(default=False),
    shared_with_me: bool = Query(default=False),
    bookmarked: bool | None = Query(default=None),
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    duration_min: int | None = Query(default=None, ge=0),
    duration_max: int | None = Query(default=None, ge=0),
    capture_source: str | None = Query(default=None),
    sort: SortOption = Query(default=SortOption.recent),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> MeetingListResponse:
    return MeetingService(db, default_user_id=_default_user_id(db)).list(
        q=q,
        channel=channel,
        hosted_by_me=hosted_by_me,
        shared_with_me=shared_with_me,
        bookmarked=bookmarked,
        date_from=date_from,
        date_to=date_to,
        duration_min=duration_min,
        duration_max=duration_max,
        capture_source=capture_source,
        sort=sort,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=MeetingRead, status_code=status.HTTP_201_CREATED)
def create_meeting(
    payload: MeetingCreate,
    db: Session = Depends(get_db),
) -> MeetingRead:
    return MeetingService(db, default_user_id=_default_user_id(db)).create(payload)


@router.get("/{meeting_id}", response_model=MeetingRead)
def get_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
) -> MeetingRead:
    return MeetingService(db, default_user_id=_default_user_id(db)).get(meeting_id)


@router.patch("/{meeting_id}", response_model=MeetingRead)
def update_meeting(
    meeting_id: int,
    payload: MeetingUpdate,
    db: Session = Depends(get_db),
) -> MeetingRead:
    return MeetingService(db, default_user_id=_default_user_id(db)).update(meeting_id, payload)


@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
) -> Response:
    MeetingService(db, default_user_id=_default_user_id(db)).delete(meeting_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{meeting_id}/transcript", response_model=TranscriptRead)
def get_transcript(
    meeting_id: int,
    db: Session = Depends(get_db),
) -> TranscriptRead:
    segments = MeetingService(db, default_user_id=_default_user_id(db)).get_segments(meeting_id)
    return TranscriptRead(
        meeting_id=meeting_id,
        segments=[TranscriptSegmentRead.model_validate(s) for s in segments],
    )


@router.get("/{meeting_id}/summary", response_model=SummaryRead)
def get_summary(
    meeting_id: int,
    db: Session = Depends(get_db),
) -> SummaryRead:
    return SummaryService(db).get(meeting_id)


@router.get("/{meeting_id}/notes", response_model=NotesRead)
def get_notes(
    meeting_id: int,
    db: Session = Depends(get_db),
) -> NotesRead:
    return NotesService(db).list(meeting_id)


@router.get("/{meeting_id}/topics", response_model=TopicsRead)
def get_topics(
    meeting_id: int,
    db: Session = Depends(get_db),
) -> TopicsRead:
    return NotesService(db).topics(meeting_id)


@router.get("/{meeting_id}/chapters", response_model=ChaptersRead)
def get_chapters(
    meeting_id: int,
    db: Session = Depends(get_db),
) -> ChaptersRead:
    return NotesService(db).chapters(meeting_id)


@router.get("/{meeting_id}/action-items", response_model=ActionItemListResponse)
def list_action_items(
    meeting_id: int,
    db: Session = Depends(get_db),
) -> ActionItemListResponse:
    return ActionItemService(db).list_for_meeting(meeting_id)


@router.post(
    "/{meeting_id}/action-items",
    response_model=ActionItemRead,
    status_code=status.HTTP_201_CREATED,
)
def create_action_item(
    meeting_id: int,
    payload: ActionItemCreate,
    db: Session = Depends(get_db),
) -> ActionItemRead:
    return ActionItemService(db).create(meeting_id, payload)