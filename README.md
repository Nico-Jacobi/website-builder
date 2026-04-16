# Website Builder

KI-gestützter Website-Builder: Prompt → Website generieren → Backend publishen.

**Stack:** React + Vite · Hono (Node) · PostgreSQL 16 · Drizzle ORM · Zod · pnpm Workspaces

## Setup

**Voraussetzungen:** Node ≥ 20, pnpm (`npm i -g pnpm`), Docker Desktop

```bash
pnpm install                        # Abhängigkeiten
docker compose up -d                # Postgres auf Port 5434
cp apps/api/.env.example apps/api/.env   # Env-Datei anlegen
pnpm --filter api db:migrate        # DB-Schema migrieren
```

Für das Frontend optional `apps/web/.env.local` anlegen:

```
VITE_GOOGLE_API_KEY=...
VITE_PIXABAY_API_KEY=...
VITE_API_BASE=http://localhost:3001
```

## Starten

```bash
pnpm dev        # Frontend  → http://localhost:5173
pnpm dev:api    # Backend   → http://localhost:3001
```

## Nutzung

1. Prompt eingeben → **Generieren** → Vorschau erscheint
2. Im Publish-Panel Slug + Name eingeben → **Ins Backend pushen**
3. Site abrufbar unter `/site?slug=<slug>` (lädt aus DB)

## API

| | Pfad | |
|---|---|---|
| GET | `/api/sites/:slug/spec?path=/` | SiteSpec für den Renderer |
| POST | `/api/_seed` | SiteSpec in DB schreiben (dev) |
