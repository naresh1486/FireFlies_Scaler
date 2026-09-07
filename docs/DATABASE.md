# Database Design

**Project:** Fireflies.ai-inspired Meeting Intelligence Platform (Clone / SDE Assignment)
**Document type:** Database Design — Phase 2
**Status:** Final v1.0
**Scope:** SQLite relational schema for the assignment's required functionality only. Visual-only and out-of-scope Fireflies features explicitly do NOT receive database infrastructure.

> **Implementation status (Phase 16):** This document describes the design intent. The implementation matches it 1:1. The default user is seeded automatically on first start; the demo seed populates 8 meetings, each with participants, transcripts (16 segments), summary, sections, and 3–6 action items. See `backend/app/seed/` for the runner.

---

## 1. Goal

Define a minimal, normalized SQLite schema that supports every feature the assignment explicitly requires, plus the bookmark toggle already locked in Phase 0/1, and nothing more. No entity, column, or index exists unless an assignment requirement or already-locked architectural decision depends on it.

---

## 2. Scope Classification (Mandatory)

### FUNCTIONAL DATABASE ENTITIES (required by assignment)

- `users` — one default seeded row
- `meetings`
- `participants` — normalized, since a meeting can have multiple participants and a participant can recur
- `meeting_participants` — join
- `transcript_segments`
- `summaries`
- `summary_sections` — structured Notes / chapters
- `action_items`
- `bookmarks` — per-meeting flag from locked Phase 0/1; persisted as a column on `meetings` rather than a separate table

### VISUAL-ONLY FEATURES (do NOT require functional database support)

- Promo banner, free-tier banner, "Invite coworkers" rail card
- AskFred panel/page UI (greeting, suggested prompts, composer)
- Slack/Gmail "Connect" upsell card
- "Capture" CTA in top bar
- "Refine Summary" / "Edit" summary affordances
- AI Skills, Analytics, Voice Agents, Integrations, Tasks, Upgrade rail items → `/coming-soon`
- Try More, Personal Assistant feature cards (Daily Brief / Meeting Prep / Tasks)
- Recurring suggested prompts (channel-context chips)
- Channel-context prompt rotation (purely UI logic)

### OUT-OF-SCOPE FEATURES (explicitly excluded, no DB infrastructure)

- Real AskFred conversation history
- AI Skills catalog, executions, or analytics
- Analytics / talk-time aggregates
- Voice Agents (configurations, calls, transcripts)
- Integrations (Slack, Gmail, Notion, MCP, etc.)
- Email Assistant
- Global Tasks system (we keep Action Items per-meeting only)
- Real authentication, users, roles, permissions, teams, workspaces
- Billing / subscriptions / usage credits
- Team collaboration (comments, bookmarks-as-collaboration, sharing ACLs)
- Notifications system (beyond local UI toasts)
- Meeting bots, real-time transcription, recording capture
- External integrations of any kind
- Tags (assignment does not require them; deferred)
- Multi-channel meeting↔channel join table (channels are a UI-side filter, implemented as a `channel` enum column)

---

## 3. Conceptual ER Overview

```
              users (1 row seeded as "Naresh")
                │
                │ 1..N
                ▼
              meetings ─────────────────────────────┐
                │                                   │
   ┌────────────┼─────────────┬──────────┬─────────┘
   │ 1..N       │ 1..N        │ 1..N     │ 1..1
   ▼            ▼             ▼          ▼
meeting_   transcript_    action_    summaries
participants  segments     items       │
   │                                    │ 1..N
   │ N..1                               ▼
   ▼                              summary_sections
participants
```

Cardinality:

- A meeting has many transcript_segments, many action_items, many meeting_participants, one summary, many summary_sections.
- A participant can appear in many meetings via `meeting_participants`.
- A user owns many meetings (`meetings.user_id`).

---

## 4. Tables

### 4.1 `users`

Single-row table representing the seeded default user.

