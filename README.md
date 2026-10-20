# Zara Ganjlik — Staff Portal

Internal staff portal for Zara Ganjlik Mall: schedules, trainings, briefings,
moments feed, and admin tools for managing crew/staff/owner accounts.

- **Frontend:** `frontend/` — React + Vite + Tailwind v4 (see `index.html` for the entry point)
- **Backend:** `backend/` — Vercel serverless functions + Postgres (Neon). `api/` only holds
  thin re-export shims required by Vercel's routing — edit `backend/` for actual logic.

See [`PROGRESS.md`](PROGRESS.md) for the backend architecture and setup steps.

## Local development

```
npm install
npx vercel dev
```

`npm run dev` only starts Vite — the `/api` functions won't respond. Use `vercel dev`
for full-stack local development.

## Build

```
npm run build
```
