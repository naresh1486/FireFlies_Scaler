# System Architecture

**Project:** Fireflies.ai-inspired Meeting Intelligence Platform (Clone / SDE Assignment)
**Document type:** Architecture — Phase 1
**Status:** Final v1.0
**Scope:** End-to-end system architecture for frontend (Next.js + TypeScript) and backend (FastAPI + Python + SQLite), covering layering, data flow, state management, configuration, error handling, deployment, and testing.

> **Implementation status (Phase 16):** This document describes the design intent. The implementation matches it, with one addition not captured here: `app/seed/` (idempotent seed runner) and `app/parsers/` (.txt/.vtt/.json transcript parsers). See `README.md` for the canonical layout.

---

## 1. Goals & Constraints

### 1.1 Product goals
- Polished Fireflies-inspired meeting intelligence UI.
- Persistent relational data via SQLite.
- Transcript ↔ media synchronization, transcript search, summary, action items, full meeting CRUD.
- Real-feel demo experience with seeded realistic data.

### 1.2 Engineering constraints (from assignment)
- Frontend: **Next.js + TypeScript + modern React**.
- Backend: **Python + FastAPI** (REST).
- DB: **SQLite** with proper relational schema (no giant JSON blobs where normalization is appropriate).
- Deployable to **Vercel/Render/Railway** (frontend) and **Render/Railway** (backend), with SQLite persistence appropriate to the environment.

### 1.3 Anti-patterns to avoid
- No microservices.
- No Kubernetes, no Kafka, no Redis unless a concrete need appears.
- No real auth complexity (mocked single default user).
- No real LLM infrastructure (seeded/mock summaries).
- No premature over-abstraction.

---

## 2. High-Level Topology

```
                        ┌──────────────────────────┐
                        │      Browser Client      │
                        │   (Next.js app router)   │
                        └─────────────┬────────────┘
                                      │ HTTPS / JSON
                                      ▼
                        ┌──────────────────────────┐
                        │   FastAPI (REST API)     │
                        │   /api/*                 │
                        └─────────────┬────────────┘
                                      │ SQLAlchemy (sync)
                                      ▼
                        ┌──────────────────────────┐
                        │      SQLite (file)       │
                        │   ./data/app.db          │
                        └──────────────────────────┘
```

- A single Next.js app serves the UI only.
- A single FastAPI app exposes REST endpoints under `/api`.
- SQLite is a file on disk. In dev: `./backend/data/app.db`. In prod: a persistent volume on the host (Render/Railway disk).

---

## 3. Frontend Architecture

### 3.1 Tech choices

| Concern | Decision |
|---|---|
| Framework | **Next.js 14+** (App Router) |
| Language | **TypeScript** (strict mode) |
| Styling | **Tailwind CSS** + CSS variables for design tokens |
| Components | Headless primitives (Radix UI) + custom domain components in `features/` |
| Icons | `lucide-react` |
| Forms | Native + `react-hook-form` for the meeting form |
| State (server cache) | **TanStack Query** (`@tanstack/react-query`) |
| State (client/UI) | React hooks + lightweight `zustand` for global UI state (rail expand state, right rail tab, AskFred page mode, dismissable banner) |
| Toasts | `sonner` |
| Dates | `date-fns` |
| Testing | **Vitest** (unit) + **Playwright** (e2e) |
| Lint/Format | ESLint + Prettier |
| Package manager | `pnpm` |

### 3.2 App Router layout

```
frontend/
├── app/
│   ├── layout.tsx              // Root: providers (QueryClient, Toaster, theme)
│   ├── page.tsx                // /          → HomePage
│   ├── meetings/
│   │   ├── page.tsx            // /meetings  → MeetingsLibraryPage
│   │   └── [id]/
│   │       └── page.tsx        // /meetings/:id → NotepadPage
│   ├── settings/
│   │   └── page.tsx            // /settings  → placeholder
│   ├── coming-soon/
│   │   └── page.tsx            // /coming-soon → placeholder
│   ├── not-found.tsx
│   └── error.tsx
│
├── components/
│   └── ui/                     // Primitive components (Button, Input, ...)
│
├── features/
│   ├── shell/
│   ├── home/
│   ├── meetings/
│   ├── meeting-detail/
│   ├── transcript/
│   └── askfred/
│
├── hooks/                      // Shared hooks (useToast, useMediaSync ctx, ...)
├── lib/
│   ├── api-client.ts           // Fetch wrapper with base URL, error normalization
│   ├── query-keys.ts           // Centralized query keys
│   └── utils.ts
├── types/                      // Shared TS types
├── styles/
│   ├── globals.css             // Tailwind layers + CSS variables (design tokens)
│   └── tokens.css              // :root variables
├── public/                     // Static assets (placeholder audio: /public/audio/sample.mp3)
├── tests/
│   ├── unit/                   // Vitest
│   └── e2e/                    // Playwright
├── .env.example                // NEXT_PUBLIC_API_BASE_URL=...
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 3.3 Layering rules

```
Page (app/...)
   ↓
