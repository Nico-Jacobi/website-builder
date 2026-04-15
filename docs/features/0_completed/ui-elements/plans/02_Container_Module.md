# Plan 02: Container Module

## Goal

Implement the `Container` module — the only layout module that wraps other blocks. Accepts `children: BlockSpec[]`, renders them through the existing Renderer recursion, and provides configurable background, vertical padding, max-width, and vertical scrolling.

**Depends on:** Plan 01 (`01_Leaf_Modules`) having registered the four leaf modules.

---

## Renderer Status — No Changes Needed

`Renderer.tsx` already materializes `BlockSpec[]` props via `materializeBlockProps`. When it encounters an array where every element satisfies `isBlockSpec`, it maps each item through `renderBlock`, producing `ReactNode[]`. The Container component receives already-rendered children — it just places `{children}` in its JSX.

---

## Files to Create / Modify

**New (4):**
```
src/elements/Container/Container.schema.ts
src/elements/Container/Container.tsx
src/elements/Container/Container.css
src/elements/Container/index.ts
```

**Modified (1):**
```
src/builder/registry.ts   — add ContainerModule import + registration
```

---

## Step-by-Step Implementation

### Step 1 — `Container.schema.ts`

`children` uses a locally-defined flat `BlockSpecSchema` — not imported from `types.ts` (which only has a TS interface, not a Zod object). The flat shape enforces the 1-level nesting limit at the schema level: `BlockSpecSchema` cannot express a nested Container.

```ts
import { z } from 'zod';
import type { ModuleMeta } from '../../builder/types';

/**
 * Flat block spec schema. Intentionally does not include a recursive Container
 * shape — this enforces the "max 1 level of nesting" constraint.
 * Each child's props are validated by its own module schema inside the renderer.
 */
const BlockSpecSchema = z.object({
    type:  z.string(),
    props: z.record(z.unknown()),
});

export const ContainerPropsSchema = z.object({
    children:   z.array(BlockSpecSchema).min(1),
    background: z.string().optional(),
    paddingY:   z.enum(['none', 'sm', 'md', 'lg']).optional(),
    maxWidth:   z.number().optional(),
    scrollable: z.boolean().optional(),
    maxHeight:  z.number().optional(),
});

export type ContainerProps = z.infer<typeof ContainerPropsSchema>;

export const ContainerDefaults: ContainerProps = {
    children:  [{ type: 'TextBlock', props: { body: 'Container content' } }],
    paddingY:  'md',
    scrollable: false,
};

export const ContainerMeta: ModuleMeta = {
    name:        'Container',
    category:    'layout',
    description: 'Wraps one or more blocks in a styled section with configurable background, vertical padding, optional max-width, and optional vertical scrolling.',
    tags:        ['container', 'layout', 'section', 'wrapper'],
};
```

### Step 2 — `Container.tsx`

The Renderer materializes `children: BlockSpec[]` → `ReactNode[]` before calling the component. We reconcile this with a `ContainerRenderProps` type that replaces `children` with `ReactNode`.

```tsx
import './Container.css';
import type { ReactNode, CSSProperties } from 'react';
import type { ContainerProps } from './Container.schema';

/**
 * At render time, Renderer.tsx materializes BlockSpec[] → ReactNode[] before
 * calling this component. We declare children as ReactNode here to match what
 * the component actually receives.
 */
type ContainerRenderProps = Omit<ContainerProps, 'children'> & {
    children: ReactNode;
};

export default function Container({
    children,
    background,
    paddingY = 'md',
    maxWidth,
    scrollable = false,
    maxHeight = 400,
}: ContainerRenderProps) {
    const innerStyle: CSSProperties = {};
    if (maxWidth !== undefined) innerStyle.maxWidth = `${maxWidth}px`;

    const contentStyle: CSSProperties = {};
    if (scrollable) contentStyle.maxHeight = `${maxHeight}px`;

    return (
        <section
            className="container_block"
            data-padding-y={paddingY}
            style={{ background: background ?? 'transparent' }}
        >
            <div className="container_block__inner" style={innerStyle}>
                <div
                    className="container_block__content"
                    data-scrollable={scrollable || undefined}
                    style={contentStyle}
                >
                    {children}
                </div>
            </div>
        </section>
    );
}
```

Inline style usage justification (per CLAUDE.md):
- `background`: unbounded CSS color string — cannot be a static CSS class.
- `maxWidth`, `maxHeight`: dynamic numeric values — same reason.
- `paddingY`: bounded enum → `data-padding-y` attribute + static CSS rules (no inline style).
- `scrollable`: boolean → `data-scrollable` attribute drives `overflow-y: auto`.

