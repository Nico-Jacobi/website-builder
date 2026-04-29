import { z } from 'zod';
import type { ModuleMeta, ContentField } from '../types';
import type { ModuleSpec } from './index';

export const PillPropsSchema = z.object({
    label:   z.string(),
    variant: z.enum(['accent', 'primary', 'muted', 'outline']).default('accent'),
    align:   z.enum(['left', 'center', 'right']).default('center'),
});

export type PillProps = z.infer<typeof PillPropsSchema>;

export const PillDefaults: PillProps = {
    label:   'New',
    variant: 'accent',
    align:   'center',
};

export const PillMeta: ModuleMeta = {
    name:        'Pill',
    category:    'content',
    description: 'A small inline badge — useful for "New", "v2.0", "Beta" announcements above headings.',
    icon:        'Tag',
    tags:        ['pill', 'badge', 'label', 'announcement'],
};

export const PillContentFields: ContentField[] = [
    { path: 'label', type: 'text' },
];

export const PillModuleSpec: ModuleSpec<PillProps> = {
    meta:          PillMeta,
    propsSchema:   PillPropsSchema,
    defaults:      PillDefaults,
    contentFields: PillContentFields,
};
