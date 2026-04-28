import { z } from 'zod';
import type { ModuleMeta, ContentField } from '../types';
import type { ModuleSpec } from './index';

/** Ein einzelnes Feature-Element im Raster. */
export const FeatureItemSchema = z.object({
    /** Emoji oder einzelnes Unicode-Zeichen, z.B. "⚡" oder "→". */
    icon: z.string(),
    /** Kurze Feature-Bezeichnung. */
    heading: z.string(),
    /** Beschreibungstext des Features (1–2 Sätze). */
    body: z.string(),
});
export type FeatureItem = z.infer<typeof FeatureItemSchema>;

export const FeatureGridPropsSchema = z.object({
    /**
     * Optionale Überschrift über dem Raster (zentriert).
     */
    heading: z.string().optional(),

    /**
     * Optionaler Untertext unter der Überschrift.
     */
    subheading: z.string().optional(),

    /**
     * Die Feature-Kacheln. Mindestens 1, maximal 9.
     */
    features: z.array(FeatureItemSchema).min(1).max(9),

    /**
     * Anzahl der Rasterspalten auf Desktop. Omit für Default '3'.
     * CSS-Custom-Property steuert das Grid.
     */
    columns: z.enum(['2', '3', '4']).optional(),
});
export type FeatureGridProps = z.infer<typeof FeatureGridPropsSchema>;

export const FeatureGridDefaults: FeatureGridProps = {
    heading: 'Unsere Features',
    features: [
        { icon: '⚡', heading: 'Feature Eins',   body: 'Eine kurze Beschreibung dieser Feature.'         },
        { icon: '🔒', heading: 'Feature Zwei',   body: 'Eine kurze Beschreibung dieser Feature.'         },
        { icon: '🌐', heading: 'Feature Drei',   body: 'Eine kurze Beschreibung dieser Feature.'         },
        { icon: '🎨', heading: 'Feature Vier',   body: 'Eine kurze Beschreibung dieser Feature.'         },
        { icon: '📊', heading: 'Feature Fünf',   body: 'Eine kurze Beschreibung dieser Feature.'         },
        { icon: '🔄', heading: 'Feature Sechs',  body: 'Eine kurze Beschreibung dieser Feature.'         },
    ],
    columns: '3',
};

export const FeatureGridMeta: ModuleMeta = {
    name:        'FeatureGrid',
    category:    'content',
    description: 'Raster aus Feature-Kacheln mit Icon, Heading und Body. Ideal für Produkt-Features, Vorteile oder Service-Säulen.',
    icon:        'Grid3x3',
    tags:        ['features', 'grid', 'icons', 'benefits', 'product', 'marketing', 'tiles'],
};

export const FeatureGridContentFields: ContentField[] = [
    { path: 'heading',              type: 'text' },
    { path: 'subheading',           type: 'text' },
    { path: 'features[].icon',      type: 'text' },
    { path: 'features[].heading',   type: 'text' },
    { path: 'features[].body',      type: 'text' },
];

export const FeatureGridModuleSpec: ModuleSpec<FeatureGridProps> = {
    meta:          FeatureGridMeta,
    propsSchema:   FeatureGridPropsSchema,
    defaults:      FeatureGridDefaults,
    contentFields: FeatureGridContentFields,
};
