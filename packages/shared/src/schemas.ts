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
 * Full description of a website: optional theme overrides + a vertical stack
 * of blocks rendered in order.
 */
export const SiteSpecSchema = z.object({
    theme:  z.record(z.string(), z.string()).optional(),
    blocks: z.array(BlockSpecSchema),
});

export type SiteSpec = z.infer<typeof SiteSpecSchema>;
