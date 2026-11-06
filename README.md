# Zara Ganjlik — Staff Portal

Internal staff portal for **Zara Ganjlik Mall** — schedules, trainings, briefings, a team
moments feed, and admin tools for managing crew, staff, and owner accounts.

**Live:** [zara-react.vercel.app](https://zara-react.vercel.app)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Serverless-000000?logo=vercel&logoColor=white)
![Postgres](https://img.shields.io/badge/Postgres-Neon-4169E1?logo=postgresql&logoColor=white)

## Features

- Weekly work schedules parsed directly from the uploaded Excel roster
- Staff trainings with completion tracking, and admin-posted briefings
- A moments feed with comments and reactions
- Admin panel for managing crew, staff, and owner accounts, with per-section permissions
- Email-based password reset, forced password change for new accounts
- Multi-language UI (Azerbaijani, English, Russian), light/dark theme

## Project structure

- `frontend/` — React + Vite + Tailwind v4 app (entry point referenced from `index.html`)
- `backend/` — the actual server code: route handlers, auth helpers, DB schema
  (`backend/schema.sql`), and one-off maintenance scripts (`backend/scripts/`)
- `api/` — three thin files that re-export the handlers from `backend/`. Vercel only
  auto-detects Serverless Functions in a top-level `/api` folder, so this exists purely to
  satisfy that requirement — edit `backend/` for actual logic.

See [`PROGRESS.md`](PROGRESS.md) for the backend architecture and database setup steps.

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
