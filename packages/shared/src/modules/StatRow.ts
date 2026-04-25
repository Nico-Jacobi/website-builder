import { z } from 'zod';
import type { ModuleMeta, ContentField } from '../types';
import type { ModuleSpec } from './index';

/** A single statistic tile. */
export const StatSchema = z.object({
    /** The statistic value displayed large, e.g. '10k+' or '99%'. */
    value:  z.string(),
    /** Short descriptive label below the value, e.g. 'Active Users'. */
    label:  z.string(),
    /** Optional character(s) before the value, e.g. "$" or "~". */
    prefix: z.string().optional(),
    /** Optional character(s) after the value, e.g. "+", "%" or "k". */
    suffix: z.string().optional(),
});
export type Stat = z.infer<typeof StatSchema>;

export const StatRowPropsSchema = z.object({
    /**
     * Array of stat tiles. At least one required.
     * 3–5 tiles is typical for legible marketing layouts.
     */
    stats: z.array(StatSchema).min(1),

    /**
     * Horizontal alignment of the tiles within the row.
     * Drives data-align attribute; CSS handles layout differences.
     */
    align: z.enum(['left', 'center']).default('center'),
});

export type StatRowProps = z.infer<typeof StatRowPropsSchema>;

export const StatRowDefaults: StatRowProps = {
    stats: [
        { value: '10k+', label: 'Active Users'  },
        { value: '99%',  label: 'Uptime'         },
        { value: '4.9★', label: 'Average Rating' },
    ],
    align: 'center',
};

export const StatRowMeta: ModuleMeta = {
    name: 'StatRow',
    category: 'content',
    description: 'Row of large-value statistic tiles with descriptive labels. Common on marketing and landing pages.',
    tags: ['stats', 'metrics', 'numbers', 'marketing', 'kpi'],
};

export const StatRowContentFields: ContentField[] = [
    { path: 'stats[].value',  type: 'text' },
    { path: 'stats[].label',  type: 'text' },
    { path: 'stats[].prefix', type: 'text' },
    { path: 'stats[].suffix', type: 'text' },
];

export const StatRowModuleSpec: ModuleSpec<StatRowProps> = {
    meta:          StatRowMeta,
    propsSchema:   StatRowPropsSchema,
    defaults:      StatRowDefaults,
    contentFields: StatRowContentFields,
};
