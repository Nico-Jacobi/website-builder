# Plan 03: Media Variants — Gallery

## Goal

Add the `Gallery` module to `src/elements/media/Gallery/` and write the final
consolidated registry update that includes all 13 modules.

---

## Files to Create

```
src/elements/media/Gallery/Gallery.schema.ts
src/elements/media/Gallery/Gallery.tsx
src/elements/media/Gallery/Gallery.css
src/elements/media/Gallery/index.ts
```

**Modified:** `src/builder/registry.ts` (final consolidated version with all 13 modules)

---

## Module: Gallery

### `Gallery.schema.ts`

```ts
import { z } from 'zod';
import type { ModuleMeta } from '../../../builder/types';

/** A single image entry in the gallery. */
const GalleryImageSchema = z.object({
    /** Image source URL (absolute or relative). */
    src: z.string(),
    /** Descriptive alt text for screen-reader accessibility. */
    alt: z.string(),
    /** Optional caption rendered below the image in a figcaption. */
    caption: z.string().optional(),
});

export const GalleryPropsSchema = z.object({
    /**
     * Images to display in the gallery grid.
     * Must contain at least 2 and at most 4 items.
     */
    images: z.array(GalleryImageSchema).min(2).max(4),

    /**
     * Number of grid columns on desktop (> 640 px).
     * Drives data-columns attribute → CSS custom property --gallery-cols.
     * Always 1 column on mobile. Defaults to 2.
     */
    columns: z.union([z.literal(2), z.literal(3)]).default(2),

    /**
     * Gap between grid cells.
     * Drives data-gap attribute → CSS custom property --gallery-gap.
     * Accepts 'sm', 'md', or 'lg'. Defaults to 'md'.
     */
    gap: z.enum(['sm', 'md', 'lg']).default('md'),
});

export type GalleryProps = z.infer<typeof GalleryPropsSchema>;

export const GalleryDefaults: GalleryProps = {
    images: [
        { src: 'https://placehold.co/800x600', alt: 'Gallery image one',   caption: 'Caption for image one'   },
        { src: 'https://placehold.co/800x600', alt: 'Gallery image two',   caption: 'Caption for image two'   },
    ],
    columns: 2,
    gap: 'md',
};

export const GalleryMeta: ModuleMeta = {
    name: 'Gallery',
    category: 'media',
    description: 'Responsive CSS-grid photo gallery of 2–4 images with configurable columns and gap. Use for portfolios, showcases, or photo collections.',
    tags: ['gallery', 'grid', 'images', 'photos', 'media', 'caption'],
};
```

### `Gallery.tsx`

```tsx
import './Gallery.css';
import type { GalleryProps } from './Gallery.schema';

export default function Gallery({ images, columns, gap }: GalleryProps) {
    return (
        <section className="gallery">
            <div
                className="gallery__grid"
                data-columns={columns}
                data-gap={gap}
            >
                {images.map((image, index) => (
                    <figure key={index} className="gallery__item">
                        <img
                            className="gallery__img"
                            src={image.src}
                            alt={image.alt}
                        />
                        {image.caption && (
                            <figcaption className="gallery__caption">
                                {image.caption}
                            </figcaption>
                        )}
                    </figure>
                ))}
            </div>
        </section>
    );
}
```

Note: `data-columns` and `data-gap` live on `.gallery__grid` (not root) because the CSS custom properties they set are consumed by grid layout properties on that element.

### `Gallery.css`

```css
/* Column count → CSS custom property for grid-template-columns */
.gallery__grid[data-columns="2"] { --gallery-cols: 2; }
.gallery__grid[data-columns="3"] { --gallery-cols: 3; }

/* Gap size → CSS custom property for gap */
.gallery__grid[data-gap="sm"] { --gallery-gap: var(--space_sm); }
.gallery__grid[data-gap="md"] { --gallery-gap: var(--space_md); }
.gallery__grid[data-gap="lg"] { --gallery-gap: var(--space_lg); }

.gallery {
    padding: var(--space_lg) var(--space_xl);
    background-color: var(--surface);
}

.gallery__grid {
    display: grid;
    grid-template-columns: repeat(var(--gallery-cols, 2), 1fr);
    gap: var(--gallery-gap, var(--space_md));
}

.gallery__item {
    margin: 0;          /* reset browser default figure margin */
    display: flex;
    flex-direction: column;
    gap: var(--space_xs);
}

.gallery__img {
    display: block;     /* remove inline baseline gap */
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    border-radius: var(--radius_md);
    background-color: var(--background);  /* placeholder while loading */
}

.gallery__caption {
    font-size: 0.85rem;
    color: var(--muted_text);
    text-align: center;
    font-family: var(--font_family);
    line-height: 1.4;
}

/* Mobile: always 1 column; must appear after [data-columns] rules */
@media (max-width: 640px) {
    .gallery__grid {
        grid-template-columns: 1fr;
    }

    .gallery {
        padding: var(--space_md);
    }
}
```

