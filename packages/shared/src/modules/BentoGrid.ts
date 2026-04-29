import { z } from 'zod';
import type { ModuleMeta, ContentField } from '../types';
import type { ModuleSpec } from './index';

export const BentoCellSchema = z.object({
    title:      z.string(),
    body:       z.string().optional(),
    imageQuery: z.string().optional(),
    imageSrc:   z.string().optional(),
    imageAlt:   z.string().optional(),
    span:       z.enum(['sm', 'md', 'lg', 'wide', 'tall']).default('md'),
    accent:     z.boolean().optional(),
});
export type BentoCell = z.infer<typeof BentoCellSchema>;

export const BentoGridPropsSchema = z.object({
    heading:    z.string().optional(),
    subheading: z.string().optional(),
    cells:      z.array(BentoCellSchema).min(1),
});

export type BentoGridProps = z.infer<typeof BentoGridPropsSchema>;

export const BentoGridDefaults: BentoGridProps = {
    heading:    'Everything you need',
    subheading: 'A modular system that scales with your team.',
    cells: [
        { title: 'Realtime collaboration', body: 'Edit together, see changes instantly.', span: 'wide', accent: true },
        { title: 'Version history',         body: 'Roll back any change.',                  span: 'md' },
        { title: 'Powerful integrations',   body: 'Slack, Linear, GitHub.',                span: 'md' },
        { title: 'Audit logs',              body: 'Know who did what.',                     span: 'sm' },
        { title: 'SSO & permissions',       body: 'Granular access control.',              span: 'sm' },
        { title: 'Always backed up',        body: 'Daily encrypted snapshots.',            span: 'md' },
    ],
};

export const BentoGridMeta: ModuleMeta = {
    name:        'BentoGrid',
    category:    'content',
    description: 'Irregular grid of varying-size cells highlighting features. Mix small/medium/wide/tall cells for visual rhythm.',
    icon:        'LayoutGrid',
    tags:        ['bento', 'grid', 'features', 'showcase'],
};

export const BentoGridContentFields: ContentField[] = [
    { path: 'heading',           type: 'text' },
    { path: 'subheading',        type: 'text' },
    { path: 'cells[].title',     type: 'text' },
    { path: 'cells[].body',      type: 'rich_text' },
    { path: 'cells[].imageAlt',  type: 'text' },
    { path: 'cells[].imageQuery', type: 'image_ref' },
    { path: 'cells[].imageSrc',  type: 'image_ref' },
];

export const BentoGridModuleSpec: ModuleSpec<BentoGridProps> = {
    meta:          BentoGridMeta,
    propsSchema:   BentoGridPropsSchema,
    defaults:      BentoGridDefaults,
    contentFields: BentoGridContentFields,
};
