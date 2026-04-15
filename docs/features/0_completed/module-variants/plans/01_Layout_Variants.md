# Plan 01: Layout Variants — HeroBanner, FooterSimple

## Goal

Add two new layout modules — `HeroBanner` and `FooterSimple` — following the full
4-file module contract with JSDoc on every schema field, BEM CSS using only design
tokens, and data-attribute-driven enum variants. Register both in registry.ts.

---

## Files to Create

```
src/elements/layout/HeroBanner/HeroBanner.schema.ts
src/elements/layout/HeroBanner/HeroBanner.tsx
src/elements/layout/HeroBanner/HeroBanner.css
src/elements/layout/HeroBanner/index.ts

src/elements/layout/FooterSimple/FooterSimple.schema.ts
src/elements/layout/FooterSimple/FooterSimple.tsx
src/elements/layout/FooterSimple/FooterSimple.css
src/elements/layout/FooterSimple/index.ts
```

**Modified:** `src/builder/registry.ts`

---

## Module 1: HeroBanner

### `HeroBanner.schema.ts`

```ts
import { z } from 'zod';
import type { ModuleMeta } from '../../../builder/types';

export const HeroBannerPropsSchema = z.object({
    /** Large H1 headline displayed center-stage. */
    heading: z.string(),

    /** Smaller paragraph below the heading. */
    subheading: z.string().optional(),

    /** Call-to-action button label. No button rendered when omitted. */
    ctaLabel: z.string().optional(),

    /** URL the CTA button links to. Falls back to '#' when ctaLabel is set but this is omitted. */
    ctaHref: z.string().optional(),

    /**
     * Background color as any CSS color string (e.g. '#2D5BFF', 'hsl(230,100%,50%)').
     * Applied as an inline style because the value is unbounded.
     * Defaults to var(--primary) via CSS when omitted.
     */
    background: z.string().optional(),

    /**
     * Controls text contrast against the background.
     * 'light' renders white text (for dark backgrounds).
     * 'dark' renders dark text (for light backgrounds).
     * Drives the data-text-color attribute; CSS attribute selectors apply the colour.
     */
    textColor: z.enum(['light', 'dark']).default('light'),
});

export type HeroBannerProps = z.infer<typeof HeroBannerPropsSchema>;

export const HeroBannerDefaults: HeroBannerProps = {
    heading: 'Welcome to Our Platform',
    subheading: 'Everything you need to build and ship faster.',
    ctaLabel: 'Get Started',
    ctaHref: '#',
    textColor: 'light',
};

export const HeroBannerMeta: ModuleMeta = {
    name: 'HeroBanner',
    category: 'layout',
    description:
        'Full-width centered hero section with headline, optional subheading, and optional CTA button. Place directly below the Header.',
    tags: ['hero', 'banner', 'cta', 'layout', 'landing'],
};
```

### `HeroBanner.tsx`

```tsx
import './HeroBanner.css';
import type { CSSProperties } from 'react';
import type { HeroBannerProps } from './HeroBanner.schema';

export default function HeroBanner({
    heading,
    subheading,
    ctaLabel,
    ctaHref,
    background,
    textColor,
}: HeroBannerProps) {
    // Only apply inline style when background prop is explicitly set.
    // When undefined, CSS var(--primary) takes effect naturally.
    const rootStyle: CSSProperties | undefined =
        background !== undefined ? { background } : undefined;

    return (
        <section
            className="hero_banner"
            data-text-color={textColor}
            style={rootStyle}
        >
            <div className="hero_banner__inner">
                <h1 className="hero_banner__heading">{heading}</h1>

                {subheading && (
                    <p className="hero_banner__subheading">{subheading}</p>
                )}

                {ctaLabel && (
                    <a className="hero_banner__cta" href={ctaHref ?? '#'}>
                        {ctaLabel}
                    </a>
                )}
            </div>
        </section>
    );
}
```

