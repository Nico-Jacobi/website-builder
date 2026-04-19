# Website Builder

KI-gestützter Website-Builder: Prompt → Website generieren → Backend publishen.

**Stack:** React + Vite · Hono (Node) · PostgreSQL 16 · Drizzle ORM · Zod · pnpm Workspaces

## Setup

**Voraussetzungen:** Node ≥ 20, pnpm (`npm i -g pnpm`), Docker Desktop

```bash
pnpm install                             # Abhängigkeiten
cp apps/api/.env.example apps/api/.env   # Env-Datei anlegen
pnpm setup                               # Docker-Postgres starten + DB-Schema anlegen
```

Optional `apps/web/.env.local`:

```
VITE_GOOGLE_API_KEY=...
VITE_PIXABAY_API_KEY=...
VITE_API_BASE=http://localhost:3001
```

## Starten

```bash
pnpm dev:full   # API + Frontend parallel
pnpm dev        # Nur Frontend → http://localhost:5173
pnpm dev:api    # Nur Backend  → http://localhost:3001
```

## Nutzung

1. Prompt eingeben → **Generieren** → Vorschau erscheint
2. Im Publish-Panel Slug + Name eingeben → **Ins Backend pushen**
3. Site abrufbar unter `/site?identifier=<slug>` (lädt aus DB)

## API

| Methode | Pfad | Zweck |
|---|---|---|
| GET  | `/api/sites/:identifier/spec?path=/` | SiteSpec für den Renderer |
| POST | `/api/_seed` | SiteSpec in DB schreiben |
| PATCH | `/api/sites/:identifier/blocks/:blockId/content` | Einzelnes Content-Feld patchen |
| POST | `/api/sites/:identifier/assets` | Bild-Upload |