Feature components (features/<area>/...)  ← orchestrators
   ↓
UI primitives (components/ui/...)         ← leaf / no business logic
   ↓
Hooks (hooks/, features/<area>/hooks.ts)  ← stateful logic
   ↓
API client (lib/api-client.ts)            ← talks to FastAPI
```

- Pages compose feature components.
- Feature components may use primitives, hooks, and the API client.
- Primitives contain no business logic.
- Hooks own local state and call the API client.
- `api-client.ts` is the **only** place that knows the base URL.

### 3.4 State strategy

| Concern | Mechanism |
|---|---|
| Server data (meetings, transcript, summary, action items) | TanStack Query cache |
| Mutations | TanStack Query mutations → optimistic where appropriate (action item toggle, delete) |
| Local UI (rail expand, right rail tab, modal open, toasts) | `zustand` slice per area |
| Media player state (currentTime, playing, speed, activeSegmentId) | `MediaSyncContext` (React context + reducer) — single source of truth for both transcript and player |
| Form state | `react-hook-form` (create/edit meeting form) |
| Banner dismissal | `localStorage` via `useDismissableBanner` hook |

### 3.5 Routing & SSR

- App Router with **server components by default**; client components where state or effects are required (marked `"use client"`).
- Pages are server-rendered shells that fetch initial data via TanStack Query hydration (or React Server Component fetch with `cache()`).
- For v1 we render the shell on the server and let client components take over for interactive parts (rail, media bar, transcript).

### 3.6 API client contract

- `lib/api-client.ts` exports `api.get<T>(path)`, `api.post<T>(path, body)`, `api.patch<T>(path, body)`, `api.delete<T>(path)`.
- Reads `NEXT_PUBLIC_API_BASE_URL` (defaults to `http://localhost:8000`).
- On non-2xx, throws `ApiError` with `{ status, code, message, details? }`.
- All hooks call `api.*` and never use `fetch` directly.

### 3.7 Environment variables

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Base URL for the FastAPI backend |
| `NEXT_PUBLIC_DEFAULT_USER_NAME` | Display name on dashboard greeting (default `"Naresh"`) |
| `NEXT_PUBLIC_DEMO_AUDIO_URL` | URL of bundled sample audio (default `/audio/sample.mp3`) |

---

## 4. Backend Architecture

### 4.1 Tech choices

| Concern | Decision |
|---|---|
| Framework | **FastAPI** |
| Language | **Python 3.11+** |
| ORM | **SQLAlchemy 2.x (sync)** |
| Validation/serialization | **Pydantic v2** |
| Migrations | **Alembic** |
| Config | `pydantic-settings` |
| Logging | stdlib `logging` + JSON formatter |
| Testing | **pytest** + **httpx.AsyncClient** |
| Lint/Format | `ruff` + `black` |

### 4.2 Layering (strict)

```
HTTP Request
     ↓
Route (app/api/v1/meetings.py)        ← thin: parse → call service → return schema
     ↓
Schema validation (app/schemas/...)   ← Pydantic, request/response
     ↓
Service (app/services/meetings.py)    ← business logic, no I/O knowledge of HTTP
     ↓
Repository (app/repositories/...)     ← data access, returns ORM models
     ↓
ORM Model (app/models/...)            ← SQLAlchemy
     ↓
SQLite
```

### 4.3 Folder structure

```
backend/
├── app/
│   ├── main.py                   # FastAPI app factory, CORS, error handlers
│   ├── core/
│   │   ├── config.py             # pydantic-settings
│   │   ├── db.py                 # engine, session factory, get_db()
│   │   ├── logging.py            # logger setup
│   │   └── errors.py             # AppError hierarchy
│   ├── api/
│   │   ├── deps.py               # FastAPI dependencies (get_db, get_current_user)
│   │   └── v1/
│   │       ├── router.py         # APIRouter aggregator
│   │       ├── meetings.py
│   │       ├── transcripts.py
│   │       ├── summaries.py
│   │       ├── action_items.py
│   │       └── search.py
│   ├── schemas/                  # Pydantic schemas (one file per resource)
│   ├── models/                   # SQLAlchemy ORM models (one file per table)
│   ├── services/                 # Business logic (one file per resource)
│   ├── repositories/             # Data access (one file per resource)
│   └── parsers/                  # transcript parsing (.txt, .vtt, .json)
├── alembic/                      # Migrations
│   ├── env.py
│   └── versions/
├── tests/
│   ├── conftest.py
│   ├── test_meetings.py
│   ├── test_action_items.py
│   ├── test_search.py
│   └── ...
├── seed/
│   ├── __init__.py
│   ├── seed.py                   # script entry
│   └── data/                     # JSON transcripts and summaries for seed
├── pyproject.toml
├── .env.example
└── README.md
```

