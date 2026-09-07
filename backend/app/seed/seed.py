"""Seed runner: idempotently populate the SQLite database with realistic
demo meetings. Designed to run either via lifespan (SEED_ON_START=true)
or via `python -m seed.seed`.

Idempotency strategy: every meeting has a stable `key` derived from its
title. We attempt to match by title; if it already exists, we skip.
This avoids duplicating rows across re-seeds.
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta

from sqlalchemy.orm import Session as SqlaSession

from app.core.config import settings
from app.core.db import Base, SessionLocal
from app.core.logging import get_logger
from app.models import (
    ActionItem,
    Meeting,
    MeetingParticipant,
    Participant,
    Summary,
    SummarySection,
    TranscriptSegment,
    User,
)
from app.parsers import coalesce_end_times, parse_transcript
from app.repositories import ParticipantRepository
from app.seed.data import ALL_MEETINGS, MeetingSpec, SegmentSpec

log = get_logger(__name__)


def _now() -> datetime:
    # All seed timestamps are anchored to a fixed reference date so the
    # seed output is deterministic across runs and the demo always shows
    # the same "Today / Yesterday / Last 7 days" distribution.
    return datetime(2026, 9, 7, 13, 25, 0)


def _ensure_user(db: SqlaSession) -> User:
    user = db.query(User).first()
    if user is not None:
        return user
    user = User(name=settings.default_user_name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _ensure_participant(db: SqlaSession, name: str) -> Participant:
    repo = ParticipantRepository(db)
    existing = repo.get_by_name_ci(name)
    if existing is not None:
        return existing
    return repo.create(name=name)


def _meeting_exists_by_title(db: SqlaSession, title: str) -> bool:
    return db.query(Meeting).filter(Meeting.title == title).first() is not None


def _meeting_has_segments(db: SqlaSession, meeting_id: int) -> bool:
    from app.models import TranscriptSegment
    return db.query(TranscriptSegment).filter(TranscriptSegment.meeting_id == meeting_id).count() > 0


def _create_segments_for_meeting(
    db: SqlaSession,
    meeting: Meeting,
    segments: list[SegmentSpec],
) -> None:
    def fmt(seconds: int) -> str:
        h = seconds // 3600
        m = (seconds % 3600) // 60
        s = seconds % 60
        return f"{h:02d}:{m:02d}:{s:02d}"

    body = "\n".join(
        f"{fmt(s.start_seconds)} {s.speaker}: {s.text}" for s in segments
    )
    try:
        parsed = parse_transcript("txt", body)
    except ValueError as e:
        log.warning("Seed transcript parse error for meeting '%s': %s", meeting.title, e)
        return
    parsed = coalesce_end_times(parsed)
    for idx, seg in enumerate(parsed, start=1):
        db.add(
            TranscriptSegment(
                meeting_id=meeting.id,
                speaker_name=seg.speaker_name,
                speaker_key=seg.speaker_key,
                start_time=seg.start_time,
                end_time=max(seg.end_time, seg.start_time),
                text=seg.text,
                sequence=idx,
            )
        )
    db.commit()


def _create_summary(db: SqlaSession, spec: MeetingSpec, meeting: Meeting) -> None:
    summary = Summary(
        meeting_id=meeting.id,
        overview=spec.overview,
        key_points=json.dumps(spec.key_points),
        decisions=json.dumps(spec.decisions),
    )
    db.add(summary)
    db.commit()


def _create_sections(db: SqlaSession, spec: MeetingSpec, meeting: Meeting) -> None:
    for sec in spec.sections:
        db.add(
            SummarySection(
                meeting_id=meeting.id,
                heading=sec.heading,
                subheading=None,
                body=sec.body,
                sequence=sec.sequence,
            )
        )
    db.commit()


def _create_action_items(db: SqlaSession, spec: MeetingSpec, meeting: Meeting) -> None:
    for item in spec.action_items:
        completed_at = datetime.utcnow() if item.completed else None
        due_date_value = (
            datetime.strptime(item.due_date, "%Y-%m-%d").date()
            if item.due_date
            else None
        )
        db.add(
            ActionItem(
                meeting_id=meeting.id,
                title=item.title,
                assignee=item.assignee,
                due_date=due_date_value,
                completed=1 if item.completed else 0,
                completed_at=completed_at,
            )
        )
    db.commit()


def _create_participants(db: SqlaSession, spec: MeetingSpec, meeting: Meeting) -> None:
    for name in spec.participants:
        p = _ensure_participant(db, name)
        role = "host" if name.lower() == spec.host.lower() else "attendee"
        db.add(
            MeetingParticipant(
                meeting_id=meeting.id,
                participant_id=p.id,
                role=role,
            )
        )
    db.commit()


def _create_meeting(db: SqlaSession, user: User, spec: MeetingSpec) -> Meeting:
    anchor = _now()
    starts_at = anchor - timedelta(days=spec.days_ago)
    starts_at = starts_at.replace(hour=spec.hour, minute=0, second=0, microsecond=0)
    meeting = Meeting(
        user_id=user.id,
        title=spec.title,
        starts_at=starts_at,
        duration_seconds=spec.duration_minutes * 60,
        host=spec.host,
        channel=spec.channel,
        capture_source=spec.capture_source,
        language=spec.language,
        media_url="/audio/sample.wav",
        bookmarked=1 if spec.bookmarked else 0,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting


def seed_database(db: SqlaSession | None = None) -> dict:
    """Idempotently seed the database. Returns a small summary dict."""
    owns_db = db is None
    if owns_db:
        Base.metadata.create_all(SessionLocal().get_bind())
        db = SessionLocal()
    try:
        user = _ensure_user(db)
        created = 0
        skipped = 0
        repaired = 0
        for spec in ALL_MEETINGS:
            existing = db.query(Meeting).filter(Meeting.title == spec.title).first()
            if existing is None:
                meeting = _create_meeting(db, user, spec)
                _create_participants(db, spec, meeting)
                _create_segments_for_meeting(db, meeting, spec.segments)
                _create_summary(db, spec, meeting)
                _create_sections(db, spec, meeting)
                _create_action_items(db, spec, meeting)
                created += 1
                continue
            # Meeting exists but may be missing nested rows from a partial
            # earlier seed (e.g., parser bug). Backfill them.
            if not _meeting_has_segments(db, existing.id):
                _create_segments_for_meeting(db, existing, spec.segments)
                _create_summary(db, spec, existing)
                _create_sections(db, spec, existing)
                _create_action_items(db, spec, existing)
                repaired += 1
            else:
                skipped += 1
        db.commit()
        log.info(
            "Seed complete: created=%d repaired=%d skipped=%d total=%d",
            created,
            repaired,
            skipped,
            len(ALL_MEETINGS),
        )
        return {
            "created": created,
            "repaired": repaired,
            "skipped": skipped,
            "total": len(ALL_MEETINGS),
        }
    finally:
        if owns_db:
            db.close()


if __name__ == "__main__":
    seed_database()