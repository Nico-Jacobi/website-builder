import { z } from 'zod';
import type { ModuleMeta, ContentField } from '../types';
import type { ModuleSpec } from './index';

export const ImageBlockPropsSchema = z.object({
    /** Keywords describing the desired image (e.g. "modern office workspace"). Filled automatically into src — do not provide a URL. */
    imageQuery: z.string(),
    /** Populated automatically from imageQuery — leave empty. */
    src:        z.string().default(''),
    alt:        z.string(),
    caption:    z.string().optional(),
    objectFit:  z.enum(['cover', 'contain', 'fill']).default('cover'),
    maxHeight:  z.number().default(480),
    /**
     * Optional fixed aspect ratio applied to the image via CSS `aspect-ratio`.
     * Omit (undefined) to let the image use its natural dimensions.
     */
    aspectRatio: z.enum(['16/9', '4/3', '1/1', '3/2']).optional(),
});

export type ImageBlockProps = z.infer<typeof ImageBlockPropsSchema>;

export const ImageBlockDefaults: ImageBlockProps = {
    imageQuery:  'Bild',
    src:         '',
    alt:         'Ein Bild',
    objectFit:   'cover',
    maxHeight:   480,
};

export const ImageBlockMeta: ModuleMeta = {
    name:        'ImageBlock',
    category:    'media',
    description: 'Full-width image with an optional caption. Use for hero images, section dividers, or standalone illustrations.',
    icon:        'Image',
    tags:        ['image', 'media', 'photo', 'caption'],
};

export const ImageBlockContentFields: ContentField[] = [
    { path: 'alt',        type: 'text' },
    { path: 'caption',    type: 'text' },
    { path: 'imageQuery', type: 'image_ref' },
    { path: 'src',        type: 'image_ref' },
];

export const ImageBlockModuleSpec: ModuleSpec<ImageBlockProps> = {
    meta:          ImageBlockMeta,
    propsSchema:   ImageBlockPropsSchema,
    defaults:      ImageBlockDefaults,
    contentFields: ImageBlockContentFields,
};
