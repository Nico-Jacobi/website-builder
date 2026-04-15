# Plan 02: Content Variants — Callout, StatRow, CardGrid

## Goal

Add three new content modules following the full 4-file module contract with JSDoc on
every schema field, BEM CSS using only design tokens, and data-attribute-driven enum
variants. Register all three in registry.ts.

---

## Files to Create

```
src/elements/content/Callout/Callout.schema.ts
src/elements/content/Callout/Callout.tsx
src/elements/content/Callout/Callout.css
src/elements/content/Callout/index.ts

src/elements/content/StatRow/StatRow.schema.ts
src/elements/content/StatRow/StatRow.tsx
src/elements/content/StatRow/StatRow.css
src/elements/content/StatRow/index.ts

src/elements/content/CardGrid/CardGrid.schema.ts
src/elements/content/CardGrid/CardGrid.tsx
src/elements/content/CardGrid/CardGrid.css
src/elements/content/CardGrid/index.ts
```

**Modified:** `src/builder/registry.ts`

---

## Module 1: Callout

### `Callout.schema.ts`

```ts
import { z } from 'zod';
import type { ModuleMeta } from '../../../builder/types';

export const CalloutPropsSchema = z.object({
    /** Emoji or short symbol shown in the tone badge (e.g. '💡', '!'). Omit to hide badge. */
    icon: z.string().optional(),

    /** Optional bold heading rendered above the body text. */
    heading: z.string().optional(),

    /** Main callout text. Required — a callout without body has no content. */
    body: z.string(),

    /**
     * Visual tone — controls the left border colour and icon badge background.
     * Expressed as a data-tone attribute so CSS attribute selectors drive all
     * colour changes without JavaScript logic.
     * info → --primary, success → --alt_primary, warning/danger → --accent.
     */
    tone: z.enum(['info', 'success', 'warning', 'danger']).default('info'),
});

export type CalloutProps = z.infer<typeof CalloutPropsSchema>;

export const CalloutDefaults: CalloutProps = {
    icon: '💡',
    heading: 'Did you know?',
    body: 'This is an informational callout. Replace with your tip, warning, or pull quote.',
    tone: 'info',
};

export const CalloutMeta: ModuleMeta = {
    name: 'Callout',
    category: 'content',
    description: 'Accent-bordered highlight box for tips, warnings, or pull quotes. Tone controls border and badge colour.',
    tags: ['callout', 'tip', 'warning', 'alert', 'highlight', 'quote'],
};
```

### `Callout.tsx`

```tsx
import './Callout.css';
import type { CalloutProps } from './Callout.schema';

export default function Callout({ icon, heading, body, tone }: CalloutProps) {
    return (
        <div className="callout" data-tone={tone}>
            {icon && <span className="callout__icon">{icon}</span>}
            <div className="callout__content">
                {heading && <p className="callout__heading">{heading}</p>}
                <p className="callout__body">{body}</p>
            </div>
        </div>
    );
}
```

### `Callout.css`

```css
/* Tone colour map — one custom property used by both border and badge */
.callout[data-tone="info"]    { --callout-tone-color: var(--primary); }
.callout[data-tone="success"] { --callout-tone-color: var(--alt_primary); }
.callout[data-tone="warning"] { --callout-tone-color: var(--accent); }
.callout[data-tone="danger"]  { --callout-tone-color: var(--accent); }

.callout {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: var(--space_md);
    background-color: var(--surface);
    border-left: 4px solid var(--callout-tone-color);
    border-radius: 0 var(--radius_sm) var(--radius_sm) 0;
    padding: var(--space_md);
    font-family: var(--font_family);
}

.callout__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 2rem;
    height: 2rem;
    border-radius: var(--radius_sm);
    background-color: var(--callout-tone-color);
    color: var(--inverted_text);
    font-size: 1rem;
    line-height: 1;
}

.callout__content {
    display: flex;
    flex-direction: column;
    gap: var(--space_xs);
    min-width: 0;
}

.callout__heading {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--secondary);
}

.callout__body {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.6;
    color: var(--text);
}
```

### `index.ts`

```ts
import Callout from './Callout';
import { CalloutPropsSchema, CalloutDefaults, CalloutMeta } from './Callout.schema';
import type { CalloutProps } from './Callout.schema';
import type { ModuleDefinition } from '../../../builder/types';

export const CalloutModule: ModuleDefinition<CalloutProps> = {
    meta:        CalloutMeta,
    propsSchema: CalloutPropsSchema,
    defaults:    CalloutDefaults,
    Component:   Callout,
};

export { default as Callout } from './Callout';
export type { CalloutProps } from './Callout.schema';
```

