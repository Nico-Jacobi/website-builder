import { z } from 'zod';
import type { ModuleMeta, ContentField } from '../types';
import type { ModuleSpec } from './index';

export const HeroBannerPropsSchema = z.object({
    /** Large H1 headline displayed center-stage. */
    heading: z.string(),

    /** Smaller paragraph below the heading. */
    subheading: z.string().optional(),

    /**
     * Keywords describing the desired background photo (e.g. "cozy cafe interior warm light").
     * Filled automatically into backgroundImage — do not provide a URL.
     */
    imageQuery: z.string().optional(),

    /**
     * Background color as any CSS color string (e.g. '#2D5BFF', 'hsl(230,100%,50%)').
     * Applied as an inline style because the value is unbounded.
     * Defaults to var(--primary) via CSS when omitted.
     * When backgroundImage is also set this color is used as the overlay tint.
     */
    background: z.string().optional(),

    /**
     * URL of a full-bleed background photo.
     * When provided the image is displayed cover-fit and a semi-transparent
     * overlay (from `background`) is layered on top so text stays legible.
     */
    backgroundImage: z.string().optional(),

    /**
     * Minimum height in pixels. Applied as inline style.
     * Useful when no background image is set — ensures the hero doesn't collapse.
     * Accepts 200 (minimum) to 900 (maximum). Defaults to 480.
     */
    minHeight: z.number().min(200).max(900).optional(),

    /**
     * When true, renders a subtle dot-grid overlay over the hero background
     * for extra visual texture. Defaults to false.
     */
    gridOverlay: z.boolean().optional(),

    /** Label for the primary CTA pill button. */
    ctaLabel: z.string().optional(),

    /** Target URL for the primary CTA pill button. */
    ctaHref: z.string().optional(),

    /** Label for the secondary (ghost) CTA pill button. */
    ctaSecondaryLabel: z.string().optional(),

    /** Target URL for the secondary (ghost) CTA pill button. */
    ctaSecondaryHref: z.string().optional(),
});

export type HeroBannerProps = z.infer<typeof HeroBannerPropsSchema>;

export const HeroBannerDefaults: HeroBannerProps = {
    heading: 'Willkommen',
    subheading: 'Ein kurzer Beschreibungstext.',
};

export const HeroBannerMeta: ModuleMeta = {
    name: 'HeroBanner',
    category: 'layout',
    description:
        'Full-width centered hero section with headline, optional subheading, background image/color, and configurable minimum height. Text is centered both horizontally and vertically. Place directly below the Header.',
    icon: 'Rocket',
    tags: ['hero', 'banner', 'layout', 'landing'],
};

export const HeroBannerContentFields: ContentField[] = [
    { path: 'heading',            type: 'text'      },
    { path: 'subheading',         type: 'text'      },
    { path: 'imageQuery',         type: 'image_ref' },
    { path: 'backgroundImage',    type: 'image_ref' },
    { path: 'ctaLabel',           type: 'text'      },
    { path: 'ctaHref',            type: 'url'       },
    { path: 'ctaSecondaryLabel',  type: 'text'      },
    { path: 'ctaSecondaryHref',   type: 'url'       },
];

export const HeroBannerModuleSpec: ModuleSpec<HeroBannerProps> = {
    meta:          HeroBannerMeta,
    propsSchema:   HeroBannerPropsSchema,
    defaults:      HeroBannerDefaults,
    contentFields: HeroBannerContentFields,
};
