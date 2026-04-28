# Website Builder

Data-driven site builder. Sites = JSON spec → registry lookup → render. Three contracts: styling (tokens/BEM), schema (Zod), module (ModuleDefinition).

## Repo layout

```
apps/api/                          # Express backend
apps/web/src/
  index.css                        # Design tokens + global reset
  App.css                          # Layout primitives + shared element classes
  builder/
    types.ts                       # ModuleDefinition, BlockSpec, SiteSpec
    registry.ts                    # Central module map
    Renderer.tsx                   # Walks SiteSpec, renders modules
  elements/
    shared/schemas.ts              # LinkSchema, CardSchema
    shared/Card.tsx                # Shared <Card> component
    layout/   Header HeroBanner Container Footer FooterSimple
    content/  TextBlock MediaText CardRow CardGrid StatRow RecommendationRow Spotlight
    media/    ImageBlock Gallery
packages/shared/                   # Shared types & utilities
```

Each module: `Foo.tsx`, `Foo.css`, `Foo.schema.ts`, `index.ts`.

## CSS layers

1. **`index.css`** — tokens only. Never redeclare `box-sizing` or `font-family` in modules (already global).
2. **`App.css`** — shared primitives: `.section` (full-width, padded, `var(--surface)`), `.card`, `.card__img`, `.card__title`, `.card__body`, `.vertical_layout`, `.horizontal_layout`. Content modules use `<div className="section my_module">`.
3. **`<Name>.css`** — BEM-scoped module-specific rules only. Module imports its own CSS.

## Token scopes

| Scope | Prefix | Used by |
|---|---|---|
| Module tokens | `--primary`, `--background`, `--surface`, `--text`, `--muted_text`, `--accent`, … | Everything in `elements/` |
| Chrome tokens | `--ui_*` | Editor shell: `pages/`, `builder/`, App.css scaffolding |

**Hard rule:** modules never read `--ui_*`; chrome never reads module tokens — except `.editor_page__preview-frame { background: var(--background) }` (load-bearing, don't change).

## Styling rules

- No hardcoded colors/spacing/fonts — always `var(--…)`
- No inline styles except genuinely dynamic CSS values
- No global element selectors outside `index.css`
- Use `.section` + module BEM class for content/media blocks
- Use shared `<Card>` + `.card*` classes; override via parent selector

## Shared schemas

```ts
import { LinkSchema, CardSchema } from '../../shared/schemas';
```

- `LinkSchema` — `{ label, href }` — Header, Footer, FooterSimple
- `CardSchema` — `{ title, body?, imageSrc?, imageAlt? }` — CardRow, CardGrid

## Module contract

```ts
interface ModuleDefinition<P> {
  meta: ModuleMeta;        // name (= registry key = folder name), category, description, tags
  propsSchema: ZodType<P>; // source of truth — never hand-write prop types
  defaults: P;
  Component: ComponentType<P>;
}
```

Props via `z.infer<typeof FooPropsSchema>`. `meta.name` must match folder name.

## Site spec

```ts
interface SiteSpec { theme?: Record<string, string>; blocks: BlockSpec[]; }
interface BlockSpec { type: string; props: Record<string, unknown>; }
```

`Container` modules nest via `children: BlockSpec[]`; renderer recurses.

## Adding a module

1. Create `elements/<category>/Foo/` with `Foo.tsx`, `Foo.css`, `Foo.schema.ts`, `index.ts`
   - `Foo.schema.ts` exports: `FooPropsSchema`, `FooDefaults`, `FooMeta`, `type FooProps`
   - `Foo.tsx` imports `'./Foo.css'`; applies `.section` if full-width content block
2. Register `FooModule` in `registry.ts`

## Tokens reference (`index.css`)

- **Colors:** `--primary` `--secondary` `--accent` `--alt_primary` `--alt_secondary` `--background` `--surface` `--text` `--muted_text` `--inverted_text`
- **Spacing:** `--space_xs` (4px) `--space_sm` `--space_md` `--space_lg` `--space_xl` (40px)
- **Radii:** `--radius_sm` `--radius_md`
- **Typography:** `--font_family`
