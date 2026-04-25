import { z } from 'zod';
import type { ModuleMeta } from '../types';
import type { ModuleSpec } from './index';
import { BlockSpecSchema } from '../schemas';

export const ContainerPropsSchema = z.object({
    children:   z.array(BlockSpecSchema).min(1),
    paddingY:   z.enum(['none', 'sm', 'md', 'lg']).optional(),
    maxWidth:   z.number().optional(),
    scrollable: z.boolean().optional(),
    maxHeight:  z.number().optional(),
});

export type ContainerProps = z.infer<typeof ContainerPropsSchema>;

export const ContainerDefaults: ContainerProps = {
    children:  [{ type: 'TextBlock', props: { body: 'Container content' } }],
    paddingY:  'md',
    scrollable: false,
};

export const ContainerMeta: ModuleMeta = {
    name:        'Container',
    category:    'layout',
    description: 'Wraps one or more blocks in a section with configurable vertical padding, optional max-width, and optional vertical scrolling.',
    icon:        'Box',
    tags:        ['container', 'layout', 'section', 'wrapper'],
};

// Container hat kein `ContentFields` — alle Felder sind strukturell (layout,
// scrollable, maxHeight) bzw. eine `BlockSpec[]`-Kindliste, die der Backend-
// Spec-Split separat behandelt.
export const ContainerModuleSpec: ModuleSpec<ContainerProps> = {
    meta:        ContainerMeta,
    propsSchema: ContainerPropsSchema,
    defaults:    ContainerDefaults,
};
