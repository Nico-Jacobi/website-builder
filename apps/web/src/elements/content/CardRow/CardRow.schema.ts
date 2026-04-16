import { z } from 'zod';
import type { ModuleMeta } from '../../../builder/types';
import { CardSchema } from '../../shared/schemas';

export { CardRowContentFields } from '@website-builder/shared';

export const CardRowPropsSchema = z.object({
    cards: z.array(CardSchema).min(1),
});

export type CardRowProps = z.infer<typeof CardRowPropsSchema>;

export const CardRowDefaults: CardRowProps = {
    cards: [
        { title: 'Card One',   body: 'Description for the first card.'  },
        { title: 'Card Two',   body: 'Description for the second card.' },
        { title: 'Card Three', body: 'Description for the third card.'  },
    ],
};

export const CardRowMeta: ModuleMeta = {
    name:        'CardRow',
    category:    'content',
    description: 'A horizontal row of image-title-body cards. Scrolls horizontally on narrow viewports.',
    tags:        ['cards', 'grid', 'gallery', 'features', 'list'],
};

