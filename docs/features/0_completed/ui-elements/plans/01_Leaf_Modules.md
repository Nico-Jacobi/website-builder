# Plan 01: Leaf Modules — ImageBlock, TextBlock, MediaText, CardRow

## Goal

Create four self-contained, stackable UI modules that conform to the module contract, register in `src/builder/registry.ts`, and can be assembled into a complete page via JSON spec.

---

## Files to Create

```
src/elements/ImageBlock/  — full-width image + optional caption
src/elements/TextBlock/   — heading + body + optional subtext
src/elements/MediaText/   — image beside text, left or right, stacks on mobile
src/elements/CardRow/     — horizontal scrollable row of cards
```

Each folder: `<Name>.schema.ts`, `<Name>.tsx`, `<Name>.css`, `index.ts`

**Modified:** `src/builder/registry.ts` — 4 new imports + array entries

---

## Step-by-Step Implementation

### Module 1: ImageBlock

**`ImageBlock.schema.ts`**
```ts
import { z } from 'zod';
import type { ModuleMeta } from '../../builder/types';

export const ImageBlockPropsSchema = z.object({
    src:       z.string(),
    alt:       z.string(),
    caption:   z.string().optional(),
    objectFit: z.enum(['cover', 'contain', 'fill']).default('cover'),
    maxHeight: z.number().default(480),
});

export type ImageBlockProps = z.infer<typeof ImageBlockPropsSchema>;

export const ImageBlockDefaults: ImageBlockProps = {
    src:       'https://placehold.co/1200x480',
    alt:       'Placeholder image',
    objectFit: 'cover',
    maxHeight: 480,
};

export const ImageBlockMeta: ModuleMeta = {
    name:        'ImageBlock',
    category:    'media',
    description: 'Full-width image with an optional caption. Use for hero images, section dividers, or standalone illustrations.',
    tags:        ['image', 'media', 'photo', 'caption'],
};
```

**`ImageBlock.tsx`**
```tsx
import './ImageBlock.css';
import type { ImageBlockProps } from './ImageBlock.schema';

export default function ImageBlock({ src, alt, caption, objectFit, maxHeight }: ImageBlockProps) {
    return (
        <figure className="image_block">
            <img
                className="image_block__img"
                src={src}
                alt={alt}
                style={{ objectFit, maxHeight }}
            />
            {caption && (
                <figcaption className="image_block__caption">{caption}</figcaption>
            )}
        </figure>
    );
}
```
`objectFit` and `maxHeight` are genuinely dynamic → inline style is correct per CLAUDE.md.

**`ImageBlock.css`**
```css
.image_block {
    margin: 0;          /* reset browser default figure margin */
    width: 100%;
    overflow: hidden;
    border-radius: var(--radius_md);
    background-color: var(--surface);
}

.image_block__img {
    display: block;     /* removes inline baseline gap */
    width: 100%;
    height: 100%;
}

.image_block__caption {
    padding: var(--space_sm) var(--space_md);
    font-size: 0.875rem;
    color: var(--muted_text);
    text-align: center;
    font-family: var(--font_family);
}
```

**`index.ts`**
```ts
import ImageBlock from './ImageBlock';
import { ImageBlockPropsSchema, ImageBlockDefaults, ImageBlockMeta } from './ImageBlock.schema';
import type { ImageBlockProps } from './ImageBlock.schema';
import type { ModuleDefinition } from '../../builder/types';

export const ImageBlockModule: ModuleDefinition<ImageBlockProps> = {
    meta:        ImageBlockMeta,
    propsSchema: ImageBlockPropsSchema,
    defaults:    ImageBlockDefaults,
    Component:   ImageBlock,
};

export { default as ImageBlock } from './ImageBlock';
export type { ImageBlockProps } from './ImageBlock.schema';
```

---

### Module 2: TextBlock

**`TextBlock.schema.ts`**
```ts
import { z } from 'zod';
import type { ModuleMeta } from '../../builder/types';

export const TextBlockPropsSchema = z.object({
    heading: z.string().optional(),
    body:    z.string(),
    subtext: z.string().optional(),
    align:   z.enum(['left', 'center', 'right']).default('left'),
});

export type TextBlockProps = z.infer<typeof TextBlockPropsSchema>;

export const TextBlockDefaults: TextBlockProps = {
    body:  'Enter your body text here.',
    align: 'left',
};

export const TextBlockMeta: ModuleMeta = {
    name:        'TextBlock',
    category:    'content',
    description: 'Heading, body paragraph, and optional subtext with configurable text alignment.',
    tags:        ['text', 'heading', 'copy', 'paragraph', 'content'],
};
```

