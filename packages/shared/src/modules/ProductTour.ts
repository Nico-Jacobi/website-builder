import { z } from 'zod';
import type { ModuleMeta, ContentField } from '../types';
import type { ModuleSpec } from './index';

export const ProductTourTabSchema = z.object({
    label:      z.string(),
    title:      z.string(),
    body:       z.string(),
    imageQuery: z.string().optional(),
    imageSrc:   z.string().optional(),
    imageAlt:   z.string().optional(),
});
export type ProductTourTab = z.infer<typeof ProductTourTabSchema>;

export const ProductTourPropsSchema = z.object({
    heading:    z.string().optional(),
    subheading: z.string().optional(),
    tabs:       z.array(ProductTourTabSchema).min(2),
});

export type ProductTourProps = z.infer<typeof ProductTourPropsSchema>;

export const ProductTourDefaults: ProductTourProps = {
    heading:    'A guided tour of the product',
    subheading: 'Walk through the three pillars that make our customers ship faster.',
    tabs: [
        {
            label: 'Build',
            title: 'Compose with reusable blocks',
            body:  'A modular system that lets you mix and match pre-built blocks, customize them with simple props, and stay in flow.',
            imageQuery: 'product builder editor screenshot',
        },
        {
            label: 'Ship',
            title: 'Deploy in one click',
            body:  'Push to production with a single button — preview environments, custom domains, and instant rollbacks included.',
            imageQuery: 'deployment dashboard product screenshot',
        },
        {
            label: 'Measure',
            title: 'See what is working',
            body:  'Built-in analytics with conversion funnels, A/B tests, and clear charts that focus on the metrics that matter.',
            imageQuery: 'analytics dashboard product screenshot',
        },
    ],
};

export const ProductTourMeta: ModuleMeta = {
    name:        'ProductTour',
    category:    'content',
    description: 'A tabbed product tour: row of tab buttons + active panel showing title, body, and image. Tabs switch on click.',
    icon:        'LayoutTemplate',
    tags:        ['product-tour', 'tabs', 'features', 'demo'],
};

export const ProductTourContentFields: ContentField[] = [];

export const ProductTourModuleSpec: ModuleSpec<ProductTourProps> = {
    meta:          ProductTourMeta,
    propsSchema:   ProductTourPropsSchema,
    defaults:      ProductTourDefaults,
    contentFields: ProductTourContentFields,
};