| Column       | Type     | Constraints                                  | Notes                       |
|--------------|----------|----------------------------------------------|-----------------------------|
| `id`         | INTEGER  | PK, autoincrement                            |                             |
| `name`       | TEXT     | NOT NULL                                     | Display name (e.g. "Naresh") |
| `avatar_url` | TEXT     | NULL                                         | Optional avatar URL         |
| `created_at` | DATETIME | NOT NULL, default `CURRENT_TIMESTAMP`        |                             |

Indexes: PK only.

Purpose: satisfy the locked mocked-user model so `meetings.user_id` has a foreign key. NOT a multi-tenant auth boundary.

---

### 4.2 `meetings`

| Column            | Type     | Constraints                                                                                       | Notes                                              |
|-------------------|----------|---------------------------------------------------------------------------------------------------|----------------------------------------------------|
| `id`              | INTEGER  | PK, autoincrement                                                                                 |                                                    |
| `user_id`         | INTEGER  | NOT NULL, FK → `users(id)` ON DELETE RESTRICT                                                    | Owner (always the default user in v1)              |
| `title`           | TEXT     | NOT NULL                                                                                          |                                                    |
| `starts_at`       | DATETIME | NOT NULL                                                                                          | Meeting date+time (UTC)                            |
| `duration_seconds`| INTEGER  | NOT NULL, CHECK (`duration_seconds >= 0`)                                                          |                                                    |
| `host`            | TEXT     | NOT NULL                                                                                          | Host display name                                  |
| `channel`         | TEXT     | NOT NULL, CHECK (`channel IN ('my','all','voice','uploads')`), default `'my'`                     | UI-side filter only                                |
| `capture_source`  | TEXT     | NOT NULL, CHECK (`capture_source IN ('upload','mic','bot','desktop','browser')`), default `'upload'`|                                                    |
| `language`        | TEXT     | NOT NULL, default `'English (Global)'`                                                             |                                                    |
| `media_url`       | TEXT     | NOT NULL                                                                                          | Bundled placeholder audio path; per-meeting flexibility preserved |
| `bookmarked`      | INTEGER  | NOT NULL, default `0`, CHECK (`bookmarked IN (0,1)`)                                                | Boolean flag from Phase 0/1                        |
| `created_at`      | DATETIME | NOT NULL, default `CURRENT_TIMESTAMP`                                                              |                                                    |
| `updated_at`      | DATETIME | NOT NULL, default `CURRENT_TIMESTAMP`                                                              | Updated by app code on any modification            |

Indexes:

- PK (`id`)
- `idx_meetings_user_starts` on (`user_id`, `starts_at` DESC) — primary list/sort by recency
- `idx_meetings_bookmarked` on (`bookmarked`) — filter by bookmark
- `idx_meetings_title` on (`title`) — supports `Title A→Z` sort and search

Purpose: the core entity. Holds all meeting metadata needed by the library + detail screens.

Notes:

- `bookmarked` is a column, not a separate table, because it is a single boolean per meeting (locked in Phase 0/1).
- `starts_at` is the canonical "date" used by date-range filters and by `Recent / Oldest` sorts.

---

### 4.3 `participants`

| Column       | Type     | Constraints                                  | Notes                  |
|--------------|----------|----------------------------------------------|------------------------|
| `id`         | INTEGER  | PK, autoincrement                            |                        |
| `name`       | TEXT     | NOT NULL                                     | Display name           |
| `email`      | TEXT     | NULL                                         | Optional               |
| `avatar_url` | TEXT     | NULL                                         | Optional               |
| `created_at` | DATETIME | NOT NULL, default `CURRENT_TIMESTAMP`        |                        |

Indexes: PK only. (No unique on `email` because we have no real identity model.)

Purpose: normalized participant entity so the same person recurring across meetings is represented once. Required by the assignment: "View participants" + per-meeting participants + participant-based search.

---

### 4.4 `meeting_participants`

