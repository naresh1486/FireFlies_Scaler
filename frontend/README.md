# Frontend — Fireflies Clone

Next.js 14 (App Router) + TypeScript + Tailwind + TanStack Query.

## Setup

```bash
npm install
cp .env.example .env.local
```

## Run

```bash
npm run dev
```

- App: http://localhost:3000
- `/api/*` is proxied to `NEXT_PUBLIC_API_BASE_URL` via Next.js rewrites (default `http://localhost:8000`).

## Scripts

- `npm run dev` — Next.js dev server
- `npm run build` — production build
- `npm run start` — serve production build
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript