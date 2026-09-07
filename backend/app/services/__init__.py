"""Services for participants, meetings, summaries, notes, and action items."""

from __future__ import annotations

import json
import re
from datetime import datetime

from sqlalchemy.orm import Session, selectinload

from app.core.errors import ConflictError, NotFoundError, ValidationError
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
from app.parsers import ParsedSegment, coalesce_end_times, parse_transcript
from app.repositories import (
    ActionItemRepository,
    MeetingRepository,
    NotesSectionRepository,
    ParticipantRepository,
    SummaryRepository,
    UserRepository,
)
from app.schemas import (
    ActionItemCreate,
    ActionItemInput,
    ActionItemListResponse,
    ActionItemRead,
    ActionItemUpdate,
    ChapterRead,
    ChaptersRead,
    MeetingCreate,
    MeetingListResponse,
    MeetingRead,
    MeetingUpdate,
    NotesRead,
    NotesSectionInput,
    ParticipantCreate,
    ParticipantListResponse,
    ParticipantRead,
    SortOption,
    SummaryInput,
    SummaryRead,
    SummarySectionRead,
    TopicRead,
    TopicsRead,
    TranscriptInput,
)


def _serialize_participants(meeting: Meeting) -> list[dict]:
    out: list[dict] = []
    for link in meeting.participants:
        p = link.participant
        out.append(
            {
                "id": p.id,
                "name": p.name,
                "email": p.email,
                "avatar_url": p.avatar_url,
                "role": link.role,
            }
        )
    return out


def meeting_to_read(meeting: Meeting) -> MeetingRead:
    return MeetingRead(
        id=meeting.id,
        title=meeting.title,
        starts_at=meeting.starts_at,
        duration_seconds=meeting.duration_seconds,
        host=meeting.host,
        channel=meeting.channel,
        capture_source=meeting.capture_source,
        language=meeting.language,
        media_url=meeting.media_url,
        bookmarked=bool(meeting.bookmarked),
        participants=_serialize_participants(meeting),
        created_at=meeting.created_at,
        updated_at=meeting.updated_at,
    )


class ParticipantService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = ParticipantRepository(db)

    def list(self, *, q: str | None, page: int, page_size: int) -> ParticipantListResponse:
        items, total = self.repo.list(q=q, page=page, page_size=page_size)
        return ParticipantListResponse(
            items=[ParticipantRead.model_validate(p) for p in items],
            page=page,
            page_size=page_size,
            total=total,
            has_more=page * page_size < total,
        )

    def create(self, payload: ParticipantCreate) -> ParticipantRead:
        if self.repo.get_by_name_ci(payload.name):
            raise ConflictError(
                f"Participant '{payload.name}' already exists",
                details={"name": payload.name},
            )
        p = self.repo.create(name=payload.name, email=payload.email, avatar_url=payload.avatar_url)
        return ParticipantRead.model_validate(p)


