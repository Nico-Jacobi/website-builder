# Masterplan: Module Variants

## 1. Goal

Add **6 focused variants** — sibling modules in the same category folders as their
originals — covering the visual gaps that a real website needs but the base modules
don't cover. Every new module follows the full contract: Zod schema with JSDoc,
typed defaults, BEM CSS with token vars only, registered in registry.ts.

No sloppy code. No undocumented fields. No hardcoded values.

## 2. Selected Variants (and why)

| Module | Category | Variant of | What makes it distinct |
|---|---|---|---|
| `HeroBanner` | layout | Header | Full-width centered hero: large heading, subheading, CTA button. Header is a top nav bar — this is a landing hero section. |
| `FooterSimple` | layout | Footer | Single row: tagline left + flat link list right. No column groups. For minimal sites or secondary pages. |
| `Callout` | content | TextBlock | Accent-colored left-border box with icon slot. Visual pull-quote or warning. TextBlock has no visual weight. |
| `StatRow` | content | TextBlock | Row of big-number + label tiles (e.g. "10 k+ Users"). Marketing stat blocks can't be built with TextBlock. |
| `CardGrid` | content | CardRow | Same card shape as CardRow but in a CSS grid (2–3 columns, wraps). CardRow is horizontal-scroll; this wraps into rows. |
| `Gallery` | media | ImageBlock | 2–4 images in a responsive CSS grid. ImageBlock is a single image; this is a multi-image layout. |

**Skipped:** Container variant — Container is already fully configurable via props.
**Skipped:** MediaText stacked — achievable with existing MediaText on mobile; not a distinct enough module to justify its own registration.

## 3. Architecture

- All 6 modules are **drop-in siblings** in the existing category folders.
- Same 4-file structure per module: `schema.ts`, `.tsx`, `.css`, `index.ts`.
- BEM root class is the snake_case module name: `.hero_banner`, `.footer_simple`, etc.
- Data attributes for bounded-enum variants, inline style only for dynamic values.
- All schemas include **JSDoc comments** on every field.
- Registry: 6 new imports + array entries. No other files change.

## 4. Module Specifications

### HeroBanner (`layout/HeroBanner`)
```
/** Full-width centered hero section. Place directly below the Header. */
props:
  heading:    string           (required) — large H1
  subheading?: string          — smaller paragraph below heading
  ctaLabel?:  string           — button label; no button rendered if omitted
  ctaHref?:   string           — button href
  background?: string          (default: var(--primary)) — inline, dynamic
  textColor?:  'light'|'dark'  (default: 'light') — drives data attribute
```
Layout: full-width, centered text, `--space_xl` padding. Button uses `--accent`.

### FooterSimple (`layout/FooterSimple`)
```
/** Minimal single-row footer: tagline on the left, flat links on the right. */
props:
  tagline?:   string
  copyright?: string
  links?:     Array<{ label: string; href: string }>
```
Layout: flex row, space-between, wraps on mobile. Same `--primary` background as Footer.

### Callout (`content/Callout`)
```
/** Accent-bordered highlight box — use for tips, warnings, or pull quotes. */
props:
  icon?:    string   — emoji or short text displayed in a badge (e.g. '💡' or '!')
  heading?: string
  body:     string   (required)
  tone?:    'info'|'success'|'warning'|'danger'  (default: 'info')
             — drives border/badge color via data attribute
```
Layout: left-border (4 px) colored by `tone`, badge floats top-left if icon provided.
Tone → token mapping: info→`--primary`, success→`--alt_primary`, warning→`--accent`, danger→`--accent` (same token, can be differentiated later with a new token).

### StatRow (`content/StatRow`)
```
/** Row of statistic tiles — big number/value with a descriptive label. */
props:
  stats: Array<{
    value: string   (required) — e.g. '10k+' or '99%'
    label: string   (required) — e.g. 'Active Users'
  }>                min 1
  align?: 'left'|'center'  (default: 'center')
```
Layout: flex row, wraps, equal-width tiles. Value is large (`3rem`), label is small muted.

### CardGrid (`content/CardGrid`)
```
/** Grid of image-title-body cards that wraps into rows — unlike CardRow's horizontal scroll. */
props:
  cards: Array<{
    imageSrc?: string
    imageAlt?: string
    title:     string   (required)
    body?:     string
  }>             min 1
  columns?: 2|3  (default: 3) — CSS grid columns on desktop; always 1 on mobile
```
Layout: CSS `grid-template-columns: repeat(<columns>, 1fr)`. Same card internals as CardRow.

### Gallery (`media/Gallery`)
```
/** Responsive grid of 2–4 images. */
props:
  images: Array<{
    src:      string   (required)
    alt:      string   (required)
    caption?: string
  }>             min 2, max 4
  columns?: 2|3  (default: 2)
  gap?:     'sm'|'md'|'lg'  (default: 'md') — drives data attribute
```
Layout: CSS grid, aspect-ratio `4/3` on each image, optional caption below each.

## 5. CSS / Styling Rules

- **No new tokens required.** All designs use the existing token set.
- BEM root classes are all new names → zero collision with existing modules.
- `tone` and `align` and `columns` and `gap` → `data-*` attributes → CSS attribute selectors.
- `background` in HeroBanner → inline style (dynamic CSS color).
- Responsive: `@media (max-width: 640px)` used in StatRow, CardGrid, Gallery.

## 6. File Changesets

### New files (24 total, 4 per module)
```
src/elements/layout/HeroBanner/{HeroBanner.tsx, HeroBanner.css, HeroBanner.schema.ts, index.ts}
src/elements/layout/FooterSimple/{FooterSimple.tsx, FooterSimple.css, FooterSimple.schema.ts, index.ts}
src/elements/content/Callout/{Callout.tsx, Callout.css, Callout.schema.ts, index.ts}
src/elements/content/StatRow/{StatRow.tsx, StatRow.css, StatRow.schema.ts, index.ts}
src/elements/content/CardGrid/{CardGrid.tsx, CardGrid.css, CardGrid.schema.ts, index.ts}
src/elements/media/Gallery/{Gallery.tsx, Gallery.css, Gallery.schema.ts, index.ts}
```

### Modified files (1)
- `src/builder/registry.ts` — 6 new imports + array entries

### Deleted files
None.

## 7. Implementation Plans

Split by category to stay under the size threshold:

| Plan | Modules | New files |
|---|---|---|
| `01_Layout_Variants.md` | HeroBanner, FooterSimple | 8 |
| `02_Content_Variants.md` | Callout, StatRow, CardGrid | 12 |
| `03_Media_Variants.md` | Gallery | 4 |

Registry is updated at the end of each plan (partial) or consolidated in plan 03.

## 8. Acceptance Criteria

- [ ] All 6 modules: `<Name>PropsSchema.safeParse(<Name>Defaults)` → success
- [ ] All 6 modules render without error in dev spec
- [ ] HeroBanner CTA button renders only when `ctaLabel` is provided
- [ ] Callout `tone` changes left-border color via `data-tone` CSS selector
- [ ] CardGrid `columns={2}` renders a 2-column grid, `columns={3}` renders 3
- [ ] Gallery rejects `images.length < 2` or `> 4` at schema level
- [ ] StatRow wraps gracefully at mobile widths
- [ ] FooterSimple renders without columns prop (all fields optional)
- [ ] Registry exports 13 modules total (7 existing + 6 new)
- [ ] Zero hardcoded color/spacing values in any new CSS file
- [ ] Every schema field has a JSDoc comment
- [ ] No inline style except genuinely dynamic values (background, computed px)
