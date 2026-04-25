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
    heading: 'Everything you need',
    features: [
        { icon: '⚡', heading: 'Lightning Fast',      body: 'Built for performance from the ground up. Zero compromise.'         },
        { icon: '🔒', heading: 'Secure by Default',   body: 'Enterprise-grade security out of the box.'                          },
        { icon: '🌐', heading: 'Global Scale',         body: 'Deploy to 40+ regions worldwide in seconds.'                        },
        { icon: '🎨', heading: 'Beautiful DX',         body: 'Developer experience that feels like magic.'                        },
        { icon: '📊', heading: 'Real-time Analytics',  body: 'Understand your users with live insights.'                          },
        { icon: '🔄', heading: 'Always in Sync',       body: 'Automatic updates and zero-downtime deploys.'                       },
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
