# API Contract

**Project:** Fireflies.ai-inspired Meeting Intelligence Platform (Clone / SDE Assignment)
**Document type:** REST API Contract — Phase 3
**Status:** Final v1.0
**Scope:** HTTP API exposed by the FastAPI backend that the Next.js frontend consumes. Includes endpoints, request/response schemas, validation, errors, status codes, pagination, filtering, sorting, and search behavior.

> **Implementation status (Phase 16):** This document describes the design intent. The implementation matches it. Additional behavior added in Phase 10: `POST /api/v1/meetings` accepts an optional `transcript` block (`.txt`/`.vtt`/`.json`) and an optional `summary`/`notes_sections`/`action_items` block to bundle-create related rows in one transaction.

---

## 1. Conventions

### 1.1 Base URL
- Dev: `http://localhost:8000`
- Prod: configured via `NEXT_PUBLIC_API_BASE_URL`

### 1.2 Versioning
- All endpoints are prefixed `/api/v1`.

### 1.3 Content type
- Request and response bodies use `application/json` unless noted.
- Transcript upload (create-meeting) supports `multipart/form-data` AND a JSON body with the transcript text inline. JSON is preferred for v1.

### 1.4 IDs
- All entity IDs are integer (SQLite INTEGER PK). AUTOINCREMENT).

### 1.5 Datetimes
- ISO 8601 UTC strings (`2026-09-07T13:25:00Z`). Date-only fields use `YYYY-MM-DD`.

### 1.6 Envelope for errors
```json
{
  "error": {
    "code": "not_found",
    "message": "Meeting not found",
    "details": { "id": 42 }
  }
}
```

| HTTP | code               | When                                          |
|------|--------------------|-----------------------------------------------|
| 400  | `validation_error` | Request body fails Pydantic validation        |
| 404  | `not_found`        | Resource does not exist                       |
| 409  | `conflict`         | Uniqueness / FK constraint violation          |
| 422  | `unprocessable`    | Semantic validation failure                   |
| 500  | `internal_error`   | Unexpected server error                       |

---

## 2. Endpoint Map

```
Meetings
  GET    /api/v1/meetings                 List meetings (filters + sort + search + pagination)
  POST   /api/v1/meetings                 Create meeting (with transcript text or file)
  GET    /api/v1/meetings/{id}            Get meeting detail
  PATCH  /api/v1/meetings/{id}            Update meeting metadata (and optionally bookmark)
  DELETE /api/v1/meetings/{id}            Delete meeting (cascades)

Transcript
  GET    /api/v1/meetings/{id}/transcript          Get ordered transcript segments

Summary
  GET    /api/v1/meetings/{id}/summary             Get summary (overview + key_points + decisions)
  GET    /api/v1/meetings/{id}/notes               Get sectioned Notes body

Action items
  GET    /api/v1/meetings/{id}/action-items        List action items for meeting
  POST   /api/v1/meetings/{id}/action-items        Create action item
  PATCH  /api/v1/action-items/{id}                Update action item (title / completed / etc.)
  DELETE /api/v1/action-items/{id}                 Delete action item

Search
  GET    /api/v1/search?q=...                     Global search (meetings + transcript snippets)

Participants
  GET    /api/v1/participants                     List participants (for typeahead)
  POST   /api/v1/participants                     Create participant (used internally by create-meeting)
```

---

## 3. Pagination, Filtering, Sorting

### 3.1 Pagination
- `GET` list endpoints accept `?page=1&page_size=20`.
- Response includes:
```json
{
  "items": [...],
  "page": 1,
  "page_size": 20,
  "total": 137,
  "has_more": true
}
```
- Defaults: `page=1`, `page_size=20`. Max `page_size=100`.