class MeetingService:
    def __init__(self, db: Session, default_user_id: int) -> None:
        self.db = db
        self.repo = MeetingRepository(db)
        self.default_user_id = default_user_id

    def list(
        self,
        *,
        q: str | None,
        channel: str | None,
        hosted_by_me: bool,
        shared_with_me: bool,  # noqa: ARG002
        bookmarked: bool | None,
        date_from: datetime | None,
        date_to: datetime | None,
        duration_min: int | None,
        duration_max: int | None,
        capture_source: str | None,
        sort: SortOption,
        page: int,
        page_size: int,
    ) -> MeetingListResponse:
        from sqlalchemy import func, or_, select

        stmt = select(Meeting).options(
            selectinload(Meeting.participants).selectinload(MeetingParticipant.participant)
        )
        count_stmt = select(func.count(func.distinct(Meeting.id)))

        if hosted_by_me:
            stmt = stmt.where(Meeting.user_id == self.default_user_id)
            count_stmt = count_stmt.where(Meeting.user_id == self.default_user_id)
        if channel and channel != "all":
            stmt = stmt.where(Meeting.channel == channel)
            count_stmt = count_stmt.where(Meeting.channel == channel)
        if bookmarked is True:
            stmt = stmt.where(Meeting.bookmarked == 1)
            count_stmt = count_stmt.where(Meeting.bookmarked == 1)
        if date_from is not None:
            stmt = stmt.where(Meeting.starts_at >= date_from)
            count_stmt = count_stmt.where(Meeting.starts_at >= date_from)
        if date_to is not None:
            stmt = stmt.where(Meeting.starts_at <= date_to)
            count_stmt = count_stmt.where(Meeting.starts_at <= date_to)
        if duration_min is not None:
            stmt = stmt.where(Meeting.duration_seconds >= duration_min)
            count_stmt = count_stmt.where(Meeting.duration_seconds >= duration_min)
        if duration_max is not None:
            stmt = stmt.where(Meeting.duration_seconds <= duration_max)
            count_stmt = count_stmt.where(Meeting.duration_seconds <= duration_max)
        if capture_source:
            stmt = stmt.where(Meeting.capture_source == capture_source)
            count_stmt = count_stmt.where(Meeting.capture_source == capture_source)

        if q:
            like = f"%{q.lower()}%"
            participant_match = (
                select(Meeting.id)
                .join(Meeting.participants)
                .join(Participant)
                .where(func.lower(Participant.name).like(like))
            )
            transcript_match = select(TranscriptSegment.meeting_id).where(
                func.lower(TranscriptSegment.text).like(like)
            )
            cond = or_(
                func.lower(Meeting.title).like(like),
                Meeting.id.in_(participant_match),
                Meeting.id.in_(transcript_match),
            )
            stmt = stmt.where(cond)
            count_stmt = count_stmt.where(cond)

        if sort == SortOption.recent:
            stmt = stmt.order_by(Meeting.starts_at.desc(), Meeting.id.desc())
        elif sort == SortOption.oldest:
            stmt = stmt.order_by(Meeting.starts_at.asc(), Meeting.id.asc())
        elif sort == SortOption.longest:
            stmt = stmt.order_by(
                Meeting.duration_seconds.desc(), Meeting.starts_at.desc()
            )
        elif sort == SortOption.shortest:
            stmt = stmt.order_by(
                Meeting.duration_seconds.asc(), Meeting.starts_at.desc()
            )
        elif sort == SortOption.title_asc:
            stmt = stmt.order_by(
                func.lower(Meeting.title).asc(), Meeting.id.asc()
            )

        total = int(self.db.execute(count_stmt).scalar_one())
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        meetings = list(self.db.execute(stmt).unique().scalars())
        return MeetingListResponse(
            items=[meeting_to_read(m) for m in meetings],
            page=page,
            page_size=page_size,
            total=total,
            has_more=page * page_size < total,
        )

    def get(self, meeting_id: int) -> MeetingRead:
        m = self.repo.get(meeting_id)
        if m is None:
            raise NotFoundError(f"Meeting {meeting_id} not found", details={"id": meeting_id})
        return meeting_to_read(m)

    def create(self, payload: MeetingCreate) -> MeetingRead:
        meeting = Meeting(
            user_id=self.default_user_id,
            title=payload.title,
            starts_at=payload.starts_at,
            duration_seconds=payload.duration_seconds,
            host=payload.host,
            channel=payload.channel,
            capture_source=payload.capture_source,
            language=payload.language,
            media_url=payload.media_url,
            bookmarked=1 if payload.bookmarked else 0,
        )
        meeting = self.repo.create(meeting)
        if payload.participant_names:
            self.repo.set_participants(meeting, payload.participant_names)

        # Transcript
        if payload.transcript is not None:
            self._create_segments(meeting, payload.transcript)

        # Summary
        if payload.summary is not None:
            self._create_summary(meeting, payload.summary)

        # Notes sections
        for i, sec in enumerate(payload.notes_sections):
            self._create_section(meeting, sec, sequence_override=sec.sequence if sec.sequence else i + 1)

        # Action items
        for item in payload.action_items:
            self._create_action_item(meeting, item)

        meeting = self.repo.get(meeting.id)
        return meeting_to_read(meeting)

    def _create_segments(self, meeting: Meeting, transcript: TranscriptInput) -> None:
        try:
            parsed = parse_transcript(transcript.format, transcript.text)
        except ValueError as e:
            raise ValidationError(f"Transcript parse error: {e}") from e
        parsed = coalesce_end_times(parsed)
        for idx, seg in enumerate(parsed, start=1):
            self.db.add(
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
        self.db.commit()

    def _create_summary(self, meeting: Meeting, payload: SummaryInput) -> None:
        SummaryRepository(self.db).upsert(
            meeting.id,
            overview=payload.overview,
            key_points=payload.key_points,
            decisions=payload.decisions,
        )

    def _create_section(
        self,
        meeting: Meeting,
        payload: NotesSectionInput,
        *,
        sequence_override: int,
    ) -> None:
        self.db.add(
            SummarySection(
                meeting_id=meeting.id,
                heading=payload.heading,
                subheading=payload.subheading,
                body=payload.body,
                sequence=sequence_override,
            )
        )
        self.db.commit()

    def _create_action_item(self, meeting: Meeting, payload: ActionItemInput) -> None:
        self.db.add(
            ActionItem(
                meeting_id=meeting.id,
                title=payload.title,
                description=payload.description,
                assignee=payload.assignee,
                due_date=payload.due_date,
                completed=0,
            )
        )
        self.db.commit()

    def update(self, meeting_id: int, payload: MeetingUpdate) -> MeetingRead:
        m = self.repo.get(meeting_id)
        if m is None:
            raise NotFoundError(f"Meeting {meeting_id} not found", details={"id": meeting_id})
        data = payload.model_dump(exclude_unset=True)
        names = data.pop("participant_names", None)
        for k, v in data.items():
            if k == "bookmarked":
                m.bookmarked = 1 if v else 0
            else:
                setattr(m, k, v)
        self.repo.update(m)
        if names is not None:
            self.repo.set_participants(m, names)
        return self.get(meeting_id)

    def delete(self, meeting_id: int) -> None:
        m = self.repo.get(meeting_id)
        if m is None:
            raise NotFoundError(f"Meeting {meeting_id} not found", details={"id": meeting_id})
        self.repo.delete(m)

    def get_segments(self, meeting_id: int) -> list[TranscriptSegment]:
        if self.repo.get(meeting_id) is None:
            raise NotFoundError(f"Meeting {meeting_id} not found", details={"id": meeting_id})
        return self.repo.get_segments(meeting_id)


class SummaryService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = SummaryRepository(db)
        self.meeting_repo = MeetingRepository(db)

    def get(self, meeting_id: int) -> SummaryRead:
        if self.meeting_repo.get(meeting_id) is None:
            raise NotFoundError(f"Meeting {meeting_id} not found", details={"id": meeting_id})
        summary = self.repo.get_for_meeting(meeting_id)
        if summary is None:
            raise NotFoundError(
                f"Summary for meeting {meeting_id} not found",
                details={"id": meeting_id},
            )
        return SummaryRead(
            meeting_id=meeting_id,
            overview=summary.overview,
            key_points=_safe_json_list(summary.key_points),
            decisions=_safe_json_list(summary.decisions),
        )


class NotesService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = NotesSectionRepository(db)
        self.meeting_repo = MeetingRepository(db)

    def list(self, meeting_id: int) -> NotesRead:
        if self.meeting_repo.get(meeting_id) is None:
            raise NotFoundError(f"Meeting {meeting_id} not found", details={"id": meeting_id})
        sections = self.repo.list_for_meeting(meeting_id)
        return NotesRead(
            meeting_id=meeting_id,
            sections=[SummarySectionRead.model_validate(s) for s in sections],
        )

    def topics(self, meeting_id: int) -> TopicsRead:
        if self.meeting_repo.get(meeting_id) is None:
            raise NotFoundError(f"Meeting {meeting_id} not found", details={"id": meeting_id})
        sections = self.repo.list_for_meeting(meeting_id)
        seen: set[str] = set()
        names: list[str] = []
        for s in sections:
            heading = (s.heading or "").strip()
            if not heading or heading.lower() == "notes":
                continue
            key = heading.lower()
            if key in seen:
                continue
            seen.add(key)
            names.append(heading)
        return TopicsRead(
            meeting_id=meeting_id,
            topics=[TopicRead(name=n) for n in names],
        )

    def chapters(self, meeting_id: int) -> ChaptersRead:
        if self.meeting_repo.get(meeting_id) is None:
            raise NotFoundError(f"Meeting {meeting_id} not found", details={"id": meeting_id})
        sections = self.repo.list_for_meeting(meeting_id)
        out: list[ChapterRead] = []
        for s in sections:
            m = _first_timestamp(s.body)
            if m is None:
                continue
            mm, ss = m
            out.append(
                ChapterRead(
                    heading=s.heading,
                    start_time=mm * 60 + ss,
                )
            )
        return ChaptersRead(meeting_id=meeting_id, chapters=out)


class ActionItemService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = ActionItemRepository(db)
        self.meeting_repo = MeetingRepository(db)

    def list_for_meeting(self, meeting_id: int) -> ActionItemListResponse:
        if self.meeting_repo.get(meeting_id) is None:
            raise NotFoundError(f"Meeting {meeting_id} not found", details={"id": meeting_id})
        items = self.repo.list_for_meeting(meeting_id)
        return ActionItemListResponse(
            items=[ActionItemRead.model_validate(i) for i in items],
            total=len(items),
        )

    def create(self, meeting_id: int, payload: ActionItemCreate) -> ActionItemRead:
        if self.meeting_repo.get(meeting_id) is None:
            raise NotFoundError(f"Meeting {meeting_id} not found", details={"id": meeting_id})
        item = ActionItem(
            meeting_id=meeting_id,
            title=payload.title,
            description=payload.description,
            assignee=payload.assignee,
            due_date=payload.due_date,
            completed=0,
        )
        item = self.repo.create(item)
        return ActionItemRead.model_validate(item)

    def update(self, item_id: int, payload: ActionItemUpdate) -> ActionItemRead:
        item = self.repo.get(item_id)
        if item is None:
            raise NotFoundError(f"Action item {item_id} not found", details={"id": item_id})
        data = payload.model_dump(exclude_unset=True)
        completed = data.pop("completed", None)
        for k, v in data.items():
            setattr(item, k, v)
        if completed is not None:
            if completed:
                item.completed = 1
                item.completed_at = datetime.utcnow()
            else:
                item.completed = 0
                item.completed_at = None
        item = self.repo.update(item)
        return ActionItemRead.model_validate(item)

    def delete(self, item_id: int) -> None:
        item = self.repo.get(item_id)
        if item is None:
            raise NotFoundError(f"Action item {item_id} not found", details={"id": item_id})
        self.repo.delete(item)


def _safe_json_list(raw: str) -> list[str]:
    try:
        value = json.loads(raw)
    except (TypeError, ValueError):
        return []
    if not isinstance(value, list):
        return []
    return [str(v) for v in value]


_TIMESTAMP_RE = re.compile(r"\((\d{1,2}):(\d{2})\)")


def _first_timestamp(body: str) -> tuple[int, int] | None:
    m = _TIMESTAMP_RE.search(body)
    if not m:
        return None
    return int(m.group(1)), int(m.group(2))


def get_or_create_default_user(repo: UserRepository, default_name: str):
    user = repo.get_first()
    if user is None:
        user = repo.create(name=default_name)
    return user