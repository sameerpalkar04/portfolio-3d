# Afterword — The Recap Journal

A React and Express app for browsing TV shows and generating short episode recaps. It supports Google sign-in, guest recaps, a saved recap history, Redis caching and PostgreSQL storage.

## How it works

- **Show search and popular shows** come from the TMDB API, called from the server so the key never reaches the browser.
- **Recaps** are generated server-side with Google Gemini.
- **Signed-in recaps** are cached by show, season and episode, and saved in PostgreSQL under the Google account.
- **Guest recaps** skip the cache entirely and aren't saved.
- **Deleting a saved recap** removes it from that account's history; the shared cache entry expires on its own TTL.

## Architecture

| Layer | What it does |
|---|---|
| Frontend | React and TypeScript on Vite; proxies `/api` to the backend in development |
| Backend | Express API for search, recap generation, auth and history |
| Cache | Redis, shared by every backend instance for recap caching and rate limits |
| Database | PostgreSQL for user accounts and saved recaps |
| Gateway | Traefik routes requests and load-balances across backend containers |

## Authentication

- Google OAuth 2.0 sign-in and sign-up.
- OAuth state and login cookies are signed with an HMAC session secret.
- Cookies are marked secure when served over HTTPS.

## Running it locally

1. Copy `backend/.env.example` to `backend/.env` and set `TMDB_API_KEY`, `GEMINI_API_KEY` and the Google OAuth values.
2. Start Redis and PostgreSQL with `docker compose up -d redis postgres`.
3. Run `npm install` and `npm run dev` from the project root. Vite runs on port 5173 and the API on port 3001.

## Running in containers

```bash
docker compose up --build
```

The app opens at `http://localhost:8080`. To scale the API horizontally:

```bash
docker compose up --build --scale backend=3
```

## HTTPS deployment

A second Compose file adds HTTPS with Let's Encrypt certificates through Traefik:

```bash
docker compose -f docker-compose.yml -f docker-compose.https.yml up --build -d
```

## Key environment variables

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Server-side credential for recap generation |
| `TMDB_API_KEY` | Server-side credential for show search |
| `REDIS_URL` | Shared recap cache and rate-limit store |
| `DATABASE_URL` | PostgreSQL account and saved-recap store |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth client credentials |
| `AUTH_SESSION_SECRET` | HMAC signing key for OAuth state and login cookies |
| `AUTH_COOKIE_SECURE` | `true` for HTTPS deployments |
