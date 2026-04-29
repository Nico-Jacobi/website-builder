import { z } from 'zod';
import type { ModuleMeta, ContentField } from '../types';
import type { ModuleSpec } from './index';
import { LinkSchema } from '../schemas';

export const HeroPerspectivePropsSchema = z.object({
    headline:    z.string(),
    subheadline: z.string().optional(),
    /** Small badge rendered above the headline (e.g. "New", "v2.0"). */
    pill:        z.string().optional(),
    imageQuery:  z.string().optional(),
    imageSrc:    z.string().optional(),
    imageAlt:    z.string().optional(),
    /** Perspective transform applied to the image. */
    perspective: z.enum(['none', 'left', 'right', 'paper', 'paper-left', 'bottom', 'bottom-lg']).default('bottom'),
    /** Optional radial-gradient backdrop on the section. */
    glow:        z.enum(['none', 'primary', 'secondary']).default('primary'),
    primaryCta:   LinkSchema.optional(),
    secondaryCta: LinkSchema.optional(),
    /** Inner content width modifier. */
    width:       z.enum(['normal', 'wide', 'ultrawide']).default('wide'),
});

export type HeroPerspectiveProps = z.infer<typeof HeroPerspectivePropsSchema>;

export const HeroPerspectiveDefaults: HeroPerspectiveProps = {
    headline:    'Ship beautiful sites at light speed',
    subheadline: 'A modern site builder that pairs a clean visual editor with a robust component system. Launch landing pages, product showcases, and full marketing sites in minutes.',
    pill:        'New — v2.0',
    imageQuery:  'modern saas product dashboard ui screenshot',
    imageAlt:    'Product preview',
    perspective: 'bottom',
    glow:        'primary',
    primaryCta:   { label: 'Get started', href: '#' },
    secondaryCta: { label: 'View demo',   href: '#' },
    width:       'wide',
};

export const HeroPerspectiveMeta: ModuleMeta = {
    name:        'HeroPerspective',
    category:    'layout',
    description: 'Centered hero with optional pill badge, headline, subheadline, dual CTAs, and a perspective-rendered image below. Ideal for SaaS landing pages.',
    icon:        'Sparkles',
    tags:        ['hero', 'landing', 'cta', 'perspective'],
};

export const HeroPerspectiveContentFields: ContentField[] = [
    { path: 'headline',           type: 'text' },
    { path: 'subheadline',        type: 'rich_text' },
    { path: 'pill',               type: 'text' },
    { path: 'imageAlt',           type: 'text' },
    { path: 'imageQuery',         type: 'image_ref' },
    { path: 'imageSrc',           type: 'image_ref' },
    { path: 'primaryCta.label',   type: 'text' },
    { path: 'primaryCta.href',    type: 'url' },
    { path: 'secondaryCta.label', type: 'text' },
    { path: 'secondaryCta.href',  type: 'url' },
];

export const HeroPerspectiveModuleSpec: ModuleSpec<HeroPerspectiveProps> = {
    meta:          HeroPerspectiveMeta,
    propsSchema:   HeroPerspectivePropsSchema,
    defaults:      HeroPerspectiveDefaults,
    contentFields: HeroPerspectiveContentFields,
};