### `HeroBanner.css`

```css
/* ============================================================
   HeroBanner — full-width centered hero section
   BEM root: .hero_banner
   textColor variants driven by data-text-color attribute
   ============================================================ */

.hero_banner {
    width: 100%;
    box-sizing: border-box;
    background: var(--primary);   /* overridden by inline style when background prop is set */
    padding: var(--space_xl) var(--space_lg);
    font-family: var(--font_family);
    text-align: center;
}

.hero_banner__inner {
    max-width: 720px;
    margin-inline: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space_md);
}

.hero_banner__heading {
    margin: 0;
    font-size: clamp(2rem, 5vw, 3.5rem);
    font-weight: 800;
    line-height: 1.1;
}

.hero_banner__subheading {
    margin: 0;
    font-size: clamp(1rem, 2.5vw, 1.25rem);
    opacity: 0.85;
    max-width: 560px;
}

.hero_banner__cta {
    display: inline-block;
    background: var(--accent);
    color: var(--inverted_text);
    border-radius: var(--radius_md);
    padding: var(--space_sm) var(--space_lg);
    font-size: 1rem;
    font-weight: 600;
    text-decoration: none;
    transition: opacity 0.2s;
    margin-top: var(--space_sm);
}

.hero_banner__cta:hover {
    opacity: 0.85;
}

/* light variant: white text (default for dark backgrounds) */
.hero_banner[data-text-color="light"] .hero_banner__heading,
.hero_banner[data-text-color="light"] .hero_banner__subheading {
    color: var(--inverted_text);
}

/* dark variant: dark text (for light or custom backgrounds) */
.hero_banner[data-text-color="dark"] .hero_banner__heading,
.hero_banner[data-text-color="dark"] .hero_banner__subheading {
    color: var(--text);
}

@media (max-width: 640px) {
    .hero_banner {
        padding: var(--space_lg) var(--space_md);
    }
}
```

### `index.ts`

```ts
import HeroBanner from './HeroBanner';
import { HeroBannerPropsSchema, HeroBannerDefaults, HeroBannerMeta } from './HeroBanner.schema';
import type { HeroBannerProps } from './HeroBanner.schema';
import type { ModuleDefinition } from '../../../builder/types';

export const HeroBannerModule: ModuleDefinition<HeroBannerProps> = {
    meta:        HeroBannerMeta,
    propsSchema: HeroBannerPropsSchema,
    defaults:    HeroBannerDefaults,
    Component:   HeroBanner,
};

export { default as HeroBanner } from './HeroBanner';
export type { HeroBannerProps } from './HeroBanner.schema';
```

---

## Module 2: FooterSimple

### `FooterSimple.schema.ts`

```ts
import { z } from 'zod';
import type { ModuleMeta } from '../../../builder/types';

/**
 * A single link entry in the flat footer link list.
 */
const FooterSimpleLinkSchema = z.object({
    /** Visible text displayed for the link. */
    label: z.string(),
    /** URL the link navigates to. */
    href: z.string(),
});

export const FooterSimplePropsSchema = z.object({
    /** Short brand tagline shown on the left side of the footer. */
    tagline: z.string().optional(),

    /** Copyright notice shown beside the tagline. */
    copyright: z.string().optional(),

    /** Flat list of navigation or reference links shown on the right. */
    links: z.array(FooterSimpleLinkSchema).optional(),
});

export type FooterSimpleProps = z.infer<typeof FooterSimplePropsSchema>;

export const FooterSimpleDefaults: FooterSimpleProps = {
    tagline: 'Built with care.',
    copyright: `© ${new Date().getFullYear()} My Company`,
    links: [
        { label: 'Privacy', href: '#privacy' },
        { label: 'Terms',   href: '#terms'   },
        { label: 'Contact', href: '#contact'  },
    ],
};

export const FooterSimpleMeta: ModuleMeta = {
    name: 'FooterSimple',
    category: 'layout',
    description:
        'Minimal single-row footer with tagline and copyright on the left and a flat link list on the right. No link column groups.',
    tags: ['footer', 'links', 'simple', 'minimal', 'layout'],
};
```