| Column          | Type    | Constraints                                                  | Notes                          |
|-----------------|---------|--------------------------------------------------------------|--------------------------------|
| `meeting_id`    | INTEGER | NOT NULL, FK → `meetings(id)` ON DELETE CASCADE              |                                |
| `participant_id`| INTEGER | NOT NULL, FK → `participants(id)` ON DELETE RESTRICT         |                                |
| `role`          | TEXT    | NULL, CHECK (`role IN ('host','attendee')`)                  | Optional role metadata         |

Composite PK: (`meeting_id`, `participant_id`).

Indexes:

- PK already covers lookups by meeting.
- `idx_mp_participant` on (`participant_id`) — reverse lookup when searching by participant name.

Purpose: many-to-many between meetings and participants. ON DELETE CASCADE on `meeting_id` ensures participants do not orphan on meeting deletion. ON DELETE RESTRICT on `participant_id` prevents accidental loss of participant records.

---

### 4.5 `transcript_segments`

| Column        | Type     | Constraints                                            | Notes                                          |
|---------------|----------|--------------------------------------------------------|------------------------------------------------|
| `id`          | INTEGER  | PK, autoincrement                                      |                                                |
| `meeting_id`  | INTEGER  | NOT NULL, FK → `meetings(id)` ON DELETE CASCADE        |                                                |
| `speaker_name`| TEXT     | NOT NULL                                               | Display name                                   |
| `speaker_key` | TEXT     | NOT NULL                                               | Stable color key (e.g., `spk_0`, `spk_1`) for deterministic palette assignment |
| `start_time`  | REAL     | NOT NULL, CHECK (`start_time >= 0`)                    | Seconds                                        |
| `end_time`    | REAL     | NOT NULL, CHECK (`end_time >= start_time`)             | Seconds                                        |
| `text`        | TEXT     | NOT NULL                                               | The spoken text                                |
| `sequence`    | INTEGER  | NOT NULL                                               | Deterministic ordering (1..N within a meeting) |
| `created_at`  | DATETIME | NOT NULL, default `CURRENT_TIMESTAMP`                  |                                                |

Indexes:

- PK (`id`)
- `idx_segments_meeting_seq` on (`meeting_id`, `sequence` ASC) — chronological listing + binary search by sequence
- `idx_segments_meeting_time` on (`meeting_id`, `start_time` ASC, `end_time` ASC) — supports active-segment lookup by `currentTime` and inline `(mm:ss)` timestamp-link seek via `start_time`

Purpose: the per-meeting transcript broken into individual utterances. This is the data the transcript UI renders and the media player synchronizes against.

Sync algorithm:

- Active segment for a given `currentTime`:
  `SELECT id FROM transcript_segments WHERE meeting_id = ? AND start_time <= ? ORDER BY start_time DESC LIMIT 1`, then check `end_time`.
- An index on `(meeting_id, start_time)` makes this O(log n).
- A click on a segment seeks to `start_time`. No additional state needed.

---

### 4.6 `summaries`

| Column       | Type     | Constraints                                                | Notes                                |
|--------------|----------|------------------------------------------------------------|--------------------------------------|
| `id`         | INTEGER  | PK, autoincrement                                          |                                      |
| `meeting_id` | INTEGER  | NOT NULL, UNIQUE, FK → `meetings(id)` ON DELETE CASCADE    | One summary per meeting              |
| `overview`   | TEXT     | NOT NULL                                                   | Single paragraph overview             |
| `key_points` | TEXT     | NOT NULL                                                   | JSON array of strings (see §6)       |
| `decisions`  | TEXT     | NOT NULL                                                   | JSON array of strings                |
| `created_at` | DATETIME | NOT NULL, default `CURRENT_TIMESTAMP`                      |                                      |
| `updated_at` | DATETIME | NOT NULL, default `CURRENT_TIMESTAMP`                      |                                      |

Indexes: PK + UNIQUE on `meeting_id` (which also creates an implicit index).

