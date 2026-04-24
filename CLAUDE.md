# Website Builder — Module, Schema & Styling Pattern

This project is a **data-driven website builder**. Websites are described as
JSON (a "site spec") and rendered by composing pre-built, parameterized
**modules** (e.g. `Header`) inside generic layout primitives. No module is
hand-wired into a page — a renderer walks the spec and looks modules up in a
central registry.

Three contracts make this work:

1. **Styling contract** — tokens, shared primitives, BEM scoping.
2. **Schema contract** — shared Zod building blocks, no hand-written types.
3. **Module contract** — how modules are declared so the registry, renderer,
   and future editor/LLM can all consume them from one source of truth.

## Repository layout (monorepo)

```
website_builder/
├── apps/
│   ├── api/                         # Express backend
│   └── web/                         # React/Vite frontend
│       ├── src/
│       │   ├── index.css            # Design tokens + global reset
│       │   ├── App.css              # Layout primitives + shared element classes
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   ├── builder/
│       │   │   ├── types.ts         # ModuleDefinition, BlockSpec, SiteSpec
│       │   │   ├── registry.ts      # Central map of all known modules
│       │   │   └── Renderer.tsx     # Walks a SiteSpec and renders it
│       │   └── elements/
│       │       ├── shared/          # Reusable building blocks (not modules)
│       │       │   ├── schemas.ts   # LinkSchema, CardSchema — shared Zod schemas
│       │       │   └── Card.tsx     # Shared <Card> component (.card CSS class)
│       │       ├── layout/
│       │       │   ├── Header/
│       │       │   ├── HeroBanner/
│       │       │   ├── Container/
│       │       │   ├── Footer/
│       │       │   └── FooterSimple/
│       │       ├── content/
│       │       │   ├── TextBlock/
│       │       │   ├── MediaText/
│       │       │   ├── CardRow/
│       │       │   ├── CardGrid/
│       │       │   ├── StatRow/
│       │       │   ├── RecommendationRow/
│       │       │   └── Spotlight/
│       │       └── media/
│       │           ├── ImageBlock/
│       │           └── Gallery/
│       └── index.html
└── packages/
    └── shared/                      # Shared types & utilities
```

Each module folder contains exactly four files:

```
Header/
├── Header.tsx         # React component
├── Header.css         # BEM-scoped styles
├── Header.schema.ts   # Zod schema + defaults + meta
└── index.ts           # Assembles and exports HeaderModule
```

## The CSS layers

### 1. Tokens — [apps/web/src/index.css](apps/web/src/index.css)

The only place colors, spacing, radii, and fonts are defined. Exposed as CSS
custom properties. Also holds the global reset, including:

```css
*, *::before, *::after { box-sizing: border-box; }
```

**Never** declare `box-sizing` or `font-family` inside a module — both are
already inherited from the global reset.

### 2. Shared primitives — [apps/web/src/App.css](apps/web/src/App.css)

Layout primitives (`.vertical_layout`, `.horizontal_layout`) **and** shared
element base classes that modules compose with their own BEM class:

| Class | What it provides |
|---|---|
| `.section` | `width: 100%`, standard padding, `background: var(--surface)` |
| `.card` | flex-column card shell, radius, background |
| `.card__img` | full-width fixed-height image |
| `.card__title` | standard card heading style |
| `.card__body`  | standard card body text style |

A standard content module applies both its own class and a shared base:

```tsx
<div className="section text_block" data-align={align}>
```

This means changing section padding in one place updates every content module
automatically. Only add module-specific rules to the module's own CSS file.

### 3. Module styles — `apps/web/src/elements/<category>/<Name>/<Name>.css`

BEM-scoped classes for everything that is unique to this module. The module
imports its own CSS (`import './Header.css'`), not the other way around.

## Chrome vs. Module tokens

The design system has **two parallel token scopes** in
[apps/web/src/index.css](apps/web/src/index.css):

| Scope | Prefix | Used by | Examples |
|---|---|---|---|
| **Module tokens** | `--primary`, `--background`, `--surface`, `--text`, `--muted_text`, `--accent`, … | Everything under `apps/web/src/elements/` (the generated website) | Header, HeroBanner, Card, Footer |
| **Chrome tokens** | `--ui_*` | Editor shell: `apps/web/src/pages/`, `apps/web/src/builder/`, `apps/web/src/App.css` root scaffolding | EditorPage, ChatPanel, BuilderPage, EditModeToolbar |

**Hard rule:** Modules **must never** read `--ui_*`, chrome **must never** read
module tokens for core surfaces/text/accents. Breaking this couples the
generated site's appearance to the editor's appearance, which is the one thing
we never want.