---

## Module 2: StatRow

### `StatRow.schema.ts`

```ts
import { z } from 'zod';
import type { ModuleMeta } from '../../../builder/types';

/** A single statistic tile. */
const StatSchema = z.object({
    /** The statistic value displayed large, e.g. '10k+' or '99%'. */
    value: z.string(),
    /** Short descriptive label below the value, e.g. 'Active Users'. */
    label: z.string(),
});

export const StatRowPropsSchema = z.object({
    /**
     * Array of stat tiles. At least one required.
     * 3–5 tiles is typical for legible marketing layouts.
     */
    stats: z.array(StatSchema).min(1),

    /**
     * Horizontal alignment of the tiles within the row.
     * Drives data-align attribute; CSS handles layout differences.
     */
    align: z.enum(['left', 'center']).default('center'),
});

export type StatRowProps = z.infer<typeof StatRowPropsSchema>;

export const StatRowDefaults: StatRowProps = {
    stats: [
        { value: '10k+', label: 'Active Users'  },
        { value: '99%',  label: 'Uptime'         },
        { value: '4.9★', label: 'Average Rating' },
    ],
    align: 'center',
};

export const StatRowMeta: ModuleMeta = {
    name: 'StatRow',
    category: 'content',
    description: 'Row of large-value statistic tiles with descriptive labels. Common on marketing and landing pages.',
    tags: ['stats', 'metrics', 'numbers', 'marketing', 'kpi'],
};
```

### `StatRow.tsx`

```tsx
import './StatRow.css';
import type { StatRowProps } from './StatRow.schema';

export default function StatRow({ stats, align }: StatRowProps) {
    return (
        <div className="stat_row" data-align={align}>
            <div className="stat_row__tiles">
                {stats.map((stat, index) => (
                    <div key={index} className="stat_row__tile">
                        <span className="stat_row__value">{stat.value}</span>
                        <span className="stat_row__label">{stat.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
```

### `StatRow.css`

```css
/* Alignment variants on tiles container */
.stat_row[data-align="left"]   .stat_row__tiles { justify-content: flex-start; }
.stat_row[data-align="center"] .stat_row__tiles { justify-content: center; }

.stat_row {
    padding: var(--space_lg) var(--space_xl);
    background-color: var(--surface);
    font-family: var(--font_family);
}

.stat_row__tiles {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: var(--space_xl);
}

.stat_row__tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space_xs);
    flex: 1 1 120px;
}

.stat_row__value {
    font-size: 3rem;
    font-weight: 700;
    line-height: 1;
    color: var(--secondary);
}

.stat_row__label {
    font-size: 0.9rem;
    line-height: 1.4;
    color: var(--muted_text);
    text-align: center;
}

@media (max-width: 480px) {
    .stat_row__tiles {
        flex-direction: column;
        align-items: center;
        gap: var(--space_lg);
    }

    .stat_row__tile {
        flex: none;
        width: 100%;
    }
}
```

### `index.ts`

```ts
import StatRow from './StatRow';
import { StatRowPropsSchema, StatRowDefaults, StatRowMeta } from './StatRow.schema';
import type { StatRowProps } from './StatRow.schema';
import type { ModuleDefinition } from '../../../builder/types';

export const StatRowModule: ModuleDefinition<StatRowProps> = {
    meta:        StatRowMeta,
    propsSchema: StatRowPropsSchema,
    defaults:    StatRowDefaults,
    Component:   StatRow,
};

export { default as StatRow } from './StatRow';
export type { StatRowProps } from './StatRow.schema';
```

---

## Module 3: CardGrid

### `CardGrid.schema.ts`

```ts
import { z } from 'zod';
import type { ModuleMeta } from '../../../builder/types';

/** A single card in the grid. Matches the CardRow card shape. */
const CardSchema = z.object({
    /** Optional card image URL. No image element rendered when absent. */
    imageSrc: z.string().optional(),
    /** Alt text for the card image. Provide whenever imageSrc is set. */
    imageAlt: z.string().optional(),
    /** Card title. Displayed as a heading inside the card. */
    title: z.string(),
    /** Optional body text shown below the title. */
    body: z.string().optional(),
});

export const CardGridPropsSchema = z.object({
    /** Cards to display in the grid. At least one required. */
    cards: z.array(CardSchema).min(1),

    /**
     * Number of columns on desktop (> 640 px).
     * Drives data-columns attribute → CSS custom property --card-grid-cols.
     * Always 1 column on mobile. Defaults to 3.
     */
    columns: z.union([z.literal(2), z.literal(3)]).default(3),
});

export type CardGridProps = z.infer<typeof CardGridPropsSchema>;

export const CardGridDefaults: CardGridProps = {
    cards: [
        { title: 'Grid Card One',   body: 'Description for the first card.'  },
        { title: 'Grid Card Two',   body: 'Description for the second card.' },
        { title: 'Grid Card Three', body: 'Description for the third card.'  },
    ],
    columns: 3,
};

export const CardGridMeta: ModuleMeta = {
    name: 'CardGrid',
    category: 'content',
    description: 'Grid of image-title-body cards that wraps into rows. Use instead of CardRow when cards should stack rather than scroll horizontally.',
    tags: ['cards', 'grid', 'gallery', 'features', 'wrap'],
};
```