### 4.4 Configuration

`app/core/config.py` (pydantic-settings):

```
APP_ENV=development|production
DATABASE_URL=sqlite:///./data/app.db
CORS_ORIGINS=http://localhost:3000,...
LOG_LEVEL=INFO
DEFAULT_USER_NAME=Naresh
```

### 4.5 Database access

- `get_db()` yields a `Session` and commits/rolls back automatically.
- Services receive `Session` via constructor injection (or `Depends(get_db)` is consumed by repositories, not services — services depend on repositories).

### 4.6 Error handling

- Custom exception hierarchy (`NotFoundError`, `ValidationError`, `ConflictError`).
- Global FastAPI exception handlers translate to a uniform JSON envelope:
```
{
  "error": {
    "code": "not_found",
    "message": "Meeting not found",
    "details": { "id": "..." }
  }
}
```
- 400 for validation, 404 for not found, 409 for conflict, 500 for unexpected.

### 4.7 Logging

- JSON formatter in production, human-readable in dev.
- Every request gets a request_id; bound to logger context for the duration of the request.

### 4.8 CORS

- Configured via `CORS_ORIGINS` env var.
- In dev: `http://localhost:3000`.
- In prod: the deployed frontend domain.

---

## 5. Data Flow Examples

### 5.1 List meetings (Library)

```
User → /meetings
  → MeetingsLibraryPage (server component shell)
  → MeetingsList feature component mounts
  → useMeetings() (TanStack Query)
  → api.get("/api/meetings?q=&channel=my")
  → FastAPI: meetings.list_meetings route
  → MeetingsService.list(filters)
  → MeetingRepository.list(filters)
  → SQLAlchemy → SQLite
  → Pydantic schema response
  → JSON → React Query cache
  → MeetingsList renders
```

### 5.2 Click transcript segment → seek player

```
TranscriptSegment onClick
  → MediaSyncContext.seek(segment.startTime)
  → mediaRef.current.currentTime = segment.startTime
  → mediaRef.current.play()
  → rAF loop emits timeupdate
  → activeSegmentId recomputed (binary search)
  → TranscriptList re-renders with new activeSegmentId
```

### 5.3 Create meeting

```
MeetingFormModal submit
  → react-hook-form validates
  → api.post("/api/meetings", payload) including transcript text or file
  → FastAPI: meetings.create_meeting route
  → Pydantic validation
  → MeetingsService.create(payload)
      → parser.parse(format, text) → list[TranscriptSegmentDraft]
      → repository.create_meeting_with_segments(...)
  → SQLAlchemy transaction commits
  → response: MeetingRead schema
  → React Query invalidates ["meetings"] and refetches list
  → Toast: "Meeting created"
```

---

## 6. Authentication & User Context

- **No real authentication** for this assignment.
- A "default user" is bootstrapped on app startup (`users` table seeded with one row).
- All endpoints assume this user.
- `get_current_user()` dependency simply returns the seeded user.
- The user row is the implicit owner of all meetings created via the API.
- This is a deliberate scope-cut; not a security boundary. (Doc-noted in production hardening section.)

---

## 7. Deployment Architecture

### 7.1 Frontend (Vercel)
- Next.js → Vercel default build.
- `NEXT_PUBLIC_API_BASE_URL` set to the deployed FastAPI URL.
- Static assets (placeholder audio) bundled in `/public`.

### 7.2 Backend (Render / Railway)
- Single FastAPI service.
- **Persistent disk** mounted at `/app/data` so SQLite survives restarts.
- `DATABASE_URL=sqlite:////app/data/app.db`.
- Migrations run on container start (`alembic upgrade head`) before app launch.
- Optional seed script (`python -m seed.seed`) run on first boot via env flag `SEED_ON_START=true`.

### 7.3 Environment variables (production)
```
backend/
  DATABASE_URL=sqlite:////app/data/app.db
  CORS_ORIGINS=https://<frontend-domain>.vercel.app
  LOG_LEVEL=INFO
  SEED_ON_START=true
  DEFAULT_USER_NAME=Naresh

frontend/
  NEXT_PUBLIC_API_BASE_URL=https://<backend-domain>.onrender.com
  NEXT_PUBLIC_DEFAULT_USER_NAME=Naresh
  NEXT_PUBLIC_DEMO_AUDIO_URL=/audio/sample.mp3
```