### `FooterSimple.tsx`

```tsx
import './FooterSimple.css';
import type { FooterSimpleProps } from './FooterSimple.schema';

export default function FooterSimple({ tagline, copyright, links }: FooterSimpleProps) {
    const hasLinks = links && links.length > 0;

    return (
        <footer className="footer_simple">
            <div className="footer_simple__left">
                {tagline && <span className="footer_simple__tagline">{tagline}</span>}
                {copyright && <span className="footer_simple__copyright">{copyright}</span>}
            </div>

            {hasLinks && (
                <nav className="footer_simple__links">
                    {links!.map((link) => (
                        <a key={link.href} className="footer_simple__link" href={link.href}>
                            {link.label}
                        </a>
                    ))}
                </nav>
            )}
        </footer>
    );
}
```

### `FooterSimple.css`

```css
/* ============================================================
   FooterSimple — minimal single-row footer
   BEM root: .footer_simple
   Layout: flex row, space-between; wraps at ≤640px
   ============================================================ */

.footer_simple {
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: var(--space_md);
    padding: var(--space_md) var(--space_xl);
    background-color: var(--primary);
    color: var(--inverted_text);
    font-family: var(--font_family);
}

.footer_simple__left {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--space_md);
    flex-wrap: wrap;
}

.footer_simple__tagline {
    font-size: 0.95rem;
    font-weight: 500;
    opacity: 0.9;
}

.footer_simple__copyright {
    font-size: 0.85rem;
    opacity: 0.55;
}

.footer_simple__links {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--space_lg);
    flex-wrap: wrap;
}

.footer_simple__link {
    color: var(--inverted_text);
    text-decoration: none;
    font-size: 0.9rem;
    opacity: 0.8;
    transition: opacity 0.2s;
}

.footer_simple__link:hover {
    opacity: 1;
}

@media (max-width: 640px) {
    .footer_simple {
        flex-direction: column;
        align-items: flex-start;
        padding: var(--space_md);
    }

    .footer_simple__left {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space_xs);
    }
}
```

### `index.ts`

```ts
import FooterSimple from './FooterSimple';
import { FooterSimplePropsSchema, FooterSimpleDefaults, FooterSimpleMeta } from './FooterSimple.schema';
import type { FooterSimpleProps } from './FooterSimple.schema';
import type { ModuleDefinition } from '../../../builder/types';

export const FooterSimpleModule: ModuleDefinition<FooterSimpleProps> = {
    meta:        FooterSimpleMeta,
    propsSchema: FooterSimplePropsSchema,
    defaults:    FooterSimpleDefaults,
    Component:   FooterSimple,
};

export { default as FooterSimple } from './FooterSimple';
export type { FooterSimpleProps } from './FooterSimple.schema';
```

---

## Registry Update

Add after existing layout imports in `src/builder/registry.ts`:

```ts
import { HeroBannerModule  } from '../elements/layout/HeroBanner';
import { FooterSimpleModule } from '../elements/layout/FooterSimple';
```

Add to modules array (keeping layout modules grouped):

```ts
const modules: AnyModule[] = [
    HeaderModule,
    HeroBannerModule,    // ← new
    ContainerModule,
    FooterModule,
    FooterSimpleModule,  // ← new
    // ... rest unchanged
];
```

---

## Interface / Output (for coherence check)

**Registry keys produced:** `'HeroBanner'`, `'FooterSimple'`

**Import paths for plan 02/03:**
```ts
import { HeroBannerModule  } from '../elements/layout/HeroBanner';
import { FooterSimpleModule } from '../elements/layout/FooterSimple';
```

**No cross-plan type dependencies.** Plans 02 and 03 are independent.