### 3.2 Library filters (on `GET /meetings`)
| Param           | Type        | Notes                                                                 |
|-----------------|-------------|-----------------------------------------------------------------------|
| `q`             | string      | Substring search across title + participants + transcript              |
| `channel`       | enum        | `my` (default) / `all` / `voice` / `uploads`                          |
| `hosted_by_me`  | bool        | `true` → only meetings hosted by current user                          |
| `shared_with_me`| bool        | Out of scope; accepted but ignored                                      |
| `bookmarked`    | bool        | Only bookmarked meetings                                               |
| `date_from`     | ISO datetime| Inclusive lower bound on `starts_at`                                   |
| `date_to`       | ISO datetime| Inclusive upper bound on `starts_at`                                   |
| `duration_min`  | int (sec)   | Inclusive lower bound                                                  |
| `duration_max`  | int (sec)   | Inclusive upper bound                                                  |
| `capture_source`| enum        | `upload` / `mic` / `bot` / `desktop` / `browser`                      |
| `sort`          | enum        | `recent` (default) / `oldest` / `longest` / `shortest` / `title_asc`   |
| `page`          | int         | 1-indexed                                                              |
| `page_size`     | int         | 1–100                                                                  |

---

## 4. Schemas

### 4.1 Meeting

`Meeting` (read shape):
```json
{
  "id": 42,
  "title": "Q4 Product Strategy",
  "starts_at": "2026-09-07T13:25:00Z",
  "duration_seconds": 1800,
  "host": "Naresh Yadav",
  "channel": "my",
  "capture_source": "upload",
  "language": "English (Global)",
  "media_url": "/audio/sample.mp3",
  "bookmarked": false,
  "participants": [
    { "id": 7, "name": "Naresh Yadav", "email": null, "avatar_url": null, "role": "host" },
    { "id": 8, "name": "Sarah Chen",   "email": null, "avatar_url": null, "role": "attendee" }
  ],
  "created_at": "2026-09-07T13:30:00Z",
  "updated_at": "2026-09-07T13:30:00Z"
}
```

`MeetingCreate` (request):
```json
{
  "title": "Q4 Product Strategy",
  "starts_at": "2026-09-07T13:25:00Z",
  "duration_seconds": 1800,
  "host": "Naresh Yadav",
  "channel": "my",
  "capture_source": "upload",
  "language": "English (Global)",
  "media_url": "/audio/sample.mp3",
  "bookmarked": false,
  "participant_names": ["Naresh Yadav", "Sarah Chen"],
  "transcript": {
    "format": "txt",
    "text": "00:00 Naresh Yadav: Welcome everyone..."
  },
  "summary": {
    "overview": "...",
    "key_points": ["...", "..."],
    "decisions": ["...", "..."]
  },
  "notes_sections": [
    { "heading": "Notes", "subheading": null, "body": "- ...", "sequence": 1 }
  ],
  "action_items": [
    { "title": "Prepare technical proposal", "assignee": "John", "due_date": "2026-09-15" }
  ]
}
```

`MeetingUpdate` (PATCH, all fields optional):
```json
{
  "title": "Q4 Product Strategy — Updated",
  "starts_at": "2026-09-07T13:25:00Z",
  "duration_seconds": 1800,
  "host": "Naresh Yadav",
  "channel": "my",
  "capture_source": "upload",
  "language": "English (Global)",
  "media_url": "/audio/sample.mp3",
  "bookmarked": true,
  "participant_names": ["Naresh Yadav", "Sarah Chen", "Mike Lee"]
}
```

### 4.2 Transcript

`TranscriptSegment`:
```json
{
  "id": 123,
  "meeting_id": 42,
  "speaker_name": "Sarah Chen",
  "speaker_key": "spk_1",
  "start_time": 18.4,
  "end_time": 32.1,
  "text": "I think we should prioritize the onboarding redesign.",
  "sequence": 3
}
```

`Transcript` (collection):
```json
{ "meeting_id": 42, "segments": [ /* TranscriptSegment... */ ] }
```

### 4.3 Summary

`Summary`:
```json
{
  "meeting_id": 42,
  "overview": "...",
  "key_points": ["...", "..."],
  "decisions": ["..."]
}
```

### 4.4 Notes sections