Purpose: holds the AI summary. UNIQUE on `meeting_id` enforces 1:1.

Why some fields are JSON:

- `key_points` and `decisions` are ordered lists of short strings. A relational table of `summary_items` would add 2 more tables, 2 more joins, and no UI benefit since we never query individual items by ID. The assignment does not require editing a single key point by ID. JSON is appropriate here.
- `overview` is a single string — NOT JSON.

---

### 4.7 `summary_sections`

Structured Notes panel content (the sectioned H2/H3/bullets/timestamp-links body the UI renders in the Notepad).

| Column        | Type     | Constraints                                            | Notes                                                              |
|---------------|----------|--------------------------------------------------------|--------------------------------------------------------------------|
| `id`          | INTEGER  | PK, autoincrement                                      |                                                                    |
| `meeting_id`  | INTEGER  | NOT NULL, FK → `meetings(id)` ON DELETE CASCADE        |                                                                    |
| `heading`     | TEXT     | NOT NULL                                               | e.g., "Notes", "App Overview", "User Interface"                    |
| `subheading`  | TEXT     | NULL                                                   | Optional H3                                                         |
| `body`        | TEXT     | NOT NULL                                               | Markdown body with bullets and inline `(mm:ss)` timestamp links    |
| `sequence`    | INTEGER  | NOT NULL                                               | Deterministic ordering within a meeting                            |
| `created_at`  | DATETIME | NOT NULL, default `CURRENT_TIMESTAMP`                  |                                                                    |

Indexes:

- PK (`id`)
- `idx_summary_sections_meeting` on (`meeting_id`, `sequence` ASC)

Purpose: per-meeting sectioned Notes content. Body is stored as Markdown (with the timestamp-link pattern inlined) so the UI can render it directly without bespoke parsing.

Why a separate table from `summaries`:

- The `summaries` row holds the machine-friendly fields (overview / key_points / decisions).
- The `summary_sections` table holds the editor-friendly sectioned body that the Notepad renders. They are independently editable in the future and have different access patterns.

---

### 4.8 `action_items`

| Column        | Type     | Constraints                                                  | Notes                                  |
|---------------|----------|--------------------------------------------------------------|----------------------------------------|
| `id`          | INTEGER  | PK, autoincrement                                            |                                        |
| `meeting_id`  | INTEGER  | NOT NULL, FK → `meetings(id)` ON DELETE CASCADE              |                                        |
| `title`       | TEXT     | NOT NULL                                                     |                                        |
| `description` | TEXT     | NULL                                                         | Optional longer description            |
| `assignee`    | TEXT     | NULL                                                         | Display name (free-text; no FK)        |
| `due_date`    | DATE     | NULL                                                         | Optional                               |
| `completed`   | INTEGER  | NOT NULL, default `0`, CHECK (`completed IN (0,1)`)           | Boolean                                |
| `completed_at`| DATETIME | NULL                                                         | Set when `completed` flips to 1         |
| `created_at`  | DATETIME | NOT NULL, default `CURRENT_TIMESTAMP`                        |                                        |
| `updated_at`  | DATETIME | NOT NULL, default `CURRENT_TIMESTAMP`                        |                                        |

Indexes:

- PK (`id`)
- `idx_action_items_meeting` on (`meeting_id`) — list per meeting
- `idx_action_items_completed` on (`meeting_id`, `completed`) — UI grouping by completed/incomplete

Purpose: per-meeting action items. Full CRUD supported. NO global Tasks table (out of scope).

---

## 5. Search, Filters, Sort

### 5.1 Library search

- Title → `LIKE '%query%'` on `meetings.title` (case-insensitive via `COLLATE NOCASE`).
- Participants → join to `meeting_participants` → `participants` → match `name` (and optionally `email`).
- Transcript (cross-meeting) → `EXISTS` subquery on `transcript_segments` with `LIKE '%query%'`.