### `index.ts`

```ts
import Gallery from './Gallery';
import { GalleryPropsSchema, GalleryDefaults, GalleryMeta } from './Gallery.schema';
import type { GalleryProps } from './Gallery.schema';
import type { ModuleDefinition } from '../../../builder/types';

export const GalleryModule: ModuleDefinition<GalleryProps> = {
    meta:        GalleryMeta,
    propsSchema: GalleryPropsSchema,
    defaults:    GalleryDefaults,
    Component:   Gallery,
};

export { default as Gallery } from './Gallery';
export type { GalleryProps } from './Gallery.schema';
```

---

## Final Consolidated Registry

Complete `src/builder/registry.ts` after all 3 plans — 13 modules total:

```ts
import type { ModuleDefinition } from './types';

// ── Layout (5) ────────────────────────────────────────────────────────────────
import { HeaderModule      } from '../elements/layout/Header';
import { HeroBannerModule  } from '../elements/layout/HeroBanner';
import { ContainerModule   } from '../elements/layout/Container';
import { FooterModule      } from '../elements/layout/Footer';
import { FooterSimpleModule } from '../elements/layout/FooterSimple';

// ── Content (6) ───────────────────────────────────────────────────────────────
import { TextBlockModule   } from '../elements/content/TextBlock';
import { MediaTextModule   } from '../elements/content/MediaText';
import { CardRowModule     } from '../elements/content/CardRow';
import { CalloutModule     } from '../elements/content/Callout';
import { StatRowModule     } from '../elements/content/StatRow';
import { CardGridModule    } from '../elements/content/CardGrid';

// ── Media (2) ─────────────────────────────────────────────────────────────────
import { ImageBlockModule  } from '../elements/media/ImageBlock';
import { GalleryModule     } from '../elements/media/Gallery';

/**
 * The module registry: every website part the builder knows about.
 *
 * To add a new module:
 *   1. Create src/elements/<category>/<Name>/ with Name.tsx, Name.css, Name.schema.ts, index.ts
 *      Categories: layout | content | media
 *   2. Import its <Name>Module here
 *   3. Add it to the `modules` array below — no other file needs to change
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyModule = ModuleDefinition<any>;

const modules: AnyModule[] = [
    // Layout
    HeaderModule,
    HeroBannerModule,
    ContainerModule,
    FooterModule,
    FooterSimpleModule,
    // Content
    TextBlockModule,
    MediaTextModule,
    CardRowModule,
    CalloutModule,
    StatRowModule,
    CardGridModule,
    // Media
    ImageBlockModule,
    GalleryModule,
];

export const registry: Record<string, AnyModule> = Object.fromEntries(
    modules.map((m) => [m.meta.name, m]),
);

export function getModule(name: string): AnyModule | undefined {
    return registry[name];
}

export function listModules(): AnyModule[] {
    return modules;
}
```

---

## Interface / Output (for coherence check)

**Registry keys produced:** `'Gallery'`

**Final module count:** 13
- Layout (5): Header, HeroBanner, Container, Footer, FooterSimple
- Content (6): TextBlock, MediaText, CardRow, Callout, StatRow, CardGrid
- Media (2): ImageBlock, Gallery

**Validation errors Zod raises on bad Gallery input:**
| Bad input | Error |
|---|---|
| `images` with 1 item | array too small (min 2) |
| `images` with 5 items | array too large (max 4) |
| `columns: 4` | invalid literal union |
| `gap: 'xl'` | invalid enum value |
