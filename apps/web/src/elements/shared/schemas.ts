import { z } from 'zod';

/** label + href pair used by nav and footer link lists. */
export const LinkSchema = z.object({
    label: z.string(),
    href:  z.string(),
});
export type Link = z.infer<typeof LinkSchema>;

/** Image-title-body card used by CardRow and CardGrid. */
export const CardSchema = z.object({
    /** Keywords describing the desired image (e.g. "espresso coffee cup"). Filled automatically into imageSrc — do not provide a URL. */
    imageQuery: z.string().optional(),
    /** Populated automatically from imageQuery — leave empty. */
    imageSrc:   z.string().optional(),
    imageAlt:   z.string().optional(),
    title:      z.string(),
    body:       z.string().optional(),
});
export type CardData = z.infer<typeof CardSchema>;
