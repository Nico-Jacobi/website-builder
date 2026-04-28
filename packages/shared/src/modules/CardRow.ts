import { z } from 'zod';
import type { ModuleMeta, ContentField } from '../types';
import type { ModuleSpec } from './index';
import { CardSchema } from '../schemas';

export const CardRowPropsSchema = z.object({
    /** Optional section heading rendered above the card row. */
    heading: z.string().optional(),
    /** Optional subheading rendered below the heading. */
    subheading: z.string().optional(),
    cards: z.array(CardSchema).min(1),
});

export type CardRowProps = z.infer<typeof CardRowPropsSchema>;

export const CardRowDefaults: CardRowProps = {
    cards: [
        { title: 'Karte Eins',   body: 'Beschreibung der ersten Karte.'  },
        { title: 'Karte Zwei',   body: 'Beschreibung der zweiten Karte.' },
        { title: 'Karte Drei', body: 'Beschreibung der dritten Karte.'  },
    ],
};

export const CardRowMeta: ModuleMeta = {
    name:        'CardRow',
    category:    'content',
    description: 'A horizontal row of image-title-body cards. Scrolls horizontally on narrow viewports.',
    icon:        'Rows3',
    tags:        ['cards', 'grid', 'gallery', 'features', 'list'],
};

export const CardRowContentFields: ContentField[] = [
    { path: 'heading',            type: 'text' },
    { path: 'subheading',         type: 'text' },
    { path: 'cards[].title',      type: 'text' },
    { path: 'cards[].body',       type: 'text' },
    { path: 'cards[].imageAlt',   type: 'text' },
    { path: 'cards[].imageQuery', type: 'image_ref' },
    { path: 'cards[].imageSrc',   type: 'image_ref' },
];

export const CardRowModuleSpec: ModuleSpec<CardRowProps> = {
    meta:          CardRowMeta,
    propsSchema:   CardRowPropsSchema,
    defaults:      CardRowDefaults,
    contentFields: CardRowContentFields,
};