### 7.4 SQLite considerations
- SQLite is fine for single-instance deployment. Render's free tier may reset disks on redeploy; persistent disk plan solves this.
- WAL mode enabled (`PRAGMA journal_mode=WAL`) for concurrent reads.
- Connection pool: `pool_size=5`, `max_overflow=10` (SQLite is file-locked; we keep small).
- For local dev: file at `./backend/data/app.db`.

---

## 8. Testing Architecture

### 8.1 Backend
- **pytest** with `httpx.AsyncClient(app=app)` against an in-memory SQLite (`sqlite:///:memory:`).
- Per-test transaction rollback to isolate state.
- Coverage targets (minimum): meetings CRUD, transcript retrieval, action item CRUD, search, filters, validation, error envelopes.

### 8.2 Frontend
- **Vitest** for unit (hooks, utilities, `useMediaSync`, `useTranscriptSearch`).
- **Playwright** for e2e flows:
 - Library renders and search works.
 - Open meeting → transcript visible.
 - Click transcript segment → player seeks.
 - Player plays → active transcript segment highlights.
 - Complete action item → persists after reload.
 - Delete meeting → confirmation → toast → removed from list.
 - Create meeting → appears in library.

### 8.3 Lint/Typecheck gates
- Backend: `ruff check`, `black --check`.
- Frontend: `tsc --noEmit`, `eslint`, `prettier --check`.
- Both wired into a `make verify` or root `package.json` script.

---

## 9. Configuration & Secrets

- `.env.example` files in both `frontend/` and `backend/` documenting all variables.
- Real `.env` files in `.gitignore`.
- No API keys required for this assignment.
- No third-party services required.

---

## 10. Performance & Reliability

- **Backend**: SQLAlchemy with indexes on meeting `date`, `title`, transcript `meeting_id`, action item `meeting_id`, FTS5 for transcript search (optional).
- **Frontend**: TanStack Query caches meetings by ID; media bar uses `requestAnimationFrame` to coalesce `timeupdate` events.
- **Errors**: every API call wraps the body in a uniform error envelope; UI displays toasts on failure with a `Retry` action when relevant.

---

## 11. Open Architectural Questions (Resolved)

| Question | Decision |
|---|---|
| Sync vs async SQLAlchemy | **Sync** — SQLite + small workload; FastAPI runs sync routes in a threadpool; simpler code |
| ORM vs raw SQL | **SQLAlchemy 2.x ORM** — readability + migration safety |
| Migrations | **Alembic** |
| State management on FE | **TanStack Query + zustand + MediaSyncContext** |
| Styling | **Tailwind + CSS variables** |
| Global search UI | `⌘K` overlay (v1 minimal: title + participants + transcript snippets) |
| Transcript format | Multi-format parser: `.txt` (`Speaker\ttext` per line), `.vtt` (WebVTT cues), `.json` (`[{speaker, start, end, text}]`) |
| Audio source | Bundled placeholder MP3 reused; per-meeting `media_url` column preserved |
| Real-time transcript sync | Polling via `timeupdate` event on `<audio>`; rAF throttling |
| WebSocket / SSE | **Not used** — out of scope; no real-time collaboration features |

---

## 12. Folder Layout (Top-Level)

```
project/
├── frontend/
├── backend/
├── docs/
│   ├── FIRELIES_UI_SPEC.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md        (Phase 2)
│   └── API.md             (Phase 3)
├── README.md
└── (no docker-compose required, but a single Dockerfile for backend and a vercel.json for frontend are kept)
```

The recommended structure from the assignment is preserved. Backend tests live under `backend/tests`. Seed scripts live under `backend/seed`. Documentation lives at the repo root under `docs/`.

---

## 13. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| SQLite on free-tier hosting losing data on redeploy | Document persistent-disk requirement; provide backup script |
| Two-pane Notepad with sticky bottom bar + persistent right rail = complex viewport | Implement layout shell early (Phase 4); iterate in Phase 12 |
| Transcript search performance on full-text | v1 uses LIKE; FTS5 virtual table optional |
| Bundled placeholder audio is shared across all seed meetings | Stored as static asset; per-meeting `media_url` column preserves flexibility |
| Scoping creep into features beyond the assignment | Decision log + scope rule applied to every phase review |

---

## 14. Definition of Done (Phase 1)

- This document exists at `docs/ARCHITECTURE.md`.
- Every layer (route → schema → service → repository → model) is defined.
- Frontend folder layout is final.
- Backend folder layout is final.
- Configuration & secrets approach is documented.
- Deployment plan (frontend + backend + DB) is clear.
- Testing strategy is documented.
- No code is written.