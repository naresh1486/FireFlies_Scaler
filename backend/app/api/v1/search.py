"""Search endpoint."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_db
from app.models import Meeting, MeetingParticipant, Participant, TranscriptSegment
from app.schemas import (
    MeetingSearchHit,
    SearchResult,
    TranscriptSearchHit,
)

router = APIRouter(prefix="/search", tags=["search"])


def _mark(text: str, q: str) -> str:
    lower = text.lower()
    ql = q.lower()
    i = lower.find(ql)
    if i < 0:
        return text
    return text[:i] + "<mark>" + text[i : i + len(ql)] + "</mark>" + text[i + len(ql) :]


@router.get("", response_model=SearchResult)
def search(
    q: str = Query(min_length=1, max_length=200),
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
) -> SearchResult:
    like = f"%{q.lower()}%"

    # Meetings: title OR participant name
    participant_match = (
        select(Meeting.id)
        .join(Meeting.participants)
        .join(Participant)
        .where(func.lower(Participant.name).like(like))
    )
    meeting_stmt = (
        select(Meeting)
        .where(
            or_(
                func.lower(Meeting.title).like(like),
                Meeting.id.in_(participant_match),
            )
        )
        .options(selectinload(Meeting.participants).selectinload(MeetingParticipant.participant))
        .order_by(Meeting.starts_at.desc())
        .limit(limit)
    )
    meetings = list(db.execute(meeting_stmt).unique().scalars())

    meeting_hits = [
        MeetingSearchHit(
            id=m.id,
            title=m.title,
            starts_at=m.starts_at,
            snippet=_mark(m.title, q),
        )
        for m in meetings
    ]

    # Transcript hits
    seg_stmt = (
        select(TranscriptSegment, Meeting.title)
        .join(Meeting, Meeting.id == TranscriptSegment.meeting_id)
        .where(func.lower(TranscriptSegment.text).like(like))
        .order_by(TranscriptSegment.meeting_id.desc(), TranscriptSegment.start_time.asc())
        .limit(limit)
    )
    seg_hits: list[TranscriptSearchHit] = []
    for seg, m_title in db.execute(seg_stmt).all():
        seg_hits.append(
            TranscriptSearchHit(
                meeting_id=seg.meeting_id,
                meeting_title=m_title,
                segment_id=seg.id,
                speaker_name=seg.speaker_name,
                start_time=seg.start_time,
                snippet=_mark(seg.text, q),
            )
        )

    return SearchResult(meetings=meeting_hits, transcript_hits=seg_hits)