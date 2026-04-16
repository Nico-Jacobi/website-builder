import { z } from 'zod';
import type { ModuleMeta } from '../../../builder/types';
import { CardSchema } from '../../shared/schemas';

export const CardGridPropsSchema = z.object({
    cards:   z.array(CardSchema).min(1),
    columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
});

export type CardGridProps = z.infer<typeof CardGridPropsSchema>;

export const CardGridDefaults: CardGridProps = {
    cards: [
        { title: 'Grid Card One',   body: 'Description for the first card.'  },
        { title: 'Grid Card Two',   body: 'Description for the second card.' },
        { title: 'Grid Card Three', body: 'Description for the third card.'  },
        { title: 'Grid Card Four',  body: 'Description for the fourth card.' },
    ],
    columns: 4,
};

export const CardGridMeta: ModuleMeta = {
    name:        'CardGrid',
    category:    'content',
    description: 'Grid of image-title-body cards that wraps into rows. Use instead of CardRow when cards should stack rather than scroll horizontally.',
    tags:        ['cards', 'grid', 'gallery', 'features', 'wrap'],
};
