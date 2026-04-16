import { z } from 'zod';
import type { ModuleMeta } from '../../../builder/types';

export { ImageBlockContentFields } from '@website-builder/shared';

export const ImageBlockPropsSchema = z.object({
    /** Keywords describing the desired image (e.g. "modern office workspace"). Filled automatically into src — do not provide a URL. */
    imageQuery: z.string(),
    /** Populated automatically from imageQuery — leave empty. */
    src:        z.string().default(''),
    alt:        z.string(),
    caption:    z.string().optional(),
    objectFit:  z.enum(['cover', 'contain', 'fill']).default('cover'),
    maxHeight:  z.number().default(480),
});

export type ImageBlockProps = z.infer<typeof ImageBlockPropsSchema>;

export const ImageBlockDefaults: ImageBlockProps = {
    imageQuery: 'placeholder image',
    src:        '',
    alt:        'Placeholder image',
    objectFit:  'cover',
    maxHeight:  480,
};

export const ImageBlockMeta: ModuleMeta = {
    name:        'ImageBlock',
    category:    'media',
    description: 'Full-width image with an optional caption. Use for hero images, section dividers, or standalone illustrations.',
    tags:        ['image', 'media', 'photo', 'caption'],
};

