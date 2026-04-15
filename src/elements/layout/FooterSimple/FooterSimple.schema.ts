import { z } from 'zod';
import type { ModuleMeta } from '../../../builder/types';
import { LinkSchema } from '../../shared/schemas';

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
