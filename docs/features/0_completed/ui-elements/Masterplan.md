# Masterplan: UI Elements — Stackable Module Library

## 1. Goal

Add five production-ready, stackable UI modules to the website builder so that
a complete informational website can be assembled from JSON alone, without any
hand-written page code.

**Modules:**
| Module | Purpose |
|---|---|
| `ImageBlock` | Full-width image with optional caption |
| `TextBlock` | Heading + body paragraph + optional subtext |
| `MediaText` | Image beside text (image-left or image-right) |
| `CardRow` | Horizontal row of image-title-body cards; scrollable on mobile |
| `Container` | Wraps child `BlockSpec[]` in a styled section (bg color, padding, optional scroll) |

## 2. Architecture

### Nesting contract
- Max **1 level** of nesting: only `Container` accepts children; its children are
  leaf modules only (`ImageBlock`, `TextBlock`, `MediaText`, `CardRow`).
- No `Container` inside a `Container`. Enforced by the Zod schema (`children` is
  typed as `BlockSpec[]` without recursive Container support).

### Renderer support
`Renderer.tsx` already walks `BlockSpec[]`. `Container` passes its `children`
array back to the renderer recursively (same pattern described in CLAUDE.md for
future container modules).

### Module contract (unchanged)
Every module ships: `<Name>.tsx` + `<Name>.css` + `<Name>.schema.ts` + `index.ts`.
Registered in `src/builder/registry.ts`. No other central edits required.

## 3. Module Specifications

### ImageBlock
```
props:
  src: string            (required)
  alt: string            (required, accessibility)
  caption?: string
  objectFit?: 'cover' | 'contain' | 'fill'  (default: 'cover')
  maxHeight?: number     (px, default: 480)
```

### TextBlock
```
props:
  heading?: string
  body: string           (required)
  subtext?: string
  align?: 'left' | 'center' | 'right'  (default: 'left')
```

### MediaText
```
props:
  imageSrc: string       (required)
  imageAlt: string       (required)
  heading?: string
  body: string           (required)
  imagePosition?: 'left' | 'right'  (default: 'left')
```

### CardRow
```
props:
  cards: Array<{
    imageSrc?: string
    imageAlt?: string
    title: string
    body?: string
  }>                     (min 1 card)
```
Layout: flex-row, `overflow-x: auto` on mobile, fixed card width (~280 px).

### Container
```
props:
  children: BlockSpec[]  (min 1)
  background?: string    (CSS color or token name, default: transparent)
  paddingY?: 'none' | 'sm' | 'md' | 'lg'  (default: 'md')
  maxWidth?: number      (px, optional — constrains inner content)
  scrollable?: boolean   (enables overflow-y: auto with max-height)
  maxHeight?: number     (px, only relevant when scrollable: true)
```

## 4. CSS / Styling Approach

- All new CSS files follow BEM: `.image_block`, `.image_block__img`, `.image_block__caption`, etc.
- No inline styles except truly dynamic values (e.g. `style={{ maxHeight: props.maxHeight }}`).
- No hardcoded colors/spacing — always `var(--…)` from `index.css`.
- New tokens needed: none. Existing token set is sufficient.
- Responsive breakpoint for `MediaText` and `CardRow`: stack vertically below ~640 px
  using a CSS media query.

## 5. File Changesets

### New files (20 total, 4 per module)
```
src/elements/ImageBlock/{ImageBlock.tsx, ImageBlock.css, ImageBlock.schema.ts, index.ts}
src/elements/TextBlock/{TextBlock.tsx, TextBlock.css, TextBlock.schema.ts, index.ts}
src/elements/MediaText/{MediaText.tsx, MediaText.css, MediaText.schema.ts, index.ts}
src/elements/CardRow/{CardRow.tsx, CardRow.css, CardRow.schema.ts, index.ts}
src/elements/Container/{Container.tsx, Container.css, Container.schema.ts, index.ts}
```

### Modified files (2)
- `src/builder/registry.ts` — add 5 new module imports + registrations
- `src/App.tsx` — optional: add demo blocks to the dev spec (not required for contract)

### Deleted files
None. No existing code is replaced or deprecated.

## 6. Implementation Plans

Split into two focused plans:

| Plan | Contents |
|---|---|
| `01_Leaf_Modules.md` | ImageBlock, TextBlock, MediaText, CardRow (no nesting) |
| `02_Container_Module.md` | Container (renderer recursion, children schema) |

## 7. Risks & Constraints

| Risk | Mitigation |
|---|---|
| Container children schema must not allow infinite nesting | Zod schema uses `z.array(BlockSpecSchema)` — BlockSpecSchema is a plain `{type, props}` shape, not a recursive Container |
| Renderer must handle `children` prop | Check Renderer.tsx supports recursion — add if missing |
| Mobile layout for CardRow / MediaText | CSS media queries only, no JS |

## 8. Acceptance Criteria

- [ ] All 5 modules pass their own Zod schema with `safeParse(defaults)`
- [ ] All 5 modules render without errors when placed in the dev spec
- [ ] Container renders nested leaf blocks correctly (at least 2 children)
- [ ] CardRow scrolls horizontally on narrow viewports
- [ ] MediaText stacks vertically on narrow viewports
- [ ] Registry lists all 6 modules (Header + 5 new)
- [ ] No inline style except computed dynamic values
- [ ] No hardcoded color/spacing values in any new CSS file
