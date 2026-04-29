import { z } from 'zod';
import type { ModuleMeta, ContentField } from '../types';
import type { ModuleSpec } from './index';
import { LinkSchema } from '../schemas';

export const ShowcasePropsSchema = z.object({
    heading:    z.string(),
    body:       z.string().optional(),
    imageQuery: z.string().optional(),
    imageSrc:   z.string().optional(),
    imageAlt:   z.string().optional(),
    /** Side the image appears on (large viewports). */
    imagePosition: z.enum(['left', 'right']).default('right'),
    /** Perspective transform applied to the image. */
    perspective: z.enum(['none', 'left', 'right', 'paper', 'paper-left', 'bottom']).default('none'),
    /** Optional radial-gradient backdrop on the section. */
    glow: z.enum(['none', 'primary', 'secondary']).default('none'),
    /** Inner content width modifier. */
    width: z.enum(['normal', 'wide', 'ultrawide']).default('normal'),
    cta: LinkSchema.optional(),
});

export type ShowcaseProps = z.infer<typeof ShowcasePropsSchema>;

export const ShowcaseDefaults: ShowcaseProps = {
    heading:       'Build faster with bold visuals',
    body:          'Pair compelling copy with a striking product shot. Showcase blocks combine narrative with a perspective-rendered image to draw the eye.',
    imageQuery:    'modern saas product dashboard screenshot',
    imageAlt:      'Product preview',
    imagePosition: 'right',
    perspective:   'right',
    glow:          'primary',
    width:         'wide',
    cta:           { label: 'Learn more', href: '#' },
};

export const ShowcaseMeta: ModuleMeta = {
    name:        'Showcase',
    category:    'content',
    description: 'Product showcase: heading + body + striking image with optional perspective transform, glow backdrop, and CTA. Use for hero feature highlights.',
    icon:        'LayoutPanelLeft',
    tags:        ['feature', 'product', 'hero', 'showcase', 'perspective', 'image'],
};

export const ShowcaseContentFields: ContentField[] = [
    { path: 'heading',    type: 'text' },
    { path: 'body',       type: 'rich_text' },
    { path: 'imageAlt',   type: 'text' },
    { path: 'imageQuery', type: 'image_ref' },
    { path: 'imageSrc',   type: 'image_ref' },
    { path: 'cta.label',  type: 'text' },
    { path: 'cta.href',   type: 'url' },
];

export const ShowcaseModuleSpec: ModuleSpec<ShowcaseProps> = {
    meta:          ShowcaseMeta,
    propsSchema:   ShowcasePropsSchema,
    defaults:      ShowcaseDefaults,
    contentFields: ShowcaseContentFields,
};
