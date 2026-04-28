import { z } from 'zod';
import type { ModuleMeta, ContentField } from '../types';
import type { ModuleSpec } from './index';
import { CardSchema } from '../schemas';

export const CardGridPropsSchema = z.object({
    /** Optional section heading rendered above the grid. */
    heading: z.string().optional(),
    /** Optional subheading rendered below the heading. */
    subheading: z.string().optional(),
    cards:   z.array(CardSchema).min(1),
    columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
});

export type CardGridProps = z.infer<typeof CardGridPropsSchema>;

export const CardGridDefaults: CardGridProps = {
    cards: [
        { title: 'Karte Eins',   body: 'Beschreibung der ersten Karte.'  },
        { title: 'Karte Zwei',   body: 'Beschreibung der zweiten Karte.' },
        { title: 'Karte Drei', body: 'Beschreibung der dritten Karte.'  },
        { title: 'Karte Vier',  body: 'Beschreibung der vierten Karte.' },
    ],
    columns: 3,
};

export const CardGridMeta: ModuleMeta = {
    name:        'CardGrid',
    category:    'content',
    description: 'Grid of image-title-body cards that wraps into rows. Use instead of CardRow when cards should stack rather than scroll horizontally.',
    icon:        'LayoutGrid',
    tags:        ['cards', 'grid', 'gallery', 'features', 'wrap'],
};

export const CardGridContentFields: ContentField[] = [
    { path: 'heading',            type: 'text' },
    { path: 'subheading',         type: 'text' },
    { path: 'cards[].title',      type: 'text' },
    { path: 'cards[].body',       type: 'text' },
    { path: 'cards[].imageAlt',   type: 'text' },
    { path: 'cards[].imageQuery', type: 'image_ref' },
    { path: 'cards[].imageSrc',   type: 'image_ref' },
];

export const CardGridModuleSpec: ModuleSpec<CardGridProps> = {
    meta:          CardGridMeta,
    propsSchema:   CardGridPropsSchema,
    defaults:      CardGridDefaults,
    contentFields: CardGridContentFields,
};
