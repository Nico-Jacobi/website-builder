import { z } from 'zod';
import type { ModuleMeta, ContentField } from '../types';
import type { ModuleSpec } from './index';

export const DiscountStripPropsSchema = z.object({
    label:         z.string(),
    code:          z.string().optional(),
    expiresLabel:  z.string().optional(),
    animated:      z.boolean().default(true),
    tone:          z.enum(['accent', 'primary', 'dark']).default('accent'),
});

export type DiscountStripProps = z.infer<typeof DiscountStripPropsSchema>;

export const DiscountStripDefaults: DiscountStripProps = {
    label:        '30% OFF — limited time',
    code:         'LAUNCH30',
    expiresLabel: 'Ends Friday',
    animated:     true,
    tone:         'accent',
};

export const DiscountStripMeta: ModuleMeta = {
    name:        'DiscountStrip',
    category:    'content',
    description: 'A bold full-width promo strip with discount label, optional code, expiry, and shimmer animation.',
    icon:        'Percent',
    tags:        ['discount', 'offer', 'banner', 'promo', 'cta'],
};

export const DiscountStripContentFields: ContentField[] = [];

export const DiscountStripModuleSpec: ModuleSpec<DiscountStripProps> = {
    meta:          DiscountStripMeta,
    propsSchema:   DiscountStripPropsSchema,
    defaults:      DiscountStripDefaults,
    contentFields: DiscountStripContentFields,
};
