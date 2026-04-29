import { z } from 'zod';
import type { ModuleMeta, ContentField } from '../types';
import type { ModuleSpec } from './index';
import { LinkSchema } from '../schemas';

export const VideoFeaturePropsSchema = z.object({
    heading:       z.string(),
    body:          z.string().optional(),
    videoSrc:      z.string(),
    posterSrc:     z.string().optional(),
    videoType:     z.enum(['file', 'youtube', 'vimeo']).default('file'),
    videoPosition: z.enum(['left', 'right', 'below']).default('right'),
    perspective:   z.enum(['none', 'left', 'right', 'bottom']).default('none'),
    glow:          z.enum(['none', 'primary', 'secondary']).default('none'),
    cta:           LinkSchema.optional(),
});

export type VideoFeatureProps = z.infer<typeof VideoFeaturePropsSchema>;

export const VideoFeatureDefaults: VideoFeatureProps = {
    heading:       'See it in action',
    body:          'A short walkthrough showing how teams use the product end-to-end.',
    videoSrc:      'https://www.w3schools.com/html/mov_bbb.mp4',
    videoType:     'file',
    videoPosition: 'right',
    perspective:   'none',
    glow:          'none',
    cta:           { label: 'Watch full demo', href: '#' },
};

export const VideoFeatureMeta: ModuleMeta = {
    name:        'VideoFeature',
    category:    'media',
    description: 'A feature block that pairs heading + body with a video (file/YouTube/Vimeo). Supports perspective transforms and glow backdrops.',
    icon:        'PlayCircle',
    tags:        ['video', 'feature', 'product', 'demo'],
};

export const VideoFeatureContentFields: ContentField[] = [];

export const VideoFeatureModuleSpec: ModuleSpec<VideoFeatureProps> = {
    meta:          VideoFeatureMeta,
    propsSchema:   VideoFeaturePropsSchema,
    defaults:      VideoFeatureDefaults,
    contentFields: VideoFeatureContentFields,
};
