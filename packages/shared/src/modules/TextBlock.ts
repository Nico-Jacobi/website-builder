import { z } from 'zod';
import type { ModuleMeta, ContentField } from '../types';
import type { ModuleSpec } from './index';

export const TextBlockPropsSchema = z.object({
    overline:    z.string().optional(),
    heading:     z.string().optional(),
    body:        z.string(),
    subtext:     z.string().optional(),
    align:       z.enum(['left', 'center', 'right']).default('left'),
    /** Optional CTA label shown as a text link with arrow below the body. */
    actionLabel: z.string().optional(),
    /** URL the action link points to. Only rendered when actionLabel is also set. */
    actionHref:  z.string().optional(),
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
    { path: 'overline',    type: 'text' },
    { path: 'heading',     type: 'text' },
    { path: 'body',        type: 'text' },
    { path: 'subtext',     type: 'text' },
    { path: 'actionLabel', type: 'text' },
    { path: 'actionHref',  type: 'url'  },
];

export const TextBlockModuleSpec: ModuleSpec<TextBlockProps> = {
    meta:          TextBlockMeta,
    propsSchema:   TextBlockPropsSchema,
    defaults:      TextBlockDefaults,
    contentFields: TextBlockContentFields,
};
