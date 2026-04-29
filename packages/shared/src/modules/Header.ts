import { z } from 'zod';
import type { ModuleMeta, ContentField } from '../types';
import type { ModuleSpec } from './index';
import { LinkSchema } from '../schemas';

export const HeaderPropsSchema = z.object({
    title:    z.string(),
    subtitle: z.string().optional(),
    icon:     z.string().optional(),
    links:    z.array(LinkSchema).optional(),
    /** Optional pill-button CTA label rendered at the end of the nav row. */
    ctaLabel: z.string().optional(),
    /** Optional pill-button CTA target URL. Only rendered when ctaLabel is also set. */
    ctaHref:  z.string().optional(),
    /**
     * Visual variant:
     *  - solid    — taller opaque bar, modern feel (default)
     *  - glass    — sticky glassmorphism with backdrop blur
     *  - floating — centered pill that hovers above page content
     */
    variant:  z.enum(['solid', 'glass', 'floating']).optional(),
});

export type HeaderProps = z.infer<typeof HeaderPropsSchema>;

export const HeaderDefaults: HeaderProps = {
    title:   'Website',
    subtitle: 'Ein kurzer Tagline',
    variant: 'solid',
};

export const HeaderMeta: ModuleMeta = {
    name: 'Header',
    category: 'layout',
    description: 'Page header with brand (title + optional subtitle/icon) and optional navigation links.',
    icon: 'Menu',
    tags: ['header', 'nav', 'branding'],
};

export const HeaderContentFields: ContentField[] = [
    { path: 'title',         type: 'text' },
    { path: 'subtitle',      type: 'text' },
    { path: 'links[].label', type: 'text' },
    { path: 'links[].href',  type: 'url'  },
    { path: 'icon',          type: 'image_ref' },
    { path: 'ctaLabel',      type: 'text' },
    { path: 'ctaHref',       type: 'url'  },
];

export const HeaderModuleSpec: ModuleSpec<HeaderProps> = {
    meta:          HeaderMeta,
    propsSchema:   HeaderPropsSchema,
    defaults:      HeaderDefaults,
    contentFields: HeaderContentFields,
};
