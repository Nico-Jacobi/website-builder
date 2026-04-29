import { z } from 'zod';
import type { ModuleMeta, ContentField } from '../types';
import type { ModuleSpec } from './index';

export const FAQItemSchema = z.object({
    question: z.string(),
    answer:   z.string(),
});
export type FAQItem = z.infer<typeof FAQItemSchema>;

export const FAQPropsSchema = z.object({
    heading:    z.string().optional(),
    subheading: z.string().optional(),
    items:      z.array(FAQItemSchema).min(1),
    layout:     z.enum(['list', 'accordion']).default('accordion'),
});

export type FAQProps = z.infer<typeof FAQPropsSchema>;

export const FAQDefaults: FAQProps = {
    heading:    'Frequently asked questions',
    subheading: 'Everything you need to know about the product and billing.',
    layout:     'accordion',
    items: [
        {
            question: 'How does the free trial work?',
            answer:   'You get full access to every Pro feature for 14 days, no credit card required. Cancel anytime before the trial ends and you will not be charged.',
        },
        {
            question: 'Can I change plans later?',
            answer:   'Yes — upgrade, downgrade, or switch billing cycles at any time from your account settings. Changes are prorated automatically.',
        },
        {
            question: 'Do you offer refunds?',
            answer:   'We offer a 30-day money-back guarantee on all annual plans. Contact support and we will refund you no questions asked.',
        },
        {
            question: 'Is my data secure?',
            answer:   'All data is encrypted in transit and at rest. We are SOC 2 Type II compliant and run regular third-party security audits.',
        },
        {
            question: 'How do I get support?',
            answer:   'Community support is included on every plan. Pro and Enterprise customers get priority email support with same-day response times.',
        },
    ],
};

export const FAQMeta: ModuleMeta = {
    name:        'FAQ',
    category:    'content',
    description: 'A list of question/answer pairs rendered as a native accordion or a stacked list. Useful for help and support sections.',
    icon:        'HelpCircle',
    tags:        ['faq', 'questions', 'help', 'accordion'],
};

export const FAQContentFields: ContentField[] = [];

export const FAQModuleSpec: ModuleSpec<FAQProps> = {
    meta:          FAQMeta,
    propsSchema:   FAQPropsSchema,
    defaults:      FAQDefaults,
    contentFields: FAQContentFields,
};
