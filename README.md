# Website Builder

KI-gestützter Website-Builder: Sites-Liste → Editor (Chat + Live-Preview) → inline bearbeiten.

**Stack:** React + Vite · Hono (Node) · PostgreSQL 16 · Drizzle ORM · Zod · pnpm Workspaces

## Setup

**Voraussetzungen:** Node ≥ 20, pnpm (`npm i -g pnpm`), Docker Desktop

```bash
pnpm install                             # Abhängigkeiten
cp apps/api/.env.example apps/api/.env   # Env-Datei anlegen
pnpm setup                               # Docker-Postgres starten + DB-Schema anlegen
```

Die LLM- und Pixabay-Aufrufe laufen im Backend. `apps/api/.env` erweitern:

```
GOOGLE_API_KEY=<dein Gemini-Key>     # https://aistudio.google.com/apikey
PIXABAY_API_KEY=<dein Pixabay-Key>   # https://pixabay.com/api/docs/
```

Ohne gesetzte Keys liefert der Editor die Chat-Meldung
„Kein API-Key im Backend gesetzt…".

Das Frontend braucht kein `.env`. Optional `VITE_API_BASE` setzen, falls
der Backend-Port abweicht (Default: `http://localhost:3001`).

## Starten

```bash
pnpm dev:full   # API + Frontend parallel
pnpm dev        # Nur Frontend → http://localhost:5173
pnpm dev:api    # Nur Backend  → http://localhost:3001
```

## Nutzung

1. Auf `/` zeigt die **Sites-Liste** alle gespeicherten Websites. Über **+ Neue Site** wird ein leerer Draft im Backend angelegt.
2. Nach dem Anlegen landet man im **Editor** (`/editor/:identifier`): links Chat-Panel, rechts Live-Preview im Edit-Mode. Der Chat sendet Prompts an das LLM, das die Site generiert oder iterativ weiterentwickelt.
3. Inline-Edits (Texte, Bilder) werden in der Preview direkt vorgenommen und per AutoSave persistiert.
4. Die reine View liegt weiterhin auf `/site?identifier=<slug>` (ohne Editor-UI).

## Routen

| Pfad | Beschreibung |
|---|---|
| `/` | Sites-Liste + „Neue Site"-Dialog |
| `/editor/:identifier` | Editor (Chat + Live-Preview + Inline-Edit) |
| `/site?identifier=<slug>` | Reine Preview/Published-View |

## API

| Methode | Pfad | Zweck |
|---|---|---|
| GET    | `/api/sites` | Alle Sites (Meta) listen |
| POST   | `/api/sites` | Neuen Draft erzeugen (`{name}` → `draft-<slug>`) |
| GET    | `/api/sites/:identifier` | Site-Meta + Page-Liste |
| PATCH  | `/api/sites/:identifier` | Site umbenennen |
| DELETE | `/api/sites/:identifier` | Site löschen (cascade) |
| GET    | `/api/sites/:identifier/spec?path=/` | SiteSpec für den Renderer |
| POST   | `/api/sites/:identifier/blocks` | Block anlegen |
| DELETE | `/api/sites/:identifier/blocks/:blockId` | Block löschen |
| PATCH  | `/api/sites/:identifier/blocks/:blockId/position` | Block verschieben |
| PATCH  | `/api/sites/:identifier/blocks/:blockId/tone` | Tone setzen |
| PATCH  | `/api/sites/:identifier/blocks/:blockId/content` | Einzelnes Content-Feld patchen |
| POST   | `/api/sites/:identifier/assets` | Bild-Upload |
| GET    | `/api/sites/:identifier/messages` | Chat-Verlauf lesen |
| POST   | `/api/sites/:identifier/messages` | Chat-Nachricht anhängen |
| POST   | `/api/llm/generate` | One-shot-Spec aus freiem User-Prompt (ruft Gemini + Pixabay serverseitig) |
| POST   | `/api/llm/refine`   | Refinement-Turn (aktueller Spec + History + neue User-Message → next-Spec) |
