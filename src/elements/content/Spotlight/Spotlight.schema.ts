import { z } from 'zod';
import type { ModuleMeta } from '../../../builder/types';

export const SpotlightPropsSchema = z.object({
    /** URL to the photo — a portrait of the person, team, or a representative image. */
    image: z.string().url(),

    /** Alt text for the image. Falls back to the title if omitted. */
    imageAlt: z.string().optional(),

    /** Small label above the title (e.g. "Über uns", "Unser Gründer", "Das Team"). */
    eyebrow: z.string().optional(),

    /** Main heading — a person's name, team label, or topic title. */
    title: z.string(),

    /** Body text — the statement, description, or introduction. */
    body: z.string(),

    /** Optional signature line (e.g. "— Max Müller, Inhaber"). */
    caption: z.string().optional(),

    /** Side the image appears on. */
    imagePosition: z.enum(['left', 'right']).default('left'),
});

export type SpotlightProps = z.infer<typeof SpotlightPropsSchema>;

export const SpotlightDefaults: SpotlightProps = {
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=900&fit=crop',
    eyebrow: 'Unser Gründer',
    title: 'Handwerk seit 1987',
    body: 'Wir glauben an den ruhigen, sorgfältigen Ton eines Ortes, an dem die Dinge mit Bedacht entstehen — jeden Tag aufs Neue, mit den gleichen Händen und denselben Überzeugungen.',
    caption: '— Max Müller, Inhaber',
    imagePosition: 'left',
};

export const SpotlightMeta: ModuleMeta = {
    name: 'Spotlight',
    category: 'content',
    description: 'A spotlight block introducing a person, team, or topic. Photo beside a short statement with optional eyebrow label and signature caption. Suitable for "about us", founder introductions, or team highlights.',
    tags: ['about', 'owner', 'team', 'introduction', 'spotlight', 'profile', 'statement'],
};