`NotesSection`:
```json
{
  "id": 5,
  "meeting_id": 42,
  "heading": "App Overview",
  "subheading": null,
  "body": "- Desktop app auto-detects meetings (00:07)\n  - Works with/without bot\n  - Lives on user computer",
  "sequence": 1
}
```

`Notes`:
```json
{ "meeting_id": 42, "sections": [ /* NotesSection... */ ] }
```

### 4.5 Action items

`ActionItem`:
```json
{
  "id": 9,
  "meeting_id": 42,
  "title": "Prepare technical proposal",
  "description": null,
  "assignee": "John",
  "due_date": "2026-09-15",
  "completed": false,
  "completed_at": null,
  "created_at": "2026-09-07T13:35:00Z",
  "updated_at": "2026-09-07T13:35:00Z"
}
```

`ActionItemCreate`:
```json
{ "title": "...", "description": "...", "assignee": "...", "due_date": "YYYY-MM-DD" }
```

`ActionItemUpdate`:
```json
{ "title": "...", "description": "...", "assignee": "...", "due_date": "YYYY-MM-DD", "completed": true }
```

### 4.6 Participant

`Participant`:
```json
{
  "id": 7,
  "name": "Naresh Yadav",
  "email": null,
  "avatar_url": null,
  "role": "host"
}
```

`ParticipantCreate`:
```json
{ "name": "Naresh Yadav", "email": null, "avatar_url": null }
```

### 4.7 Search result

`SearchResult`:
```json
{
  "meetings": [
    {
      "id": 42,
      "title": "Q4 Product Strategy",
      "starts_at": "2026-09-07T13:25:00Z",
      "snippet": "...prioritize <mark>roadmap</mark>..."
    }
  ],
  "transcript_hits": [
    {
      "meeting_id": 42,
      "meeting_title": "Q4 Product Strategy",
      "segment_id": 123,
      "speaker_name": "Sarah Chen",
      "start_time": 18.4,
      "snippet": "I think we should <mark>prioritize</mark> the..."
    }
  ]
}
```

---

## 5. Endpoint Details

### 5.1 `GET /api/v1/meetings`

List meetings with filters, search, sort, and pagination.

Query: see §3.2.

200 OK → `{ items: Meeting[], page, page_size, total, has_more }`.

Behavior:
- `q` matches case-insensitively on title OR participant name OR transcript text.
- `hosted_by_me` is implemented as `host = <current_user_name>` (since we have one user).
- `bookmarked=true` → `meetings.bookmarked = 1`.
- `sort=recent` (default) → `ORDER BY starts_at DESC`.
- `sort=title_asc` → `ORDER BY title COLLATE NOCASE ASC`.
- `page_size` is clamped to `[1, 100]`.

### 5.2 `POST /api/v1/meetings`

Create a meeting along with transcript segments, summary, notes sections, and optional action items, in a single transaction.

Request: `MeetingCreate`.

201 Created → `Meeting` (full read shape).

Validation:
- `title` required, max 200 chars.
- `starts_at` required, ISO 8601.
- `duration_seconds` required, ≥ 0.
- `host` required, max 120 chars.
- `channel` required, one of the allowed enums.
- `capture_source` required, one of the allowed enums.
- `language` optional, default `"English (Global)"`.
- `media_url` optional, default `/audio/sample.mp3`.
- `bookmarked` optional, default `false`.
- `participant_names` optional list of strings; empty allowed. Unknown names are auto-created as `participants` rows.
- `transcript` optional:
  - `format` ∈ `txt | vtt | json`.
  - `text` required when format is `txt` / `vtt` / `json`.
  - Parser MUST validate: `start_time >= 0`, `end_time >= start_time`, monotonic `sequence`.
  - On parse failure → 400 with `code=validation_error` and `details.parser_errors[]`.
- `summary` optional; keys = `overview` (required if summary provided), `key_points[]`, `decisions[]`.
- `notes_sections[]` optional; ordered by `sequence`.
- `action_items[]` optional; each `{title, description?, assignee?, due_date?}`.

