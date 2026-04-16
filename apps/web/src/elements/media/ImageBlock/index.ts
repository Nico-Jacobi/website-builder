import ImageBlock from './ImageBlock';
import { ImageBlockPropsSchema, ImageBlockDefaults, ImageBlockMeta, ImageBlockContentFields } from './ImageBlock.schema';
import type { ImageBlockProps } from './ImageBlock.schema';
import type { ModuleDefinition } from '../../../builder/types';

export const ImageBlockModule: ModuleDefinition<ImageBlockProps> = {
    meta:        ImageBlockMeta,
    propsSchema: ImageBlockPropsSchema,
    defaults:    ImageBlockDefaults,
    Component:   ImageBlock,
    contentFields: ImageBlockContentFields,
};

export { default as ImageBlock } from './ImageBlock';
export type { ImageBlockProps } from './ImageBlock.schema';
