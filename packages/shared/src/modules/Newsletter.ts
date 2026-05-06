import { z } from 'zod';
import type { ModuleMeta, ContentField } from '../types';
import type { ModuleSpec } from './index';

export const NewsletterPropsSchema = z.object({
    heading:        z.string(),
    body:           z.string().optional(),
    submitUrl:      z.string().optional(),
    placeholder:    z.string().default('you@example.com'),
    buttonLabel:    z.string().default('Subscribe'),
    successMessage: z.string().default('Thanks for subscribing!'),
    width:          z.enum(['narrow', 'normal']).default('narrow'),
});

export type NewsletterProps = z.infer<typeof NewsletterPropsSchema>;

export const NewsletterDefaults: NewsletterProps = {
    heading:        'Subscribe to our newsletter',
    body:           'A short monthly email with product updates, deep dives, and the occasional musing. No spam, ever.',
    placeholder:    'you@example.com',
    buttonLabel:    'Subscribe',
    successMessage: 'Thanks for subscribing — see you in your inbox!',
    width:          'narrow',
};

export const NewsletterMeta: ModuleMeta = {
    name:        'Newsletter',
    category:    'content',
    description: 'A centered newsletter signup with email input, submit button, and success message. Optionally posts to a submitUrl.',
    icon:        'Mail',
    tags:        ['newsletter', 'email', 'signup', 'cta', 'form'],
};

export const NewsletterContentFields: ContentField[] = [
    { path: 'heading',        type: 'text' },
    { path: 'body',           type: 'rich_text' },
    { path: 'buttonLabel',    type: 'text' },
    { path: 'successMessage', type: 'text' },
];

export const NewsletterModuleSpec: ModuleSpec<NewsletterProps> = {
    meta:          NewsletterMeta,
    propsSchema:   NewsletterPropsSchema,
    defaults:      NewsletterDefaults,
    contentFields: NewsletterContentFields,
};
