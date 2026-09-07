"""Repositories."""

from __future__ import annotations

import json

from sqlalchemy import delete, exists, func, or_, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models import (
    ActionItem,
    Meeting,
    MeetingParticipant,
    Participant,
    Summary,
    SummarySection,
    TranscriptSegment,
    User as UserModel,
)


class UserRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_first(self) -> UserModel | None:
        return self.db.query(UserModel).first()

    def create(self, *, name: str, avatar_url: str | None = None) -> UserModel:
        user = UserModel(name=name, avatar_url=avatar_url)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user


class ParticipantRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, participant_id: int) -> Participant | None:
        return self.db.get(Participant, participant_id)

    def get_by_name_ci(self, name: str) -> Participant | None:
        return (
            self.db.query(Participant)
            .filter(func.lower(Participant.name) == name.lower())
            .one_or_none()
        )

    def create(self, *, name: str, email: str | None = None, avatar_url: str | None = None) -> Participant:
        p = Participant(name=name, email=email, avatar_url=avatar_url)
        self.db.add(p)
        self.db.commit()
        self.db.refresh(p)
        return p

    def upsert_by_name(self, name: str) -> Participant:
        existing = self.get_by_name_ci(name)
        if existing:
            return existing
        return self.create(name=name)

    def list(self, *, q: str | None, page: int, page_size: int) -> tuple[list[Participant], int]:
        stmt = select(Participant)
        count_stmt = select(func.count(Participant.id))
        if q:
            like = f"%{q.lower()}%"
            cond = or_(
                func.lower(Participant.name).like(like),
                func.lower(func.coalesce(Participant.email, "")).like(like),
            )
            stmt = stmt.where(cond)
            count_stmt = count_stmt.where(cond)
        total = int(self.db.execute(count_stmt).scalar_one())
        stmt = (
            stmt.order_by(func.lower(Participant.name).asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        items = list(self.db.execute(stmt).scalars())
        return items, total


class MeetingRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, meeting_id: int) -> Meeting | None:
        stmt = (
            select(Meeting)
            .where(Meeting.id == meeting_id)
            .options(
                selectinload(Meeting.participants).selectinload(MeetingParticipant.participant),
                selectinload(Meeting.summary),
                selectinload(Meeting.sections),
            )
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def get_segments(self, meeting_id: int) -> list[TranscriptSegment]:
        stmt = (
            select(TranscriptSegment)
            .where(TranscriptSegment.meeting_id == meeting_id)
            .order_by(TranscriptSegment.sequence.asc())
        )
        return list(self.db.execute(stmt).scalars())

    def create(self, meeting: Meeting) -> Meeting:
        self.db.add(meeting)
        self.db.commit()
        self.db.refresh(meeting)
        return meeting

    def delete(self, meeting: Meeting) -> None:
        self.db.delete(meeting)
        self.db.commit()

    def update(self, meeting: Meeting) -> Meeting:
        self.db.commit()
        self.db.refresh(meeting)
        return meeting

    def set_participants(self, meeting: Meeting, names: list[str]) -> None:
        self.db.execute(delete(MeetingParticipant).where(MeetingParticipant.meeting_id == meeting.id))
        for name in names:
            existing = (
                self.db.query(Participant)
                .filter(func.lower(Participant.name) == name.lower())
                .one_or_none()
            )
            if existing is None:
                existing = Participant(name=name)
                self.db.add(existing)
                self.db.flush()
            role = "host" if name.lower() == meeting.host.lower() else "attendee"
            link = MeetingParticipant(
                meeting_id=meeting.id, participant_id=existing.id, role=role
            )
            self.db.add(link)
        self.db.commit()


class SummaryRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_for_meeting(self, meeting_id: int) -> Summary | None:
        return self.db.query(Summary).filter(Summary.meeting_id == meeting_id).one_or_none()

    def upsert(
        self,
        meeting_id: int,
        *,
        overview: str,
        key_points: list[str],
        decisions: list[str],
    ) -> Summary:
        existing = self.get_for_meeting(meeting_id)
        if existing:
            existing.overview = overview
            existing.key_points = json.dumps(key_points)
            existing.decisions = json.dumps(decisions)
            self.db.commit()
            self.db.refresh(existing)
            return existing
        summary = Summary(
            meeting_id=meeting_id,
            overview=overview,
            key_points=json.dumps(key_points),
            decisions=json.dumps(decisions),
        )
        self.db.add(summary)
        self.db.commit()
        self.db.refresh(summary)
        return summary


class NotesSectionRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_for_meeting(self, meeting_id: int) -> list[SummarySection]:
        stmt = (
            select(SummarySection)
            .where(SummarySection.meeting_id == meeting_id)
            .order_by(SummarySection.sequence.asc())
        )
        return list(self.db.execute(stmt).scalars())


class ActionItemRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_for_meeting(self, meeting_id: int) -> list[ActionItem]:
        stmt = (
            select(ActionItem)
            .where(ActionItem.meeting_id == meeting_id)
            .order_by(ActionItem.completed.asc(), ActionItem.id.asc())
        )
        return list(self.db.execute(stmt).scalars())

    def get(self, item_id: int) -> ActionItem | None:
        return self.db.get(ActionItem, item_id)

    def create(self, item: ActionItem) -> ActionItem:
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def update(self, item: ActionItem) -> ActionItem:
        self.db.commit()
        self.db.refresh(item)
        return item

    def delete(self, item: ActionItem) -> None:
        self.db.delete(item)
        self.db.commit()