import { z } from 'zod';
import type { ModuleMeta, ContentField } from '../types';
import type { ModuleSpec } from './index';
import { LinkSchema } from '../schemas';

export const FooterSimplePropsSchema = z.object({
    tagline:   z.string().optional(),
    copyright: z.string().optional(),
    links:     z.array(LinkSchema).optional(),
});

export type FooterSimpleProps = z.infer<typeof FooterSimplePropsSchema>;

export const FooterSimpleDefaults: FooterSimpleProps = {
    tagline: 'Built with care.',
    copyright: `© ${new Date().getFullYear()} My Company`,
    links: [
        { label: 'Privacy', href: '#privacy' },
        { label: 'Terms',   href: '#terms'   },
        { label: 'Contact', href: '#contact'  },
    ],
};

export const FooterSimpleMeta: ModuleMeta = {
    name: 'FooterSimple',
    category: 'layout',
    description:
        'Minimal single-row footer with tagline and copyright on the left and a flat link list on the right. No link column groups.',
    tags: ['footer', 'links', 'simple', 'minimal', 'layout'],
};

export const FooterSimpleContentFields: ContentField[] = [
    { path: 'tagline',       type: 'text' },
    { path: 'copyright',     type: 'text' },
    { path: 'links[].label', type: 'text' },
    { path: 'links[].href',  type: 'url'  },
];

export const FooterSimpleModuleSpec: ModuleSpec<FooterSimpleProps> = {
    meta:          FooterSimpleMeta,
    propsSchema:   FooterSimplePropsSchema,
    defaults:      FooterSimpleDefaults,
    contentFields: FooterSimpleContentFields,
};
