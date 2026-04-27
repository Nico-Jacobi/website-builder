import { z } from 'zod';
import type { Tone } from './types';

/** label + href pair used by nav and footer link lists. */
export const LinkSchema = z.object({
    label: z.string(),
    href:  z.string(),
});
export type Link = z.infer<typeof LinkSchema>;

/** Image-title-body card used by CardRow and CardGrid. */
export const CardSchema = z.object({
    /** Keywords describing the desired image. Filled automatically into imageSrc. */
    imageQuery: z.string().optional(),
    /** Populated automatically from imageQuery. */
    imageSrc:   z.string().optional(),
    imageAlt:   z.string().optional(),
    title:      z.string(),
    body:       z.string().optional(),
});
export type CardData = z.infer<typeof CardSchema>;

/**
 * A single block inside a site spec.
 * Recursive via z.lazy so containers can embed arrays of nested BlockSpecs.
 */
export const BlockSpecSchema: z.ZodType<BlockSpec> = z.lazy(() =>
    z.object({
        id:    z.string().optional(),
        type:  z.string(),
        props: z.record(z.string(), z.unknown()),
        tone:  z.enum(['surface', 'muted', 'primary', 'dark', 'accent']).optional(),
    }),
);

export type BlockSpec = {
    id?: string;
    type: string;
    props: Record<string, unknown>;
    tone?: Tone;
};

/**
 * Site-level chrome: Header and Footer blocks that are shared across all pages.
 * Both are optional so that existing specs without chrome remain valid.
 */
export const SiteChromeSchema = z.object({
    header: BlockSpecSchema.optional(),
    footer: BlockSpecSchema.optional(),
});
export type SiteChrome = z.infer<typeof SiteChromeSchema>;

/**
 * Full description of a website: optional theme overrides, optional site-wide
 * chrome (header/footer), and a vertical stack of page-content blocks.
 */
export const SiteSpecSchema = z.object({
    theme:  z.record(z.string(), z.string()).optional(),
    chrome: SiteChromeSchema.optional(),
    blocks: z.array(BlockSpecSchema),
});

export type SiteSpec = z.infer<typeof SiteSpecSchema>;
