import { z } from 'zod';
import type { ModuleMeta, ContentField } from '../types';
import type { ModuleSpec } from './index';
import { LinkSchema } from '../schemas';

/** A single pricing tier with feature list and CTA. */
export const PricingTierSchema = z.object({
    name:      z.string(),
    price:     z.string(),
    period:    z.string().optional(),
    featured:  z.boolean().optional(),
    highlight: z.string().optional(),
    features:  z.array(z.string()).min(1),
    cta:       LinkSchema,
});
export type PricingTier = z.infer<typeof PricingTierSchema>;

export const PricingPropsSchema = z.object({
    heading:    z.string().optional(),
    subheading: z.string().optional(),
    tiers:      z.array(PricingTierSchema).min(1),
});

export type PricingProps = z.infer<typeof PricingPropsSchema>;

export const PricingDefaults: PricingProps = {
    heading:    'Simple, transparent pricing',
    subheading: 'Pick a plan that scales with you. Upgrade or cancel anytime.',
    tiers: [
        {
            name:     'Free',
            price:    '$0',
            period:   '/month',
            features: [
                'Up to 3 projects',
                'Community support',
                'Basic analytics',
            ],
            cta: { label: 'Get started', href: '#' },
        },
        {
            name:      'Pro',
            price:     '$29',
            period:    '/month',
            featured:  true,
            highlight: 'Most popular',
            features: [
                'Unlimited projects',
                'Priority support',
                'Advanced analytics',
                'Custom domains',
            ],
            cta: { label: 'Start free trial', href: '#' },
        },
        {
            name:     'Enterprise',
            price:    'Custom',
            features: [
                'Dedicated success manager',
                'SSO & advanced security',
                'SLA guarantee',
                'On-prem deployments',
            ],
            cta: { label: 'Contact sales', href: '#' },
        },
    ],
};

export const PricingMeta: ModuleMeta = {
    name:        'Pricing',
    category:    'content',
    description: 'A grid of pricing tiers with features and CTAs. The featured tier is visually elevated to draw the eye.',
    icon:        'CreditCard',
    tags:        ['pricing', 'plans', 'tiers', 'subscription'],
};

export const PricingContentFields: ContentField[] = [
    { path: 'heading',              type: 'text' },
    { path: 'subheading',           type: 'text' },
    { path: 'tiers[].name',         type: 'text' },
    { path: 'tiers[].price',        type: 'text' },
    { path: 'tiers[].period',       type: 'text' },
    { path: 'tiers[].highlight',    type: 'text' },
    { path: 'tiers[].features[]',   type: 'text' },
    { path: 'tiers[].cta.label',    type: 'text' },
    { path: 'tiers[].cta.href',     type: 'url' },
];

export const PricingModuleSpec: ModuleSpec<PricingProps> = {
    meta:          PricingMeta,
    propsSchema:   PricingPropsSchema,
    defaults:      PricingDefaults,
    contentFields: PricingContentFields,
};
