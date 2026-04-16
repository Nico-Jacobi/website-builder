import { z } from 'zod';
import type { ModuleMeta } from '../../../builder/types';
import { LinkSchema } from '../../shared/schemas';

export const FooterColumnSchema = z.object({
    heading: z.string().optional(),
    links:   z.array(LinkSchema).min(1),
});
export type FooterColumn = z.infer<typeof FooterColumnSchema>;

export const FooterPropsSchema = z.object({
    tagline:   z.string().optional(),
    copyright: z.string().optional(),
    columns:   z.array(FooterColumnSchema).optional(),
});

export type FooterProps = z.infer<typeof FooterPropsSchema>;

export const FooterDefaults: FooterProps = {
    tagline:   'Building great things on the web.',
    copyright: `© ${new Date().getFullYear()} My Company`,
    columns: [
        {
            heading: 'Product',
            links: [
                { label: 'Features', href: '#features' },
                { label: 'Pricing',  href: '#pricing'  },
            ],
        },
        {
            heading: 'Company',
            links: [
                { label: 'About', href: '#about' },
                { label: 'Blog',  href: '#blog'  },
            ],
        },
    ],
};

export const FooterMeta: ModuleMeta = {
    name:        'Footer',
    category:    'layout',
    description: 'Page footer with optional tagline, copyright notice, and grouped link columns.',
    tags:        ['footer', 'links', 'nav', 'layout'],
};
