import { z } from 'zod';
import type { ModuleMeta, ContentField } from '../types';
import type { ModuleSpec } from './index';
import { LinkSchema } from '../schemas';

export const FooterColumnSchema = z.object({
    heading: z.string().optional(),
    links:   z.array(LinkSchema).min(1),
});
export type FooterColumn = z.infer<typeof FooterColumnSchema>;

export const FooterPropsSchema = z.object({
    tagline:   z.string().optional(),
    copyright: z.string().optional(),
    columns:   z.array(FooterColumnSchema).optional(),
    compact:   z.boolean().optional(),
});

export type FooterProps = z.infer<typeof FooterPropsSchema>;

export const FooterDefaults: FooterProps = {
    tagline:   'Building great things on the web.',
    copyright: `© ${new Date().getFullYear()} My Company`,
    columns:   [],
    compact:   false,
};

export const FooterMeta: ModuleMeta = {
    name:        'Footer',
    category:    'layout',
    description: 'Page footer with optional tagline, copyright notice, and grouped link columns. Set compact: true for a single-row minimal layout (replaces FooterSimple).',
    icon:        'PanelBottom',
    tags:        ['footer', 'links', 'nav', 'layout'],
};

export const FooterContentFields: ContentField[] = [
    { path: 'tagline',                 type: 'text' },
    { path: 'copyright',               type: 'text' },
    { path: 'columns[].heading',       type: 'text' },
    { path: 'columns[].links[].label', type: 'text' },
    { path: 'columns[].links[].href',  type: 'url'  },
];

export const FooterModuleSpec: ModuleSpec<FooterProps> = {
    meta:          FooterMeta,
    propsSchema:   FooterPropsSchema,
    defaults:      FooterDefaults,
    contentFields: FooterContentFields,
};