### `CardGrid.tsx`

```tsx
import './CardGrid.css';
import type { CardGridProps } from './CardGrid.schema';

export default function CardGrid({ cards, columns }: CardGridProps) {
    return (
        <div className="card_grid" data-columns={columns}>
            <div className="card_grid__grid">
                {cards.map((card, index) => (
                    <article key={index} className="card_grid__card">
                        {card.imageSrc && (
                            <img
                                className="card_grid__card-img"
                                src={card.imageSrc}
                                alt={card.imageAlt ?? ''}
                            />
                        )}
                        <h3 className="card_grid__card-title">{card.title}</h3>
                        {card.body && <p className="card_grid__card-body">{card.body}</p>}
                    </article>
                ))}
            </div>
        </div>
    );
}
```

### `CardGrid.css`

```css
/* Column count — sets CSS custom property consumed by grid-template-columns */
.card_grid[data-columns="2"] { --card-grid-cols: 2; }
.card_grid[data-columns="3"] { --card-grid-cols: 3; }

.card_grid {
    padding: var(--space_lg) var(--space_xl);
    background-color: var(--surface);
    font-family: var(--font_family);
}

.card_grid__grid {
    display: grid;
    grid-template-columns: repeat(var(--card-grid-cols, 3), 1fr);
    gap: var(--space_md);
}

.card_grid__card {
    display: flex;
    flex-direction: column;
    gap: var(--space_sm);
    background-color: var(--background);
    border-radius: var(--radius_md);
    overflow: hidden;
    padding-bottom: var(--space_md);
}

.card_grid__card-img {
    width: 100%;
    height: 180px;
    object-fit: cover;
    display: block;
}

.card_grid__card-title {
    margin: var(--space_md) var(--space_md) 0 var(--space_md);
    font-size: 1.1rem;
    color: var(--secondary);
}

.card_grid__card-body {
    margin: 0 var(--space_md);
    font-size: 0.9rem;
    line-height: 1.55;
    color: var(--muted_text);
}

/* Mobile: always 1 column regardless of data-columns */
@media (max-width: 640px) {
    .card_grid__grid {
        grid-template-columns: 1fr;
    }
}
```

### `index.ts`

```ts
import CardGrid from './CardGrid';
import { CardGridPropsSchema, CardGridDefaults, CardGridMeta } from './CardGrid.schema';
import type { CardGridProps } from './CardGrid.schema';
import type { ModuleDefinition } from '../../../builder/types';

export const CardGridModule: ModuleDefinition<CardGridProps> = {
    meta:        CardGridMeta,
    propsSchema: CardGridPropsSchema,
    defaults:    CardGridDefaults,
    Component:   CardGrid,
};

export { default as CardGrid } from './CardGrid';
export type { CardGridProps } from './CardGrid.schema';
```

---

## Registry Update

Add 3 imports and 3 array entries (content section) to `src/builder/registry.ts`:

```ts
import { CalloutModule  } from '../elements/content/Callout';
import { StatRowModule  } from '../elements/content/StatRow';
import { CardGridModule } from '../elements/content/CardGrid';
```

```ts
const modules: AnyModule[] = [
    // Layout
    HeaderModule, HeroBannerModule, ContainerModule, FooterModule, FooterSimpleModule,
    // Content
    TextBlockModule, MediaTextModule, CardRowModule,
    CalloutModule,   // ← new
    StatRowModule,   // ← new
    CardGridModule,  // ← new
    // Media
    ImageBlockModule,
];
```

---

## Interface / Output (for coherence check)

**Registry keys produced:** `'Callout'`, `'StatRow'`, `'CardGrid'`

**data-attribute → CSS coupling:**
| Module | Prop | Attribute | CSS effect |
|---|---|---|---|
| Callout | `tone` | `data-tone` | sets `--callout-tone-color` |
| StatRow | `align` | `data-align` | sets `justify-content` on tiles |
| CardGrid | `columns` | `data-columns` | sets `--card-grid-cols` |