**Permitted exception:** the editor's preview-frame container
(`.editor_page__preview-frame`) sets `background: var(--background)` because
it literally *is* the module canvas — the site inside will be painted over it,
and we want the correct blank-canvas color to show before the first module's
own surface does. This is the only chrome CSS rule that consumes a module
token, and it's load-bearing: don't replace it with `#FFFFFF` or `--ui_*`.

Chrome tokens encode a fixed dark aesthetic (Vercel-style: pure black base,
hairline borders, white pill CTAs, vibrant spectrum as art). Module tokens
encode whatever the *site* wants to look like — and a SiteSpec's `theme`
override only affects module tokens.

## Styling rules

- **Never hardcode** colors, spacing, or fonts. Always use `var(--…)` tokens.
- **No inline styles** except for genuinely dynamic values (e.g. a `background`
  color passed as a prop that can be any CSS string).
- **No `font-family` or `box-sizing` in module CSS** — they're global.
- **No global element selectors** (`button {}`, `p {}`) outside `index.css`.
- **Use `.section` for standard content/media blocks.** Apply it alongside
  the module's own BEM root class. Override only what differs.
- **Card structure lives in `.card*` classes.** Use the shared `<Card>`
  component. Override per-context via a parent selector (e.g.
  `.card_row .card { flex: 0 0 280px; }`).

## Shared schemas — [apps/web/src/elements/shared/schemas.ts](apps/web/src/elements/shared/schemas.ts)

Two Zod schemas are used by multiple modules. Always import them instead of
redefining locally:

```ts
import { LinkSchema, CardSchema } from '../../shared/schemas';
// or
import type { Link, CardData } from '../../shared/schemas';
```

| Export | Shape | Used by |
|---|---|---|
| `LinkSchema` | `{ label: string; href: string }` | Header, Footer, FooterSimple |
| `CardSchema`  | `{ title, body?, imageSrc?, imageAlt? }` | CardRow, CardGrid |

## The module contract

Every module is a **`ModuleDefinition`** (see [apps/web/src/builder/types.ts](apps/web/src/builder/types.ts)):

```ts
interface ModuleDefinition<P> {
    meta: ModuleMeta;        // name, category, description, tags
    propsSchema: ZodType<P>; // single source of truth for the props shape
    defaults: P;             // starter props, so a fresh block always renders
    Component: ComponentType<P>;
}
```

Props types are derived from the schema via `z.infer` — never hand-written.

`meta.name` is the registry key and must match the folder name.

## The registry

[apps/web/src/builder/registry.ts](apps/web/src/builder/registry.ts) is the single place that
knows every module. Import `<Name>Module` and add it to the `modules` array.
That is the only central change adding a module requires.

## The site spec

```ts
interface SiteSpec {
    theme?: Record<string, string>;  // optional token overrides applied to :root
    blocks: BlockSpec[];             // vertical stack, rendered in order
}

interface BlockSpec {
    type: string;                    // must match a ModuleDefinition.meta.name
    props: Record<string, unknown>;  // validated against that module's propsSchema
}
```

Container modules (e.g. `Container`) declare `children: BlockSpec[]` in their
schema. The renderer recurses into it — nesting has no other mechanism.

## Adding a new module

1. Create `apps/web/src/elements/<category>/Foo/` with:
   - `Foo.tsx` — import `'./Foo.css'` at the top; apply `.section` if it's a
     standard full-width content block
   - `Foo.css` — BEM-scoped classes (`.foo`, `.foo__part`), tokens only
   - `Foo.schema.ts` — import shared schemas where applicable (`LinkSchema`,
     `CardSchema`); export `FooPropsSchema`, `FooDefaults`, `FooMeta`, and
     `type FooProps = z.infer<typeof FooPropsSchema>`
   - `index.ts` — assembles and exports `FooModule: ModuleDefinition`
2. Register `FooModule` in [apps/web/src/builder/registry.ts](apps/web/src/builder/registry.ts).
3. Reference `Foo` in a spec by name: `{ "type": "Foo", "props": { … } }`.

## Tokens reference

Defined in [apps/web/src/index.css](apps/web/src/index.css):

- **Colors:** `--primary`, `--secondary`, `--accent`, `--alt_primary`,
  `--alt_secondary`, `--background`, `--surface`, `--text`, `--muted_text`,
  `--inverted_text`
- **Spacing:** `--space_xs` (4px) → `--space_xl` (40px)
- **Radii:** `--radius_sm`, `--radius_md`
- **Typography:** `--font_family`
