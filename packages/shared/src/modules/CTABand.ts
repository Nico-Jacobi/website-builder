import { z } from 'zod';
import type { ModuleMeta, ContentField } from '../types';
import type { ModuleSpec } from './index';

export const CTABandPropsSchema = z.object({
    /** Großer Haupt-Call-to-Action-Text. */
    heading: z.string(),

    /** Optionaler erläuternder Untertext unter der Überschrift. */
    subheading: z.string().optional(),

    /** Label des primären CTA-Buttons. */
    ctaLabel: z.string(),

    /** URL des primären CTA-Buttons. */
    ctaHref: z.string(),

    /** Label des optionalen Ghost-Buttons (sekundäre Aktion). */
    ctaSecondaryLabel: z.string().optional(),

    /** URL des optionalen Ghost-Buttons. */
    ctaSecondaryHref: z.string().optional(),

    /**
     * Visueller Stil des Bandes (Default: 'gradient'):
     * - 'gradient': Hintergrund via --gradient_hero, heller Text
     * - 'surface': Heller/neutraler Hintergrund via --surface, normaler Text
     * - 'primary': Vollfarbiger Hintergrund via --primary, heller Text
     */
    style: z.enum(['gradient', 'surface', 'primary']).optional(),
});
export type CTABandProps = z.infer<typeof CTABandPropsSchema>;

export const CTABandDefaults: CTABandProps = {
    heading:           'Start building today',
    subheading:        'Join thousands of teams already using our platform.',
    ctaLabel:          'Get started for free',
    ctaHref:           '#signup',
    ctaSecondaryLabel: 'View documentation',
    ctaSecondaryHref:  '#docs',
    style:             'gradient',
};

export const CTABandMeta: ModuleMeta = {
    name:        'CTABand',
    category:    'content',
    description: 'Fetter, vollbreiter Call-to-Action-Streifen mit Heading, Subtext und zwei Buttons. Drei Stil-Varianten: gradient, surface, primary. Typisch vor dem Footer.',
    tags:        ['cta', 'call-to-action', 'conversion', 'button', 'banner', 'marketing', 'footer-cta'],
};

export const CTABandContentFields: ContentField[] = [
    { path: 'heading',           type: 'text' },
    { path: 'subheading',        type: 'text' },
    { path: 'ctaLabel',          type: 'text' },
    { path: 'ctaHref',           type: 'url'  },
    { path: 'ctaSecondaryLabel', type: 'text' },
    { path: 'ctaSecondaryHref',  type: 'url'  },
];

export const CTABandModuleSpec: ModuleSpec<CTABandProps> = {
    meta:          CTABandMeta,
    propsSchema:   CTABandPropsSchema,
    defaults:      CTABandDefaults,
    contentFields: CTABandContentFields,
};
