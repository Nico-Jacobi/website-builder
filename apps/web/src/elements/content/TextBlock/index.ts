import TextBlock from './TextBlock';
import { TextBlockPropsSchema, TextBlockDefaults, TextBlockMeta, TextBlockContentFields } from './TextBlock.schema';
import type { TextBlockProps } from './TextBlock.schema';
import type { ModuleDefinition } from '../../../builder/types';

export const TextBlockModule: ModuleDefinition<TextBlockProps> = {
    meta:        TextBlockMeta,
    propsSchema: TextBlockPropsSchema,
    defaults:    TextBlockDefaults,
    Component:   TextBlock,
    contentFields: TextBlockContentFields,
};

export { default as TextBlock } from './TextBlock';
export type { TextBlockProps } from './TextBlock.schema';