### Step 3 — `Container.css`

```css
.container_block {
    width: 100%;
    box-sizing: border-box;
    /* background is set via inline style from props */
}

/* paddingY variants — driven by data-padding-y attribute */
.container_block[data-padding-y="none"] { padding-top: 0; padding-bottom: 0; }
.container_block[data-padding-y="sm"]   { padding-top: var(--space_sm);  padding-bottom: var(--space_sm); }
.container_block[data-padding-y="md"]   { padding-top: var(--space_lg);  padding-bottom: var(--space_lg); }
.container_block[data-padding-y="lg"]   { padding-top: var(--space_xl);  padding-bottom: var(--space_xl); }

/* Inner wrapper — constrained to maxWidth when provided via inline style */
.container_block__inner {
    width: 100%;
    margin-inline: auto;
    box-sizing: border-box;
    padding-inline: var(--space_md);
}

/* Content area — vertical stack of child blocks */
.container_block__content {
    display: flex;
    flex-direction: column;
    gap: var(--space_lg);
}

/* Scrollable state — max-height is set via inline style; overflow is static */
.container_block__content[data-scrollable] {
    overflow-y: auto;
}
```

paddingY token mapping (intentionally tiered for visual distinctness):
- `none` → 0
- `sm` → `--space_sm` (8 px)
- `md` → `--space_lg` (24 px) ← default
- `lg` → `--space_xl` (40 px)

### Step 4 — `index.ts`

The `Component` field requires a cast because `Container` is typed with `ContainerRenderProps` (children: ReactNode) while `ModuleDefinition<ContainerProps>` expects `ComponentType<ContainerProps>` (children: BlockSpec[]). The cast is safe because the Renderer guarantees the conversion.

```ts
import type { ComponentType } from 'react';
import Container from './Container';
import { ContainerPropsSchema, ContainerDefaults, ContainerMeta } from './Container.schema';
import type { ContainerProps } from './Container.schema';
import type { ModuleDefinition } from '../../builder/types';

export const ContainerModule: ModuleDefinition<ContainerProps> = {
    meta:        ContainerMeta,
    propsSchema: ContainerPropsSchema,
    defaults:    ContainerDefaults,
    // Cast required: Renderer materializes children (BlockSpec[] → ReactNode) before
    // calling the component. The component types reflect runtime reality; the schema
    // types reflect what the spec JSON contains. They diverge by design.
    Component:   Container as ComponentType<ContainerProps>,
};

export { default as Container } from './Container';
export type { ContainerProps } from './Container.schema';
```

### Step 5 — Update `registry.ts`

Add one import and one array entry after plan 01's entries:

```ts
import { ContainerModule } from '../elements/Container';

// In the modules array:
const modules: AnyModule[] = [
    HeaderModule,
    ImageBlockModule,   // plan 01
    TextBlockModule,    // plan 01
    MediaTextModule,    // plan 01
    CardRowModule,      // plan 01
    ContainerModule,    // plan 02
];
```

---

## How Recursion Works (Trace)

Given a spec block:
```json
{
  "type": "Container",
  "props": {
    "background": "#f0f4ff",
    "paddingY": "md",
    "children": [
      { "type": "TextBlock", "props": { "body": "Hello" } },
      { "type": "ImageBlock", "props": { "src": "/img.jpg", "alt": "Photo" } }
    ]
  }
}
```

Render path:
1. `renderBlock({type:"Container", props:{...}})` → `getModule("Container")` → `ContainerModule`
2. `ContainerPropsSchema.safeParse(block.props)` succeeds; `parsed.data.children` = raw `BlockSpec[]`
3. `materializeBlockProps(parsed.data)` visits each key; `children` array passes `isBlockSpec` check
4. Each child is mapped through `renderBlock` → `<Fragment key={0}><TextBlock/></Fragment>`, etc.
5. `Container` receives `children: ReactNode[]`, renders inside `.container_block__content`

No changes to `Renderer.tsx` required.

---

## Acceptance Checks

- `ContainerPropsSchema.safeParse(ContainerDefaults)` → `success: true`
- Spec with empty `children: []` → `safeParse` fails (`.min(1)`) → `ErrorPlaceholder`
- `scrollable: true, maxHeight: 300` → `.container_block__content` has `overflow-y: auto` + `max-height: 300px`
- `maxWidth: 800` → `.container_block__inner` has `max-width: 800px`, centered
- `background: '#e8f5e9'` → inline style on `<section>`
- `paddingY: 'lg'` → `padding-top/bottom: var(--space_xl)` via `[data-padding-y="lg"]`
- Container with 2 leaf children renders both correctly
- No hardcoded color or spacing values in `Container.css`
