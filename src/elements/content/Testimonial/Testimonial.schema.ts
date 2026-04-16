import { z } from 'zod';
import type { ModuleMeta } from '../../../builder/types';

export const TestimonialPropsSchema = z.object({
    /** URL to the author's avatar image. Displayed as a circle. */
    image: z.string().url(),

    /** The testimonial or review quote. */
    quote: z.string(),

    /** Author's name. */
    author: z.string(),

    /** Optional: Author's title or position (e.g. "CEO", "Product Manager"). */
    title: z.string().optional(),
});

export type TestimonialProps = z.infer<typeof TestimonialPropsSchema>;

export const TestimonialDefaults: TestimonialProps = {
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    quote: 'Dieses Tool hat unseren Workflow komplett transformiert. Einfach unglaublich.',
    author: 'Anja Müller',
    title: 'Projektmanagerin',
};

export const TestimonialMeta: ModuleMeta = {
    name: 'Testimonial',
    category: 'content',
    description: 'Customer testimonial or review with avatar, quote, author name, and optional title.',
    tags: ['testimonial', 'review', 'quote', 'feedback', 'social-proof'],
};
