"""Pydantic schemas."""

from __future__ import annotations

from datetime import date as date_cls, datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    avatar_url: str | None
    created_at: datetime


class HealthResponse(BaseModel):
    status: str
    app_env: str
    version: str


# ----- Enums -----


Channel = Literal["my", "all", "voice", "uploads"]
CaptureSource = Literal["upload", "mic", "bot", "desktop", "browser"]


class SortOption(str, Enum):
    recent = "recent"
    oldest = "oldest"
    longest = "longest"
    shortest = "shortest"
    title_asc = "title_asc"


# ----- Participants -----


class ParticipantRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str | None = None
    avatar_url: str | None = None
    role: str | None = None


class ParticipantCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str | None = Field(default=None, max_length=200)
    avatar_url: str | None = Field(default=None, max_length=500)


# ----- Meetings -----


class MeetingParticipantRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str | None = None
    avatar_url: str | None = None
    role: str | None = None


class MeetingRead(BaseModel):
    id: int
    title: str
    starts_at: datetime
    duration_seconds: int
    host: str
    channel: Channel
    capture_source: CaptureSource
    language: str
    media_url: str
    bookmarked: bool
    participants: list[MeetingParticipantRead] = []
    created_at: datetime
    updated_at: datetime


class MeetingUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    starts_at: datetime | None = None
    duration_seconds: int | None = Field(default=None, ge=0)
    host: str | None = Field(default=None, min_length=1, max_length=120)
    channel: Channel | None = None
    capture_source: CaptureSource | None = None
    language: str | None = Field(default=None, max_length=60)
    media_url: str | None = Field(default=None, max_length=500)
    bookmarked: bool | None = None
    participant_names: list[str] | None = None

    @field_validator("participant_names")
    @classmethod
    def _strip_names(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return v
        cleaned = [n.strip() for n in v if n.strip()]
        return cleaned or None


class MeetingCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    starts_at: datetime
    duration_seconds: int = Field(ge=0)
    host: str = Field(min_length=1, max_length=120)
    channel: Channel = "my"
    capture_source: CaptureSource = "upload"
    language: str = Field(default="English (Global)", max_length=60)
    media_url: str = Field(default="/audio/sample.wav", max_length=500)
    bookmarked: bool = False
    participant_names: list[str] = []
    transcript: TranscriptInput | None = None
    summary: SummaryInput | None = None
    notes_sections: list[NotesSectionInput] = []
    action_items: list[ActionItemInput] = []

    @field_validator("participant_names")
    @classmethod
    def _strip_names(cls, v: list[str]) -> list[str]:
        return [n.strip() for n in v if n.strip()]


class TranscriptInput(BaseModel):
    format: Literal["txt", "vtt", "json"] = "txt"
    text: str = Field(min_length=1, max_length=2_000_000)


class SummaryInput(BaseModel):
    overview: str = Field(min_length=1, max_length=4000)
    key_points: list[str] = Field(default_factory=list, max_length=50)
    decisions: list[str] = Field(default_factory=list, max_length=50)


class NotesSectionInput(BaseModel):
    heading: str = Field(min_length=1, max_length=120)
    subheading: str | None = Field(default=None, max_length=120)
    body: str = Field(min_length=1, max_length=20000)
    sequence: int | None = None


class ActionItemInput(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    assignee: str | None = Field(default=None, max_length=120)
    due_date: date_cls | None = None


# ----- Transcript -----


class TranscriptSegmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    meeting_id: int
    speaker_name: str
    speaker_key: str
    start_time: float
    end_time: float
    text: str
    sequence: int


class TranscriptRead(BaseModel):
    meeting_id: int
    segments: list[TranscriptSegmentRead]


# ----- Summary -----


class SummaryRead(BaseModel):
    meeting_id: int
    overview: str
    key_points: list[str]
    decisions: list[str]


class SummarySectionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    meeting_id: int
    heading: str
    subheading: str | None = None
    body: str
    sequence: int


class NotesRead(BaseModel):
    meeting_id: int
    sections: list[SummarySectionRead]


class TopicRead(BaseModel):
    name: str


class TopicsRead(BaseModel):
    meeting_id: int
    topics: list[TopicRead]


class ChapterRead(BaseModel):
    heading: str
    start_time: float  # seconds


class ChaptersRead(BaseModel):
    meeting_id: int
    chapters: list[ChapterRead]


# ----- Action items -----


class ActionItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    meeting_id: int
    title: str
    description: str | None = None
    assignee: str | None = None
    due_date: date_cls | None = None
    completed: bool
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class ActionItemCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    assignee: str | None = Field(default=None, max_length=120)
    due_date: date_cls | None = None


class ActionItemUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    assignee: str | None = Field(default=None, max_length=120)
    due_date: date_cls | None = None
    completed: bool | None = None


class ActionItemListResponse(BaseModel):
    items: list[ActionItemRead]
    total: int


# ----- Search -----


class MeetingSearchHit(BaseModel):
    id: int
    title: str
    starts_at: datetime
    snippet: str | None = None


class TranscriptSearchHit(BaseModel):
    meeting_id: int
    meeting_title: str
    segment_id: int
    speaker_name: str
    start_time: float
    snippet: str


class SearchResult(BaseModel):
    meetings: list[MeetingSearchHit]
    transcript_hits: list[TranscriptSearchHit]


# ----- Pagination -----


class MeetingListResponse(BaseModel):
    items: list[MeetingRead]
    page: int
    page_size: int
    total: int
    has_more: bool


class ParticipantListResponse(BaseModel):
    items: list[ParticipantRead]
    page: int
    page_size: int
    total: int
    has_more: bool


# Re-export date type alias used elsewhere
Date = date_cls