Implementation: API combines these in a SQL query with `DISTINCT`. SQLite handles this fine at our scale (low hundreds of meetings with dozens of segments each).

### 5.2 Filters

- Hosted by me → `WHERE user_id = <current_user>` AND optionally `host = <current_user_name>`.
- Shared with me → out of scope (we have only one user; no sharing). Endpoint will accept the param but return empty / behave as no-op.
- Duration → `WHERE duration_seconds BETWEEN ? AND ?`.
- Date range → `WHERE starts_at BETWEEN ? AND ?`.
- Capture source → `WHERE capture_source = ?`.

### 5.3 Sort

- `Recent` → `ORDER BY starts_at DESC`
- `Oldest` → `ORDER BY starts_at ASC`
- `Longest` → `ORDER BY duration_seconds DESC, starts_at DESC`
- `Shortest` → `ORDER BY duration_seconds ASC, starts_at DESC`
- `Title A→Z` → `ORDER BY title COLLATE NOCASE ASC`

Indexes on `(user_id, starts_at)` and `title` cover these.

### 5.4 Transcript search (within a meeting)

- Case-insensitive substring match on `transcript_segments.text` using `LIKE '%query%' COLLATE NOCASE`.
- Backed by the existing `idx_segments_meeting_seq` index for the per-meeting segment scan; LIKE on text requires a full scan within the meeting, which is acceptable at our scale.
- FTS5 is NOT required for this assignment. Documented as deferred in §10.

---

## 6. Normalization Decisions

- `participants` is a separate table because the assignment requires "View participants" and because cross-meeting recurrence is real (e.g., "Sarah" appears in many meetings).
- `meeting_participants` is a join table (not a JSON array on `meetings`) because participants need to be searchable by name from the library.
- `summaries.key_points` and `summaries.decisions` are JSON arrays. Justified: ordered lists of short strings with no independent identity, no per-item editing, no querying by ID. Adding tables would multiply complexity with zero UI benefit.
- `summary_sections.body` is Markdown. Justified: the Notes body is editor-friendly text with embedded `(mm:ss)` link tokens. A bespoke relational model for "bullet / sub-bullet / timestamp-link" triples would be over-engineering for the assignment timeframe.
- `bookmarked` is a column on `meetings`, not a table.
- `tags` are NOT included (out of scope; not in locked Phase 0/1 list).
- `topics` / `chapters` are represented inside `summary_sections.body` as Markdown headings + `(mm:ss)` links. A dedicated `topics` table is unnecessary.
- No `channels` table. Channels are a UI-side filter via `meetings.channel` enum.

---

## 7. Indexes (Justified)

| Index                                | Purpose                                                                                          |
|--------------------------------------|--------------------------------------------------------------------------------------------------|
| `idx_meetings_user_starts`           | Primary library list + Recent sort + date-range filter                                            |
| `idx_meetings_bookmarked`            | "Bookmarked" library filter                                                                       |
| `idx_meetings_title`                 | Title A→Z sort + title search                                                                     |
| `idx_mp_participant`                 | Reverse participant lookup for participant search                                                 |
| `idx_segments_meeting_seq`           | Ordered transcript list + binary search by sequence                                              |
| `idx_segments_meeting_time`          | Active-segment lookup by `currentTime; timestamp-link seek                                       |
| `idx_summary_sections_meeting`       | Ordered Notes body                                                                                |
| `idx_action_items_meeting`           | Per-meeting action item list                                                                      |
| `idx_action_items_completed`         | UI grouping by completed state                                                                    |

No indexes are created for LIKE-on-text search; SQLite would ignore them anyway at this scale.

---

## 8. Data Lifecycle

### 8.1 Creation

- `meetings` insert, then in the same DB transaction: `participants` upserts, `meeting_participants` rows, `transcript_segments` rows, `summaries` row, `summary_sections` rows, `action_items` rows.
- `created_at` defaults to `CURRENT_TIMESTAMP`.
- `meetings.updated_at` is updated by the service layer on any modification.

### 8.2 Updates

- `updated_at` columns are bumped via application code (simple, explicit, no DB triggers needed for v1).
- `action_items.completed_at` is set when `completed` flips from 0 to 1 and cleared when flipped back.

### 8.3 Deletion

- `meetings` row deletion cascades to: `meeting_participants`, `transcript_segments`, `summaries`, `summary_sections`, `action_items`. This guarantees no orphans.
- `participants` deletion is RESTRICTED — a participant must be removed from all meetings before they can be deleted. We never delete participants in v1 (no UI affordance).

### 8.4 Timestamps

- All timestamps stored in UTC. UI converts via `date-fns` on the client.
- `action_items.due_date` is `DATE` (no time component).

### 8.5 Cascading summary

```
ON DELETE CASCADE
  meeting_participants
  transcript_segments
  summaries
  summary_sections
  action_items

