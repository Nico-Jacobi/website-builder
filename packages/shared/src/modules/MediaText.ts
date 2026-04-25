import { z } from 'zod';
import type { ModuleMeta, ContentField } from '../types';
import type { ModuleSpec } from './index';

export const MediaTextPropsSchema = z.object({
    /** Keywords describing the desired image (e.g. "barista latte art coffee"). Filled automatically into imageSrc — do not provide a URL. */
    imageQuery:    z.string(),
    /** Populated automatically from imageQuery — leave empty. */
    imageSrc:      z.string().default(''),
    imageAlt:      z.string(),
    heading:       z.string().optional(),
    body:          z.string(),
    imagePosition: z.enum(['left', 'right']).default('left'),
});

export type MediaTextProps = z.infer<typeof MediaTextPropsSchema>;

export const MediaTextDefaults: MediaTextProps = {
    imageQuery:    'placeholder image',
    imageSrc:      '',
    imageAlt:      'Placeholder image',
    body:          'Describe what makes this image interesting.',
    imagePosition: 'left',
};

export const MediaTextMeta: ModuleMeta = {
    name:        'MediaText',
    category:    'content',
    description: 'Image beside a text column (heading + body). Position image left or right. Stacks vertically on narrow viewports.',
    icon:        'Newspaper',
    tags:        ['media', 'image', 'text', 'side-by-side', 'layout'],
};

export const MediaTextContentFields: ContentField[] = [
    { path: 'heading',    type: 'text' },
    { path: 'body',       type: 'text' },
    { path: 'imageAlt',   type: 'text' },
    { path: 'imageQuery', type: 'image_ref' },
    { path: 'imageSrc',   type: 'image_ref' },
];

export const MediaTextModuleSpec: ModuleSpec<MediaTextProps> = {
    meta:          MediaTextMeta,
    propsSchema:   MediaTextPropsSchema,
    defaults:      MediaTextDefaults,
    contentFields: MediaTextContentFields,
};
