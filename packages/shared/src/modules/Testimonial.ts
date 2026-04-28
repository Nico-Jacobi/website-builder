import { z } from 'zod';
import type { ModuleMeta, ContentField } from '../types';
import type { ModuleSpec } from './index';

/** A single testimonial entry. */
export const TestimonialItemSchema = z.object({
    /** The pull-quote text. */
    quote: z.string(),
    /** Full name of the person quoted, e.g. "Jane Doe". */
    author: z.string(),
    /** Job title or role, e.g. "Head of Product". */
    role: z.string().optional(),
    /** Company or organisation, e.g. "Acme Corp". */
    company: z.string().optional(),
    /** Pixabay search query used to fetch the avatar photo. */
    avatarQuery: z.string().optional(),
    /** Resolved avatar photo URL (populated after Pixabay fetch). */
    avatarSrc: z.string().optional(),
});

export type TestimonialItem = z.infer<typeof TestimonialItemSchema>;

export const TestimonialPropsSchema = z.object({
    /** Optional section heading above the testimonial grid. */
    heading: z.string().optional(),
    items: z.array(TestimonialItemSchema).min(1),
    /**
     * Visual layout variant.
     * 'grid'     — responsive CSS grid (default, fully implemented).
     * 'carousel' — horizontal swipe carousel (reserved for future plan).
     */
    layout: z.enum(['grid', 'carousel']).optional().default('grid'),
});

export type TestimonialProps = z.infer<typeof TestimonialPropsSchema>;

export const TestimonialDefaults: TestimonialProps = {
    heading: 'Das sagen unsere Kunden',
    items: [
        {
            quote: 'Ein Zitat oder eine positive Aussage eines Kunden.',
            author: 'Name Eins',
            role: 'Position',
            company: 'Firma',
        },
        {
            quote: 'Ein weiteres Zitat oder eine positive Aussage eines Kunden.',
            author: 'Name Zwei',
            role: 'Position',
            company: 'Firma',
        },
        {
            quote: 'Ein drittes Zitat oder eine positive Aussage eines Kunden.',
            author: 'Name Drei',
            role: 'Position',
            company: 'Firma',
        },
    ],
    layout: 'grid',
};

export const TestimonialMeta: ModuleMeta = {
    name: 'Testimonial',
    category: 'content',
    description:
        'Grid of customer testimonial cards — each with a pull-quote, author name, role, and optional avatar photo. Ideal for social proof sections.',
    icon: 'Quote',
    tags: ['testimonials', 'quotes', 'social-proof', 'reviews', 'customers'],
};

export const TestimonialContentFields: ContentField[] = [
    { path: 'heading',              type: 'text' },
    { path: 'items[].quote',        type: 'text' },
    { path: 'items[].author',       type: 'text' },
    { path: 'items[].role',         type: 'text' },
    { path: 'items[].company',      type: 'text' },
    { path: 'items[].avatarSrc',    type: 'image_ref' },
    { path: 'items[].avatarQuery',  type: 'image_ref' },
];

export const TestimonialModuleSpec: ModuleSpec<TestimonialProps> = {
    meta:          TestimonialMeta,
    propsSchema:   TestimonialPropsSchema,
    defaults:      TestimonialDefaults,
    contentFields: TestimonialContentFields,
};
