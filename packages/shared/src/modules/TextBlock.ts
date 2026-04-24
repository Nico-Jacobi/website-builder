import { z } from 'zod';
import type { ModuleMeta, ContentField } from '../types';
import type { ModuleSpec } from './index';

export const TextBlockPropsSchema = z.object({
    eyebrow: z.string().optional(),
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

export const TextBlockContentFields: ContentField[] = [
    { path: 'eyebrow', type: 'text' },
    { path: 'heading', type: 'text' },
    { path: 'body',    type: 'text' },
    { path: 'subtext', type: 'text' },
];

export const TextBlockModuleSpec: ModuleSpec<TextBlockProps> = {
    meta:          TextBlockMeta,
    propsSchema:   TextBlockPropsSchema,
    defaults:      TextBlockDefaults,
    contentFields: TextBlockContentFields,
};
