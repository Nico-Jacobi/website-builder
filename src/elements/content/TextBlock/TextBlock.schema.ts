import { z } from 'zod';
import type { ModuleMeta } from '../../../builder/types';

export const TextBlockPropsSchema = z.object({
    heading: z.string().optional(),
    body:    z.string(),
    subtext: z.string().optional(),
    align:   z.enum(['left', 'center', 'right']).default('left'),
});

export type TextBlockProps = z.infer<typeof TextBlockPropsSchema>;

export const TextBlockDefaults: TextBlockProps = {
    body:  'Enter your body text here.',
    align: 'left',
};

export const TextBlockMeta: ModuleMeta = {
    name:        'TextBlock',
    category:    'content',
    description: 'Heading, body paragraph, and optional subtext with configurable text alignment.',
    tags:        ['text', 'heading', 'copy', 'paragraph', 'content'],
};
