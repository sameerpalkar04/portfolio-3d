# Mindgarden

A calm, private space for building a personal library of ideas. Each account has its own notes and its own knowledge graph. You add tags, connect related notes, and watch your knowledge take shape over time.

## What you can do

- **Capture:** write in Markdown, start from a template, and drafts save as you type.
- **Connect:** tags, named relationships, backlinks and related-note suggestions.
- **Grow:** explore notes in a searchable graph, grouped and coloured by tag.

## Features

- **Stay organised** with search, related-term matching, tag filters, sorting, pins, archive and trash.
- **Pick up where you left off** with daily notes, reminders and version history you can restore.
- **Keep ideas portable** with Markdown, CSV and JSON import and export, plus file attachments.
- **Work offline** with local drafts that sync when you reconnect.
- **Share selectively** with read-only access for other Mindgarden accounts, revocable at any time.
- **Get a little perspective** from quick summaries and related-idea suggestions, generated locally without an external AI service.

## Built with

| Area | Tools |
|---|---|
| Frontend | React, TypeScript, Vite, React Router, React Flow |
| Backend | Node.js, Express, Prisma |
| Database | PostgreSQL |
| Authentication | Hashed passwords and JWT |

## Project layout

| Folder | Contents |
|---|---|
| `backend/` | Express API, Prisma schema and migrations, authentication and data services |
| `frontend/` | React app, dashboard, note editor and graph explorer |

## Running it locally

1. Create a PostgreSQL database. Copy `backend/.env.example` to `backend/.env`, then set `DATABASE_URL` and a private `JWT_SECRET`.
2. Start the backend:

```bash
cd backend
npm install
npx prisma migrate deploy
npm run dev
```

3. In another terminal, copy `frontend/.env.example` to `frontend/.env` and start the frontend:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and the API at `http://localhost:3000` by default. If your ports differ, set `VITE_API_URL` and `FRONTEND_ORIGIN` in the environment files.
