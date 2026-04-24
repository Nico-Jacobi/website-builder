import { z } from 'zod';
import type { ModuleMeta, ContentField } from '../types';
import type { ModuleSpec } from './index';

/** A single review entry: who said it, how many stars, and the excerpt. */
export const RecommendationSchema = z.object({
    /** Reviewer's name — a person, customer, or publication (e.g. "Süddeutsche Zeitung"). */
    name: z.string(),

    /** Optional short attribution line (e.g. "Verified customer", "Feuilleton"). */
    source: z.string().optional(),

    /** Optional avatar photo or publication logo URL. */
    image: z.string().optional(),
    imageAlt: z.string().optional(),

    /** Rating from 0 to 5. Half stars supported (e.g. 4.5). */
    rating: z.number().min(0).max(5),

    /** Short excerpt from the review. */
    quote: z.string(),
});

export type Recommendation = z.infer<typeof RecommendationSchema>;

export const RecommendationRowPropsSchema = z.object({
    /** Optional section heading rendered above the row. */
    heading: z.string().optional(),

    items: z.array(RecommendationSchema).min(1),
});

export type RecommendationRowProps = z.infer<typeof RecommendationRowPropsSchema>;

export const RecommendationRowDefaults: RecommendationRowProps = {
    heading: 'Was andere sagen',
    items: [
        {
            name: 'Süddeutsche Zeitung',
            source: 'Feuilleton',
            rating: 4.5,
            quote: 'Ein erfrischender Ansatz, der in der Praxis überraschend gut funktioniert.',
        },
        {
            name: 'Anja Müller',
            source: 'Projektmanagerin',
            rating: 5,
            quote: 'Unser Workflow wurde komplett transformiert — einfach großartig.',
        },
        {
            name: 'techradar.de',
            source: 'Redaktionelle Empfehlung',
            rating: 4,
            quote: 'Solide Umsetzung mit klarem Fokus auf das Wesentliche.',
        },
    ],
};

export const RecommendationRowMeta: ModuleMeta = {
    name: 'RecommendationRow',
    category: 'content',
    description: 'Horizontal scrollable row of short reviews from customers or publications — each with name, source, star rating, and quote excerpt.',
    tags: ['reviews', 'ratings', 'press', 'social-proof', 'recommendations', 'testimonials'],
};

export const RecommendationRowContentFields: ContentField[] = [
    { path: 'heading',          type: 'text' },
    { path: 'items[].name',     type: 'text' },
    { path: 'items[].source',   type: 'text' },
    { path: 'items[].quote',    type: 'text' },
    { path: 'items[].imageAlt', type: 'text' },
    { path: 'items[].image',    type: 'image_ref' },
];

export const RecommendationRowModuleSpec: ModuleSpec<RecommendationRowProps> = {
    meta:          RecommendationRowMeta,
    propsSchema:   RecommendationRowPropsSchema,
    defaults:      RecommendationRowDefaults,
    contentFields: RecommendationRowContentFields,
};
