import { z } from 'zod';
import type { ModuleMeta, ContentField } from '../types';
import type { ModuleSpec } from './index';

export const ComparisonColumnSchema = z.object({
    name:      z.string(),
    highlight: z.boolean().optional(),
});
export type ComparisonColumn = z.infer<typeof ComparisonColumnSchema>;

export const ComparisonRowSchema = z.object({
    label:  z.string(),
    values: z.array(z.union([z.string(), z.boolean()])),
});
export type ComparisonRow = z.infer<typeof ComparisonRowSchema>;

export const ComparisonTablePropsSchema = z.object({
    heading:    z.string().optional(),
    subheading: z.string().optional(),
    columns:    z.array(ComparisonColumnSchema).min(2),
    rows:       z.array(ComparisonRowSchema).min(1),
});

export type ComparisonTableProps = z.infer<typeof ComparisonTablePropsSchema>;

export const ComparisonTableDefaults: ComparisonTableProps = {
    heading:    'Compare plans',
    subheading: 'A side-by-side breakdown of features across plans.',
    columns: [
        { name: 'Starter' },
        { name: 'Pro', highlight: true },
        { name: 'Enterprise' },
    ],
    rows: [
        { label: 'Projects',          values: ['3', 'Unlimited', 'Unlimited'] },
        { label: 'Team members',      values: ['2', '20', 'Unlimited'] },
        { label: 'Custom domains',    values: [false, true, true] },
        { label: 'Priority support',  values: [false, true, true] },
        { label: 'SSO & SAML',        values: [false, false, true] },
        { label: 'Dedicated manager', values: [false, false, true] },
    ],
};

export const ComparisonTableMeta: ModuleMeta = {
    name:        'ComparisonTable',
    category:    'content',
    description: 'A feature-comparison table across 2-5 columns with highlighted column support. Booleans render as check/dash glyphs.',
    icon:        'Table2',
    tags:        ['comparison', 'table', 'pricing', 'features'],
};

export const ComparisonTableContentFields: ContentField[] = [
    { path: 'heading',          type: 'text' },
    { path: 'subheading',       type: 'text' },
    { path: 'columns[].name',   type: 'text' },
    { path: 'rows[].label',     type: 'text' },
];

export const ComparisonTableModuleSpec: ModuleSpec<ComparisonTableProps> = {
    meta:          ComparisonTableMeta,
    propsSchema:   ComparisonTablePropsSchema,
    defaults:      ComparisonTableDefaults,
    contentFields: ComparisonTableContentFields,
};