ON DELETE RESTRICT
  participants (referenced by meeting_participants)
  users (referenced by meetings)
```

---

## 9. Seed Data Model (Phase 11 input)

Seed must produce 8+ realistic meetings with:

- Coherent participants (reused across meetings via `participants` table).
- Realistic titles (e.g., "Q4 Product Strategy", "Weekly Engineering Sync", "Customer Discovery — Acme Corp").
- Realistic dates spanning the last 60 days.
- Realistic durations (15–60 min).
- Capture source distribution.
- 20–50 transcript segments each, with timestamps that match `duration_seconds`.
- A 1-paragraph overview, 3–5 key points, 2–4 decisions.
- 2–5 summary sections in Markdown with inline `(mm:ss)` links that resolve to valid segment timestamps.
- 2–6 action items, some completed, some pending, some with assignees and due dates.

Constraints enforced by the seed:

- `start_time` of segment N+1 ≥ `end_time` of segment N.
- All inline timestamp links in `summary_sections.body` resolve to an existing segment's `start_time` within ±2 s.
- `duration_seconds` ≥ last segment's `end_time`.
- At least one meeting per channel (`my`, `all`) for channel-empty-state testing.
- At least one `bookmarked = 1` meeting.

---

## 10. Deferred / Explicitly Excluded

- SQLite **FTS5** for transcript search — not needed; LIKE is sufficient at this scale and assignment timeframe.
- `tags` table — not required by assignment.
- `topics` / `chapters` table — represented in `summary_sections.body` Markdown.
- `channels` table — UI-side enum on `meetings`.
- Soft delete (`deleted_at`) — not required; hard delete with CASCADE is sufficient.
- Audit log — not required.
- Read replicas / WAL tuning beyond enabling WAL mode — deferred to Phase 17.
- Multi-user data isolation — single-user assumption.

---

## 11. Consistency Check Against Phase 0/1

- Phase 0 declared a `bookmarked` flag → schema has `meetings.bookmarked`. ✔
- Phase 0 declared transcript ↔ player sync → schema has `(meeting_id, start_time, end_time)` index. ✔
- Phase 0 declared action items per meeting → schema has `action_items` with FK to meetings and CASCADE delete. ✔
- Phase 0 declared sectioned Notes → schema has `summary_sections` with Markdown body. ✔
- Phase 0 declared overview / key points / decisions → schema has `summaries.overview`, `summaries.key_points`, `summaries.decisions`. ✔
- Phase 0 declared global AskFred / Tasks / AI Skills as visual-only or out-of-scope → schema excludes all related tables. ✔
- Phase 1 declared backend layering route → service → repository → ORM model → schema maps cleanly onto this design with no impedance mismatch. ✔
- Phase 1 declared mocked single-user auth → schema has `users` with one seeded row. ✔

No conflict between Phase 0, Phase 1, and this Phase 2 design detected.

---

## 12. Open Questions

None — all decisions traceable to assignment requirements or already-locked Phase 0/1 decisions.