Errors:
- 400 if `transcript` parse fails.
- 409 on FK constraint violation (shouldn't happen with the FK shape but kept for safety).

### 5.3 `GET /api/v1/meetings/{id}`

200 OK → `Meeting` (full read shape, no nested transcript/summary by default — those are fetched separately to keep payloads small).

404 if not found.

### 5.4 `PATCH /api/v1/meetings/{id}`

Request: `MeetingUpdate` (any subset of fields).

200 OK → `Meeting`.

Behavior:
- Replacing `participant_names` is a full replace (delete non-listed, upsert new).
- `bookmarked` toggle is a normal patch.
- `transcript`, `summary`, `notes_sections`, and `action_items` are NOT updated via this endpoint. They have their own endpoints (Phase 10 CRUD).

### 5.5 `DELETE /api/v1/meetings/{id}`

204 No Content.

Cascades delete dependent rows per schema rules.

### 5.6 `GET /api/v1/meetings/{id}/transcript`

200 OK → `Transcript`.

Segments are ordered by `sequence` ASC.

### 5.7 `GET /api/v1/meetings/{id}/summary`

200 OK → `Summary`.

404 if meeting has no summary (create with summary OR create later via edit).

### 5.8 `GET /api/v1/meetings/{id}/notes`

200 OK → `Notes` (sections ordered by `sequence` ASC).

### 5.9 `GET /api/v1/meetings/{id}/action-items`

200 OK → `{ items: ActionItem[], total }`. (List endpoint pattern with `total`; pagination optional in v1.)

### 5.10 `POST /api/v1/meetings/{id}/action-items`

Request: `ActionItemCreate`.

201 Created → `ActionItem`.

### 5.11 `PATCH /api/v1/action-items/{id}`

Request: `ActionItemUpdate`.

200 OK → `ActionItem`.

Behavior: setting `completed=true` stamps `completed_at = CURRENT_TIMESTAMP`; setting `completed=false` clears `completed_at`.

### 5.12 `DELETE /api/v1/action-items/{id}`

204 No Content.

### 5.13 `GET /api/v1/search?q=...`

Query:
- `q` (required, 1–200 chars)
- `limit` (default 10, max 50)

200 OK → `SearchResult`.

Behavior:
- `meetings[]`: meetings whose title or participant names match. `snippet` is the first matching title fragment.
- `transcript_hits[]`: matching transcript segments (case-insensitive LIKE on `text`). `snippet` includes `<mark>...</mark>` around the match.
- Both lists capped at `limit`. `transcript_hits` ordered by `meeting_id DESC, start_time ASC`.

### 5.14 `GET /api/v1/participants`

Query:
- `q` (optional substring match on name)
- `page`, `page_size` (same as meetings)

200 OK → `{ items: Participant[], page, page_size, total, has_more }`.

Used by typeahead in the meeting form's participants field.

### 5.15 `POST /api/v1/participants`

Request: `ParticipantCreate`.

201 Created → `Participant`.

409 if a participant with the same (case-insensitive) name already exists.

---

## 6. Search Behavior Notes

- All search is **case-insensitive** via SQLite `COLLATE NOCASE` or `LOWER()` comparisons.
- Library `q` and global `q` are unified: same match logic, different result shapes.
- LIKE with leading wildcard (`%foo%`) is acceptable at our scale. FTS5 is not implemented (deferred per Phase 2 §10).
- No result is returned with HTTP 404; search returns `{ meetings: [], transcript_hits: [] }` with 200.

---

## 7. Validation Rules Summary

| Field                | Rule                                                              |
|----------------------|-------------------------------------------------------------------|
| `title`              | Required, 1–200 chars                                              |
| `host`               | Required, 1–120 chars                                              |
| `starts_at`          | Required ISO 8601 UTC                                              |
| `duration_seconds`   | Required integer, ≥ 0                                              |
| `channel`            | One of `my/all/voice/uploads`                                      |
| `capture_source`     | One of `upload/mic/bot/desktop/browser`                            |
| `media_url`          | Required string (default `/audio/sample.mp3`)                       |
| `participant_names`  | Optional list of strings, each 1–120 chars                          |
| `transcript.format`  | One of `txt/vtt/json`                                              |
| `transcript.text`    | Required if `transcript` provided                                  |
| `summary.overview`   | Required if `summary` provided, max 4000 chars                     |
| `summary.key_points` | List of strings, each 1–500 chars                                   |
| `summary.decisions`  | List of strings, each 1–500 chars                                   |
| `notes_sections[].heading` | Required, 1–120 chars                                       |
| `notes_sections[].body`    | Required, max 20000 chars                                   |
| `action_items[].title` | Required, 1–200 chars                                             |
| `action_items[].assignee` | Optional, max 120 chars                                         |
| `action_items[].due_date` | Optional `YYYY-MM-DD`                                           |
| `q` (search)         | 1–200 chars                                                       |

---

## 8. Status Code Cheat Sheet

| Code | Meaning in this API                                                  |
|------|----------------------------------------------------------------------|
| 200  | OK with body                                                         |
| 201  | Created with body                                                    |
| 204  | No content (delete)                                                  |
| 400  | Validation / parse error                                             |
| 404  | Not found                                                            |
| 409  | Conflict (e.g., duplicate participant name)                            |
| 422  | Semantic validation failure                                          |
| 500  | Unexpected error                                                     |

---

## 9. Pagination / Filtering Cheat Sheet

- All list endpoints paginate with `page` (1-indexed) and `page_size` (1–100, default 20).
- All list endpoints return `{ items, page, page_size, total, has_more }` OR `{ items, total }` for action items (no pagination required by assignment).
- Library endpoint supports the full filter+sort set in §3.2.

---

## 10. Out-of-Scope Endpoints (NOT exposed)

The following are intentionally NOT implemented (per assignment scope and Phase 0/1/2):

- Real auth (`/auth/*`).
- Users management (`/users/*`) other than the seeded default.
- Channels CRUD (`/channels/*`) — channels are an enum.
- Tags CRUD (`/tags/*`) — tags not in scope.
- Bookmarks as a resource — bookmark is a column.
- Topics / chapters resource — represented in `summary_sections.body` Markdown.
- AskFred chat (`/askfred/*`) — visual-only.
- AI Skills (`/ai-skills/*`) — out of scope.
- Voice Agents (`/voice-agents/*`) — out of scope.
- Integrations (`/integrations/*`) — out of scope.
- Email Assistant (`/email-assistant/*`) — out of scope.
- Global Tasks (`/tasks/*`) — out of scope; action items live under meeting.
- Analytics (`/analytics/*`) — out of scope.
- Billing / subscriptions — out of scope.
- Notifications — out of scope.

---

## 11. Consistency Check

- Schema in `docs/DATABASE.md` (Phase 2) maps 1:1 to API request/response shapes here. No phantom fields. No missing fields.
- UI spec in `docs/FIRELIES_UI_SPEC.md` (Phase 0) maps: dashboard "Recent" tab → `GET /meetings`. Library channels → `?channel=`. Search input → `?q=`. Filters modal → `?duration_min=…`. Sort menu → `?sort=…`. Notepad summary → `GET /meetings/{id}/summary` + `GET /meetings/{id}/notes`. Transcript in right rail → `GET /meetings/{id}/transcript`. Action items CRUD → `GET/POST /meetings/{id}/action-items` + `PATCH/DELETE /action-items/{id}`. Bookmark → `PATCH /meetings/{id}` with `bookmarked: true`.
- Architecture in `docs/ARCHITECTURE.md` (Phase 1): routes consume Pydantic schemas, services own logic, repositories own queries — all expressible directly from this contract.

No conflicts detected.

---

## 12. Open Questions

None — all endpoints trace to assignment requirements or already-locked Phase 0/1/2 decisions.