**`TextBlock.tsx`**
```tsx
import './TextBlock.css';
import type { TextBlockProps } from './TextBlock.schema';

export default function TextBlock({ heading, body, subtext, align }: TextBlockProps) {
    return (
        <div className="text_block" data-align={align}>
            {heading && <h2 className="text_block__heading">{heading}</h2>}
            <p className="text_block__body">{body}</p>
            {subtext && <p className="text_block__subtext">{subtext}</p>}
        </div>
    );
}
```
`data-align` attribute drives CSS alignment — no inline styles needed.

**`TextBlock.css`**
```css
.text_block {
    padding: var(--space_lg) var(--space_xl);
    background-color: var(--surface);
    font-family: var(--font_family);
    color: var(--text);
}

.text_block[data-align="left"]   { text-align: left; }
.text_block[data-align="center"] { text-align: center; }
.text_block[data-align="right"]  { text-align: right; }

.text_block__heading {
    margin: 0 0 var(--space_md) 0;
    font-size: 2rem;
    color: var(--secondary);
}

.text_block__body {
    margin: 0 0 var(--space_sm) 0;
    font-size: 1.05rem;
    line-height: 1.6;
    color: var(--text);
}

.text_block__subtext {
    margin: 0;
    font-size: 0.875rem;
    color: var(--muted_text);
}
```

**`index.ts`** — same pattern as ImageBlock.

---

### Module 3: MediaText

**`MediaText.schema.ts`**
```ts
import { z } from 'zod';
import type { ModuleMeta } from '../../builder/types';

export const MediaTextPropsSchema = z.object({
    imageSrc:      z.string(),
    imageAlt:      z.string(),
    heading:       z.string().optional(),
    body:          z.string(),
    imagePosition: z.enum(['left', 'right']).default('left'),
});

export type MediaTextProps = z.infer<typeof MediaTextPropsSchema>;

export const MediaTextDefaults: MediaTextProps = {
    imageSrc:      'https://placehold.co/600x400',
    imageAlt:      'Placeholder image',
    body:          'Describe what makes this image interesting.',
    imagePosition: 'left',
};

export const MediaTextMeta: ModuleMeta = {
    name:        'MediaText',
    category:    'content',
    description: 'Image beside a text column (heading + body). Position image left or right. Stacks vertically on narrow viewports.',
    tags:        ['media', 'image', 'text', 'side-by-side', 'layout'],
};
```

**`MediaText.tsx`**
```tsx
import './MediaText.css';
import type { MediaTextProps } from './MediaText.schema';

export default function MediaText({ imageSrc, imageAlt, heading, body, imagePosition }: MediaTextProps) {
    return (
        <div className="media_text" data-image-position={imagePosition}>
            <img className="media_text__image" src={imageSrc} alt={imageAlt} />
            <div className="media_text__content">
                {heading && <h2 className="media_text__heading">{heading}</h2>}
                <p className="media_text__body">{body}</p>
            </div>
        </div>
    );
}
```

**`MediaText.css`**
```css
.media_text {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--space_xl);
    padding: var(--space_lg) var(--space_xl);
    background-color: var(--surface);
    font-family: var(--font_family);
}

/* Flip column order when image is on the right */
.media_text[data-image-position="right"] .media_text__image  { order: 2; }
.media_text[data-image-position="right"] .media_text__content { order: 1; }

.media_text__image {
    width: 50%;
    max-width: 560px;
    aspect-ratio: 3 / 2;
    object-fit: cover;
    border-radius: var(--radius_md);
    flex-shrink: 0;
}

.media_text__content { flex: 1; min-width: 0; }

.media_text__heading {
    margin: 0 0 var(--space_md) 0;
    font-size: 1.75rem;
    color: var(--secondary);
}

.media_text__body {
    margin: 0;
    font-size: 1rem;
    line-height: 1.65;
    color: var(--text);
}

@media (max-width: 640px) {
    .media_text { flex-direction: column; }
    .media_text__image { width: 100%; max-width: none; }
    /* Reset CSS order so image stays above content in DOM order */
    .media_text[data-image-position="right"] .media_text__image,
    .media_text[data-image-position="right"] .media_text__content { order: unset; }
}
```

**`index.ts`** — same pattern as ImageBlock.

---

### Module 4: CardRow

