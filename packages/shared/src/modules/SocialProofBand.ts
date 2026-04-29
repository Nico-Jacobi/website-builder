import { z } from 'zod';
import type { ModuleMeta, ContentField } from '../types';
import type { ModuleSpec } from './index';

export const SocialProofAvatarSchema = z.object({
    src: z.string(),
    alt: z.string().optional(),
});

export const SocialProofBandPropsSchema = z.object({
    tagline:     z.string(),
    rating:      z.number().min(0).max(5).optional(),
    reviewCount: z.number().optional(),
    avatars:     z.array(SocialProofAvatarSchema).optional(),
    graphic:     z.enum(['rating', 'magic', 'gift', 'trophy', 'none']).default('rating'),
});

export type SocialProofBandProps = z.infer<typeof SocialProofBandPropsSchema>;

export const SocialProofBandDefaults: SocialProofBandProps = {
    tagline:     'Loved by 1,200+ teams worldwide',
    rating:      4.9,
    reviewCount: 1240,
    avatars: [
        { src: 'https://i.pravatar.cc/64?img=1', alt: 'Customer 1' },
        { src: 'https://i.pravatar.cc/64?img=2', alt: 'Customer 2' },
        { src: 'https://i.pravatar.cc/64?img=3', alt: 'Customer 3' },
        { src: 'https://i.pravatar.cc/64?img=4', alt: 'Customer 4' },
    ],
    graphic: 'rating',
};

export const SocialProofBandMeta: ModuleMeta = {
    name:        'SocialProofBand',
    category:    'content',
    description: 'A horizontal trust strip with stacked customer avatars, star rating, review count, and a tagline.',
    icon:        'Star',
    tags:        ['social-proof', 'rating', 'testimonial', 'trust'],
};

export const SocialProofBandContentFields: ContentField[] = [
    { path: 'tagline', type: 'text' },
];

export const SocialProofBandModuleSpec: ModuleSpec<SocialProofBandProps> = {
    meta:          SocialProofBandMeta,
    propsSchema:   SocialProofBandPropsSchema,
    defaults:      SocialProofBandDefaults,
    contentFields: SocialProofBandContentFields,
};
