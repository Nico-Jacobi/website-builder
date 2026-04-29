import { z } from 'zod';
import type { ModuleMeta, ContentField } from '../types';
import type { ModuleSpec } from './index';

export const MarqueeItemSchema = z.object({
    text:     z.string().optional(),
    imageSrc: z.string().optional(),
    imageAlt: z.string().optional(),
    href:     z.string().optional(),
});
export type MarqueeItem = z.infer<typeof MarqueeItemSchema>;

export const MarqueePropsSchema = z.object({
    items:         z.array(MarqueeItemSchema).min(1),
    direction:     z.enum(['left', 'right']).default('left'),
    speed:         z.enum(['slow', 'normal', 'fast']).default('normal'),
    pauseOnHover:  z.boolean().default(true),
    style:         z.enum(['text', 'image', 'badge']).default('text'),
});

export type MarqueeProps = z.infer<typeof MarqueePropsSchema>;

export const MarqueeDefaults: MarqueeProps = {
    items: [
        { text: 'Build faster' },
        { text: 'Ship anywhere' },
        { text: 'Scale with confidence' },
        { text: 'Loved by makers' },
        { text: 'Open source' },
        { text: 'No lock-in' },
        { text: 'Fully typed' },
        { text: 'Production ready' },
    ],
    direction:    'left',
    speed:        'normal',
    pauseOnHover: true,
    style:        'text',
};

export const MarqueeMeta: ModuleMeta = {
    name:        'Marquee',
    category:    'media',
    description: 'A horizontally scrolling band of text, images, or pill badges. Loops seamlessly and can pause on hover.',
    icon:        'GalleryHorizontalEnd',
    tags:        ['marquee', 'scroll', 'ticker', 'logos', 'partners'],
};

export const MarqueeContentFields: ContentField[] = [
    { path: 'items[].text',     type: 'text' },
    { path: 'items[].imageAlt', type: 'text' },
    { path: 'items[].imageSrc', type: 'image_ref' },
];

export const MarqueeModuleSpec: ModuleSpec<MarqueeProps> = {
    meta:          MarqueeMeta,
    propsSchema:   MarqueePropsSchema,
    defaults:      MarqueeDefaults,
    contentFields: MarqueeContentFields,
};
