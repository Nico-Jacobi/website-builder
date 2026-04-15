import TextBlock from './TextBlock';
import { TextBlockPropsSchema, TextBlockDefaults, TextBlockMeta } from './TextBlock.schema';
import type { TextBlockProps } from './TextBlock.schema';
import type { ModuleDefinition } from '../../../builder/types';

export const TextBlockModule: ModuleDefinition<TextBlockProps> = {
    meta:        TextBlockMeta,
    propsSchema: TextBlockPropsSchema,
    defaults:    TextBlockDefaults,
    Component:   TextBlock,
};

export { default as TextBlock } from './TextBlock';
export type { TextBlockProps } from './TextBlock.schema';