**`CardRow.schema.ts`**
```ts
import { z } from 'zod';
import type { ModuleMeta } from '../../builder/types';

const CardSchema = z.object({
    imageSrc: z.string().optional(),
    imageAlt: z.string().optional(),
    title:    z.string(),
    body:     z.string().optional(),
});

export const CardRowPropsSchema = z.object({
    cards: z.array(CardSchema).min(1),
});

export type CardRowProps = z.infer<typeof CardRowPropsSchema>;

export const CardRowDefaults: CardRowProps = {
    cards: [
        { title: 'Card One',   body: 'Description for the first card.'  },
        { title: 'Card Two',   body: 'Description for the second card.' },
        { title: 'Card Three', body: 'Description for the third card.'  },
    ],
};

export const CardRowMeta: ModuleMeta = {
    name:        'CardRow',
    category:    'content',
    description: 'A horizontal row of image-title-body cards. Scrolls horizontally on narrow viewports.',
    tags:        ['cards', 'grid', 'gallery', 'features', 'list'],
};
```

**`CardRow.tsx`**
```tsx
import './CardRow.css';
import type { CardRowProps } from './CardRow.schema';

export default function CardRow({ cards }: CardRowProps) {
    return (
        <div className="card_row">
            <div className="card_row__scroll">
                {cards.map((card, index) => (
                    <article key={index} className="card_row__card">
                        {card.imageSrc && (
                            <img
                                className="card_row__card-img"
                                src={card.imageSrc}
                                alt={card.imageAlt ?? ''}
                            />
                        )}
                        <h3 className="card_row__card-title">{card.title}</h3>
                        {card.body && <p className="card_row__card-body">{card.body}</p>}
                    </article>
                ))}
            </div>
        </div>
    );
}
```

**`CardRow.css`**
```css
.card_row {
    padding: var(--space_lg) var(--space_xl);
    background-color: var(--surface);
}

.card_row__scroll {
    display: flex;
    flex-direction: row;
    gap: var(--space_md);
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
    scrollbar-color: var(--muted_text) transparent;
    padding-bottom: var(--space_sm);
}

.card_row__card {
    flex: 0 0 280px;     /* fixed width, no shrink/grow */
    display: flex;
    flex-direction: column;
    gap: var(--space_sm);
    background-color: var(--background);
    border-radius: var(--radius_md);
    overflow: hidden;
    padding-bottom: var(--space_md);
}

.card_row__card-img {
    width: 100%;
    height: 180px;
    object-fit: cover;
    display: block;
}

.card_row__card-title {
    margin: var(--space_md) var(--space_md) 0 var(--space_md);
    font-size: 1.1rem;
    font-family: var(--font_family);
    color: var(--secondary);
}

.card_row__card-body {
    margin: 0 var(--space_md);
    font-size: 0.9rem;
    line-height: 1.55;
    color: var(--muted_text);
    font-family: var(--font_family);
}
```

**`index.ts`** — same pattern as ImageBlock.

---

## Registry Update

Edit `src/builder/registry.ts`:

```ts
// Add after existing HeaderModule import:
import { ImageBlockModule } from '../elements/ImageBlock';
import { TextBlockModule   } from '../elements/TextBlock';
import { MediaTextModule   } from '../elements/MediaText';
import { CardRowModule     } from '../elements/CardRow';

// Add to modules array:
const modules: AnyModule[] = [
    HeaderModule,
    ImageBlockModule,
    TextBlockModule,
    MediaTextModule,
    CardRowModule,
    // ContainerModule added in plan 02
];
```

---

## Interface / Output (for Plan 02)

**Registry keys produced:**
```
'ImageBlock' | 'TextBlock' | 'MediaText' | 'CardRow'
```

**Import paths available after this plan:**
```ts
import { ImageBlockModule } from '../elements/ImageBlock';
import { TextBlockModule   } from '../elements/TextBlock';
import { MediaTextModule   } from '../elements/MediaText';
import { CardRowModule     } from '../elements/CardRow';
```

**Container depends on these keys at runtime** (via `ContainerDefaults.children`). No import-level dependency between plan 01 and plan 02 modules.

---

## Notes & Gotchas

- `figure` default `margin: 1em 40px` — must be reset to `margin: 0` in `ImageBlock.css`
- In Zod v4, `.default(val)` on a field makes it optional in input but always present in parsed output. `*Defaults` objects must still explicitly include those fields (used pre-parse).
- `key={index}` in CardRow is acceptable — cards come from static spec data with no runtime reordering.
- `imageAlt ?? ''` in CardRow ensures the `alt` attribute is always present; empty string is correct for decorative images.
