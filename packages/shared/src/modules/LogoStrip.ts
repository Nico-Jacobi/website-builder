import { z } from 'zod';
import type { ModuleMeta, ContentField } from '../types';
import type { ModuleSpec } from './index';

/** Ein einzelnes Logo-Item im LogoStrip. */
export const LogoItemSchema = z.object({
    /** Firmen- oder Markenname; dient als Fallback-Label. */
    name: z.string(),
    /** Direkte Bild-URL. Wird gegenüber imageQuery bevorzugt, wenn beide gesetzt. */
    src: z.string().optional(),
    /** Suchanfrage für automatischen Bild-Fetch (Pixabay o.ä.). */
    imageQuery: z.string().optional(),
    /** Alt-Text für Screenreader; fällt auf `name` zurück. */
    alt: z.string().optional(),
});
export type LogoItem = z.infer<typeof LogoItemSchema>;

export const LogoStripPropsSchema = z.object({
    /**
     * Optionale Beschriftung über den Logos, z.B. "Trusted by leading teams".
     * Wird als kleines Uppercase-Label gerendert.
     */
    heading: z.string().optional(),

    /**
     * Liste der Logos. Mindestens eines erforderlich.
     */
    logos: z.array(LogoItemSchema).min(1),

    /**
     * Wenn true: Logos laufen als endlose Scroll-Animation (Marquee).
     * Deaktiviert bei prefers-reduced-motion automatisch.
     */
    marquee: z.boolean().optional(),
});
export type LogoStripProps = z.infer<typeof LogoStripPropsSchema>;

export const LogoStripDefaults: LogoStripProps = {
    heading: 'Trusted by leading teams',
    logos: [
        { name: 'Vercel',  imageQuery: 'vercel logo tech company'       },
        { name: 'Linear',  imageQuery: 'linear app logo software'        },
        { name: 'Stripe',  imageQuery: 'stripe payment logo'             },
        { name: 'Figma',   imageQuery: 'figma design tool logo'          },
    ],
    marquee: false,
};

export const LogoStripMeta: ModuleMeta = {
    name:        'LogoStrip',
    category:    'media',
    description: 'Horizontaler Streifen mit Partner- oder Kundenlogos als Trust-Signal. Unterstützt Grayscale-Hover und optionale Marquee-Animation.',
    tags:        ['logos', 'trust', 'partners', 'clients', 'brands', 'marquee', 'marketing'],
};

export const LogoStripContentFields: ContentField[] = [
    { path: 'heading',            type: 'text' },
    { path: 'logos[].name',       type: 'text' },
    { path: 'logos[].src',        type: 'image_ref' },
    { path: 'logos[].imageQuery', type: 'text' },
    { path: 'logos[].alt',        type: 'text' },
];

export const LogoStripModuleSpec: ModuleSpec<LogoStripProps> = {
    meta:          LogoStripMeta,
    propsSchema:   LogoStripPropsSchema,
    defaults:      LogoStripDefaults,
    contentFields: LogoStripContentFields,
};
