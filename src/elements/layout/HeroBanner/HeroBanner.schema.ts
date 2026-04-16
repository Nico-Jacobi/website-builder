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
     * Minimum height in pixels. Applied as inline style.
     * Useful when no background image is set — ensures the hero doesn't collapse.
     * Accepts 200 (minimum) to 900 (maximum). Defaults to 480.
     */
    minHeight: z.number().min(200).max(900).optional(),
});

export type HeroBannerProps = z.infer<typeof HeroBannerPropsSchema>;

export const HeroBannerDefaults: HeroBannerProps = {
    heading: 'Welcome to Our Platform',
    subheading: 'Everything you need to build and ship faster.',
    ctaLabel: 'Get Started',
    ctaHref: '#',
};

export const HeroBannerMeta: ModuleMeta = {
    name: 'HeroBanner',
    category: 'layout',
    description:
        'Full-width centered hero section with headline, optional subheading, optional CTA button, and configurable minimum height. Place directly below the Header.',
    tags: ['hero', 'banner', 'cta', 'layout', 'landing'],
};
