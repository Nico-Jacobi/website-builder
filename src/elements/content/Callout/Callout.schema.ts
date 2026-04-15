import { z } from 'zod';
import type { ModuleMeta } from '../../../builder/types';

export const CalloutPropsSchema = z.object({
    /** Emoji or short symbol shown in the tone badge (e.g. '💡', '!'). Omit to hide badge. */
    icon: z.string().optional(),

    /** Optional bold heading rendered above the body text. */
    heading: z.string().optional(),

    /** Main callout text. Required — a callout without body has no content. */
    body: z.string(),

    /**
     * Visual tone — controls the left border colour and icon badge background.
     * Expressed as a data-tone attribute so CSS attribute selectors drive all
     * colour changes without JavaScript logic.
     * info → --primary, success → --alt_primary, warning/danger → --accent.
     */
    tone: z.enum(['info', 'success', 'warning', 'danger']).default('info'),
});

export type CalloutProps = z.infer<typeof CalloutPropsSchema>;

export const CalloutDefaults: CalloutProps = {
    icon: '💡',
    heading: 'Did you know?',
    body: 'This is an informational callout. Replace with your tip, warning, or pull quote.',
    tone: 'info',
};

export const CalloutMeta: ModuleMeta = {
    name: 'Callout',
    category: 'content',
    description: 'Accent-bordered highlight box for tips, warnings, or pull quotes. Tone controls border and badge colour.',
    tags: ['callout', 'tip', 'warning', 'alert', 'highlight', 'quote'],
};
