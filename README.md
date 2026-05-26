# WebsiteBuilder

> AI-powered, data-driven website builder. Describe a site in natural language — get a live, editable website.

![React](https://img.shields.io/badge/React_19-20232A?style=flat&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![Hono](https://img.shields.io/badge/Hono-E36002?style=flat&logo=hono&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-4169E1?style=flat&logo=postgresql&logoColor=white)
![Drizzle](https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=flat&logo=drizzle&logoColor=black)
![Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?style=flat&logo=google&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=flat&logo=zod&logoColor=white)

![](demo%20images/LandingPage.png)

## How it works

Sites are JSON specs: a list of typed blocks, each mapped to a React module through a central registry. The LLM generates and refines specs from chat; the renderer walks the spec and renders modules. The same modules are editable inline directly in the preview.

```
chat prompt ──▶ LLM (Gemini) ──▶ SiteSpec (JSON) ──▶ Registry ──▶ Live Preview ◀──▶ inline editing

```

Because the spec is the source of truth, the LLM and the visual editor operate on the exact same data — chat edits and click-to-edit changes round-trip cleanly without diverging representations.

## Editor

Generate a site from chat, then refine it — either by talking to the LLM or by clicking directly on the rendered page.

![Generation and chat refinement](demo%20images/GenerationExample.png)

- Generates a landing page first, then expands into subpages in parallel
- Chat refinement with diff-style operation logs (`Page / updated (3 op(s))`)
- Light / dark preview, code view, and "open in new tab" for the published site

![Inline visual editing](demo%20images/EditExample.png)

- Click any text, image or module to edit it directly — no separate inspector panel
- Module palette for inserting new blocks; drag to reorder, arrows to nudge
- Same `SiteSpec` is mutated whether you edit via chat or via click

## Architecture

```
apps/api/        — Hono backend: site CRUD, LLM routes, image search
apps/web/        — React frontend: editor, preview, inline editing
packages/shared/ — Zod schemas, module definitions, shared types
```

| Layer    | Stack                              |
| -------- | ---------------------------------- |
| Frontend | React 19, Vite, React Router       |
| Backend  | Hono on Node                       |
| Database | PostgreSQL 16 + Drizzle ORM        |
| AI       | Google Gemini                      |
| Schema   | Zod (shared across front + back)   |
| Monorepo | pnpm workspaces                    |

Zod schemas live in `packages/shared/` and are imported by both ends, so the LLM output, the API boundary, the database layer and the React renderer all agree on the same module shapes. Adding a new module is a single file: schema, defaults, metadata, React component.

## Modules

37 pre-built, schema-validated modules across three categories:

- **Layout** — Header, Footer, HeroBanner, HeroPerspective, …
- **Content** — TextBlock, MediaText, CardGrid, CardRow, FAQ, Pricing, Timeline, BentoGrid, Spotlight, …
- **Media** — Gallery, VideoFeature, Marquee, …

Each module ships with its Zod schema, sensible defaults and metadata. The LLM is given the schemas directly — it composes specs by picking modules and filling their fields, never by emitting freeform layout code.

## Getting started

Requires Node ≥ 20, pnpm, Docker Desktop, and API keys for Gemini and Pixabay.

```bash
cp .env.example .env   # fill in GEMINI_API_KEY + PIXABAY_API_KEY
docker compose up -d   # starts PostgreSQL
pnpm install
pnpm dev:full          # frontend + backend
```

Open <http://localhost:5173>.

## Design notes

- **Spec, not code** — the LLM produces structured data validated by Zod, not HTML or JSX. Invalid specs are rejected before they ever reach the renderer.
- **One source of truth** — chat edits, inline edits and the database all manipulate the same `SiteSpec` shape.
- **Module registry** — the renderer doesn't know about individual modules; it only knows the registry. New modules are drop-in.
- **Parallel subpage generation** — the landing page streams first so the user sees something fast; subpages are generated concurrently after.

## Status

Personal project. Built to explore how far a strict, schema-first approach can take LLM-driven UI generation compared to letting a model emit raw markup.
