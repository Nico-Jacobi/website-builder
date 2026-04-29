import { z } from 'zod';
import type { ModuleMeta, ContentField } from '../types';
import type { ModuleSpec } from './index';

export const ProductHuntAwardPropsSchema = z.object({
    rank:        z.enum(['1st', '2nd', '3rd', '4th', '5th']).default('1st'),
    period:      z.enum(['day', 'week', 'month']).default('day'),
    productName: z.string().optional(),
    href:        z.string().optional(),
    size:        z.enum(['small', 'default']).default('default'),
    variant:     z.enum(['color', 'mono']).default('color'),
});

export type ProductHuntAwardProps = z.infer<typeof ProductHuntAwardPropsSchema>;

export const ProductHuntAwardDefaults: ProductHuntAwardProps = {
    rank:        '1st',
    period:      'day',
    productName: 'Acme',
    size:        'default',
    variant:     'color',
};

export const ProductHuntAwardMeta: ModuleMeta = {
    name:        'ProductHuntAward',
    category:    'content',
    description: 'A Product Hunt-style award badge: rank, "Product of the day/week/month", optional product name and link.',
    icon:        'Award',
    tags:        ['award', 'product-hunt', 'badge', 'social-proof'],
};

export const ProductHuntAwardContentFields: ContentField[] = [
    { path: 'productName', type: 'text' },
];

export const ProductHuntAwardModuleSpec: ModuleSpec<ProductHuntAwardProps> = {
    meta:          ProductHuntAwardMeta,
    propsSchema:   ProductHuntAwardPropsSchema,
    defaults:      ProductHuntAwardDefaults,
    contentFields: ProductHuntAwardContentFields,
};
