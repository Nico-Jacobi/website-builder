import { z } from 'zod';
import type { ModuleMeta, ContentField } from '../types';
import type { ModuleSpec } from './index';

export const RatingBadgePropsSchema = z.object({
    rating:      z.number().min(0).max(5),
    reviewCount: z.number().optional(),
    source:      z.string().optional(),
    align:       z.enum(['left', 'center', 'right']).default('center'),
});

export type RatingBadgeProps = z.infer<typeof RatingBadgePropsSchema>;

export const RatingBadgeDefaults: RatingBadgeProps = {
    rating:      4.9,
    reviewCount: 1240,
    source:      'G2',
    align:       'center',
};

export const RatingBadgeMeta: ModuleMeta = {
    name:        'RatingBadge',
    category:    'content',
    description: 'A small rating badge: stars + numeric rating + optional review count + source label.',
    icon:        'Star',
    tags:        ['rating', 'reviews', 'stars', 'social-proof'],
};

export const RatingBadgeContentFields: ContentField[] = [
    { path: 'source', type: 'text' },
];

export const RatingBadgeModuleSpec: ModuleSpec<RatingBadgeProps> = {
    meta:          RatingBadgeMeta,
    propsSchema:   RatingBadgePropsSchema,
    defaults:      RatingBadgeDefaults,
    contentFields: RatingBadgeContentFields,
};
