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
