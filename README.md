# Fireflies Clone

A polished, Fireflies.ai-inspired **meeting intelligence platform**, built end-to-end as a full-stack SDE assignment.

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend:** FastAPI + SQLAlchemy 2 + Pydantic v2
- **Database:** SQLite (file-backed, WAL mode, persistent volume in production)

The clone reproduces the Fireflies.ai meeting library, Notepad, transcript
synchronization, transcript search, AI summary, action items, and meeting CRUD — all wired through a real REST API and a real relational database.

> **No proprietary assets are used.** All visuals, copy, icons, and color palette are original.

---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Repository layout](#repository-layout)
4. [Quick start (local development)](#quick-start-local-development)
5. [Demo flow](#demo-flow)
6. [Environment variables](#environment-variables)
7. [Database & seed data](#database--seed-data)
8. [Testing](#testing)
9. [Project lifecycle](#project-lifecycle)
10. [Deployment notes](#deployment-notes)
11. [Documentation index](#documentation-index)
12. [Known limitations](#known-limitations)
13. [License & attribution](#license--attribution)

---

## Features

- **Meetings Library** (`/meetings`)
  - Channel switcher (My / All / Voice Agent / Uploads)
  - Search, sort, host / bookmark filters
  - Card list with metadata (date · duration · host)
  - Create / Edit / Delete via modal + confirmation dialog
- **Meeting Detail / Notepad** (`/meetings/[id]`)
  - Breadcrumb header with Edit + Delete menu
  - Sectioned AI summary (Overview, Key Points, Decisions, Topics, Chapters)
  - Action items with full CRUD (create, edit, complete, delete)
  - **Transcript ↔ Media player synchronization**
    - Click a transcript segment → player seeks to that timestamp
    - Player playback → active segment highlighted + auto-scrolled
    - Keyboard: `Space` play/pause · `←/→` ±5 s · `J/L` prev/next segment · `F` follow toggle
  - **In-transcript search** with prev/next, count, jump-to-seek, highlight
  - **Sticky bottom media bar** with playback rate (0.5×–2×), bookmark toggle, thumbs feedback
  - Right-rail with AskFred (placeholder) + Transcript tabs
- **Dashboard, Settings, Coming-soon** — minimal placeholder pages per assignment scope
- **Responsive** — icon-only rail that expands on hover (desktop), hamburger drawer (mobile); two-pane Notepad collapses to a tab switcher with full-width sheets

---

## Tech stack

| Concern | Choice |
|---|---|
| Frontend framework | Next.js 14 (App Router, server components) |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS 3 + CSS variables for design tokens |
| Component primitives | Custom + Radix-where-needed |
| Icons | `lucide-react` |
| Server state | TanStack Query 5 (`@tanstack/react-query`) |
| Client UI state | React hooks + lightweight `zustand` slice (rail expand, banner dismiss, etc.) |
| Toasts | `sonner` |
| Dates | `date-fns` |
| Forms | Native + `react-hook-form` (create-meeting modal) |
| Backend framework | FastAPI |
| ORM | SQLAlchemy 2.x (sync) |
| Validation / serialization | Pydantic v2 |
| Migrations | Alembic (configured, not exercised in v1) |
| Testing | Backend: `pytest` + `httpx`. Frontend: Vitest + Testing Library + jsdom |
| Lint / format | Backend: `ruff`, `black`. Frontend: ESLint + Prettier |

---

## Repository layout

```
project/
├── backend/                # FastAPI app
│   ├── app/
│   │   ├── api/v1/         # Routers
│   │   ├── core/           # Config, db, logging, errors
│   │   ├── models/         # SQLAlchemy ORM models
│   │   ├── schemas/        # Pydantic v2 schemas
│   │   ├── services/       # Business logic
│   │   ├── repositories/   # Data access
│   │   ├── parsers/        # .txt / .vtt / .json transcript parsers
│   │   ├── seed/           # Realistic demo data + idempotent runner
│   │   └── main.py
│   ├── tests/              # pytest suite (31 tests)
│   ├── requirements.txt
│   ├── alembic/
│   └── .env.example
│
├── frontend/               # Next.js app
│   ├── app/                # Routes (App Router)
│   ├── components/         # UI primitives (Button, Input, Modal, ...)
│   ├── features/           # Feature modules
│   │   ├── shell/            # IconRail, TopBar, ChannelsPanel
│   │   ├── meetings/         # Library, Card, Toolbar, Forms
│   │   ├── meeting-detail/   # Notepad, Notes, Context, Media, RightRail
│   │   └── transcript/       # MediaSyncContext, TranscriptPanel, search
│   ├── hooks/              # TanStack Query wrappers + useTranscriptSearch
│   ├── lib/                # API client, query keys, shared types
│   ├── public/             # Static assets (sample audio)
│   ├── tests/              # Vitest suite (32 unit tests)
│   ├── tailwind.config.ts
│   ├── next.config.js
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── package.json
│
├── docs/                   # Design + contract specs (frozen at Phase 0/1/2/3)
│   ├── FIRELIES_UI_SPEC.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   └── API.md
│
└── README.md               # ← you are here
```

---

## Quick start (local development)

### Prerequisites

- Python ≥ 3.11
- Node.js ≥ 18.17
- npm ≥ 9 (or pnpm / yarn)

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest                       # 31 tests should pass
uvicorn app.main:app --reload --port 8000
```

The first time the app starts with an empty database, it:

1. Creates the SQLite schema (`backend/data/app.db`).
2. Seeds the default user `Naresh`.
3. If `SEED_ON_START=true`, also seeds 8 realistic demo meetings.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server listens on `http://localhost:3000` and proxies `/api/*` to the backend at `http://localhost:8000` via a Next.js rewrite (configured in `next.config.js`).

### Seed on a fresh database

```bash
# From backend/, with the venv active:
SEED_ON_START=true uvicorn app.main:app --port 8000
```

You can also invoke the seeder directly:

```bash
python -m app.seed.seed
```

The seeder is idempotent: it skips meetings whose title already exists and back-fills any missing transcript/summary/sections/action items.

---

## Demo flow

Once both servers are running and the seed has populated the database:

1. Open `http://localhost:3000/` — see the home dashboard.
2. Click **Go to Meetings Library** → see the seeded meetings (Q4 Product Strategy, Weekly Engineering Sync, Customer Discovery — Acme Corp, …).
3. Click **Q4 Product Strategy** → the Notepad opens.
4. **Click any transcript timestamp** (e.g. `00:18`) in the right rail — the bottom media bar jumps to that moment. (If the bundled audio hasn't been replaced with a longer file, this is a 1-second silent WAV; the UI synchronizes against any audio length.)
5. Press the **play** button — the active transcript segment highlights and auto-scrolls into view.
6. Press `J` / `L` to step to the previous / next segment.
7. Type a word (e.g. "roadmap") into the transcript search bar — matches highlight, `↑/↓` (or Enter / Shift+Enter) jump between them.
8. **Toggle a bookmark** with the bottom-bar star — the change is persisted via `PATCH /meetings/{id}`.
9. **Create / Edit / Delete** a meeting via the library's `+ New meeting` button or the Notepad's kebab menu.
10. Toggle the **right-rail tab** between *AskFred* and *Transcript*.
11. Resize the window to mobile width — the icon rail collapses to a hamburger drawer and the Notepad switches to a tab-based view.

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Default | Purpose |
|---|---|---|
| `APP_ENV` | `development` | `development` / `production` — affects logging |
| `DATABASE_URL` | `sqlite:///./data/app.db` | SQLite file path (use absolute path in production) |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated list of allowed origins |
| `LOG_LEVEL` | `INFO` | `DEBUG` / `INFO` / `WARNING` / `ERROR` |
| `DEFAULT_USER_NAME` | `Naresh` | Display name for the seeded user |
| `SEED_ON_START` | `false` | If `true`, lifespan hook runs the seeder at startup |

### Frontend (`frontend/.env.local`)

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000` | Backend base URL (used by the Next.js rewrite proxy) |
| `NEXT_PUBLIC_DEFAULT_USER_NAME` | `Naresh` | Display name for the greeting |
| `NEXT_PUBLIC_DEMO_AUDIO_URL` | `/audio/sample.wav` | Bundled sample audio for all seed meetings |

See `backend/.env.example` and `frontend/.env.example` for canonical templates.

---

## Database & seed data

- SQLite file at `backend/data/app.db` (created automatically).
- WAL mode + foreign-key enforcement enabled via PRAGMAs at connection time.
- Eight realistic seed meetings covering titles, dates, durations, participants, transcripts (16 segments each), summaries (overview + key_points + decisions), sectioned Notes body with inline `(mm:ss)` timestamp links, and 3–6 action items per meeting.
- The default user is seeded automatically on first run.

See `docs/DATABASE.md` for the full schema and `docs/ARCHITECTURE.md` for layering.

---

## Testing

### Backend

```bash
cd backend
source .venv/bin/activate
pytest                  # 31 tests
pytest -q               # quiet
pytest --cov=app        # with coverage (install pytest-cov first)
```

Coverage areas: health endpoint, meetings CRUD + search + filters + sort + pagination, action-item CRUD + cascade-on-delete, topics/chapters derivation, seed idempotency, transcript parser (.txt / .vtt / .json).

### Frontend

```bash
cd frontend
npm test                # 32 unit tests (Vitest)
npm run test:watch      # watch mode
```

Coverage areas: `useTranscriptSearch` (search / navigation / clear / re-sync), `MediaSyncContext` helpers (active-segment computation + step segment), topics / chapters derivation, transcript search offset algorithm.

End-to-end tests via Playwright are deferred for v1 (would require a real browser environment).

---

## Project lifecycle

This project was built in 16 documented phases, each gated on a `NEXT` approval:

| Phase | Output |
|---|---|
| 0 | `docs/FIRELIES_UI_SPEC.md` (UI/UX specification from screenshots) |
| 1 | `docs/ARCHITECTURE.md` (frontend + backend layering, state, deployment) |
| 2 | `docs/DATABASE.md` (relational schema) |
| 3 | `docs/API.md` (REST contract) |
| 4 | Project scaffolding (Next.js + FastAPI + SQLite + vitest + ruff) |
| 5 | Meetings Library vertical slice |
| 6 | Notepad (transcript, summary, action items) |
| 7 | Transcript ↔ Media synchronization |
| 8 | In-transcript search |
| 9 | AI Summary + Action Items UI |
| 10 | Meeting CRUD (Create / Edit / Delete) |
| 11 | Realistic seed data (8 meetings) |
| 12 | Visual polish (design tokens, focus rings, transitions) |
| 13 | Responsive design (icon-rail drawer, Notepad tab switcher, modal full-screen) |
| 14 | UX states (loading skeletons, in-flight spinners, error recovery) |
| 15 | Frontend unit tests (Vitest) |
| 16 | **Documentation** ← you are here |

---

## Deployment notes

Deployment files are at the repository root:

- `Dockerfile` — production-ready container image; uses `gunicorn` + `uvicorn.workers.UvicornWorker`.
- `render.yaml` — Render Blueprint; declares a 1 GB persistent disk at `/app/data` and the env vars below.
- `railway.toml` — Railway manifest; same disk + entrypoint.
- `Procfile` — Heroku / generic PaaS entrypoint.
- `vercel.json` — Vercel config; routes `/api/*` to the deployed backend.
- `.dockerignore` — keeps the build context small.

### Frontend → Vercel

1. Import the repo into a Vercel project, set the **Root Directory** to `frontend`.
2. Set environment variable:
   - `NEXT_PUBLIC_API_BASE_URL=https://fireflies-clone-backend.onrender.com`
3. The `vercel.json` already configures the `/api/*` rewrite to that backend URL — update it to your real backend host.
4. Deploy. Vercel will run `npm run build`.

### Backend → Render / Railway / Fly.io

1. **Render:** create a new Web Service from the repo, choose **Docker**, point to `./Dockerfile`, attach a 1 GB disk at `/app/data`. The `render.yaml` Blueprint does this declaratively.
2. **Railway:** `railway up` (or push to a Railway project). `railway.toml` declares the volume.
3. **Fly.io / Heroku / any container host:** the `Dockerfile` and `Procfile` are portable.
4. Set the env vars from `backend/.env.example` (`APP_ENV=production`, `DATABASE_URL=sqlite:////app/data/app.db`, `CORS_ORIGINS=https://your-app.vercel.app`, `SEED_ON_START=true`).
5. Health check: `GET /api/v1/health` returns `{"status":"ok",...}`.

### Production-mode local smoke test

The backend can be exercised against a gunicorn worker locally exactly as it would in production:

```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt  # installs gunicorn

APP_ENV=production \
DATABASE_URL=sqlite:////tmp/prod.db \
CORS_ORIGINS=https://example.vercel.app \
SEED_ON_START=true \
gunicorn app.main:app -k uvicorn.workers.UvicornWorker \
  --bind 127.0.0.1:8765 --workers 1

# In another shell:
curl http://127.0.0.1:8765/api/v1/health
curl 'http://127.0.0.1:8765/api/v1/meetings?page_size=1' | jq '.total'
```

The boot log includes a single line of the form:

```
Boot: app=0.1.0 env=production version=0.1.0 db=sqlite:////tmp/prod.db seed={'created': 8, 'repaired': 0, 'skipped': 0, 'total': 8}
```

If `APP_ENV=production` and `CORS_ORIGINS` is empty, the boot log emits a `WARNING` so misconfigurations are visible at startup.

### Persistence and CORS

- `DATABASE_URL=sqlite:////app/data/app.db` enables file-based SQLite on the persistent volume.
- WAL mode is already enabled at connection time; the production host should keep the volume mounted at `/app/data`.
- Migrations: Alembic is configured but tables are currently created via `Base.metadata.create_all` at startup. For schema evolution, run `alembic upgrade head` before app startup.
- CORS: set `CORS_ORIGINS` to a comma-separated list of allowed origins. Empty in production triggers a startup warning.

---

## Documentation index

- `docs/FIRELIES_UI_SPEC.md` — UI/UX specification, design tokens, layout
- `docs/ARCHITECTURE.md` — Frontend / backend layering, state, deployment
- `docs/DATABASE.md` — Relational schema, indexes, cascade rules
- `docs/API.md` — REST endpoints, request / response shapes, error envelope

---

## Known limitations

- **No real authentication.** A single default user is seeded; no login flow.
- **No real AI.** Summary content is hand-authored seeded data.
- **Audio is a 1-second silent WAV.** All meetings share the same `media_url`. The transcript sync logic is correct regardless; only playback duration is short.
- **No real-time collaboration.** Bookmarks and action items persist but there is no WebSocket / SSE.
- **No file upload UI for transcripts.** The backend parser supports `.txt` / `.vtt` / `.json`, but the create-meeting form accepts only pasted `.txt`. Upload UI is deferred.
- **Out-of-scope Fireflies features** (AskFred chat, AI Skills, Voice Agents, Integrations, Email Assistant, Billing, SSO) are intentionally NOT implemented; their rail items route to `/coming-soon` per the assignment's scope rule.

---

## License & attribution

This is an SDE assignment project. Original implementation; no Fireflies.ai source code, assets, or branding are used. Icons from `lucide-react` (ISC license). Tailwind CSS (MIT).