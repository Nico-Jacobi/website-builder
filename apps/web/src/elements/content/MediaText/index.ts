import MediaText from './MediaText';
import { MediaTextPropsSchema, MediaTextDefaults, MediaTextMeta } from './MediaText.schema';
import type { MediaTextProps } from './MediaText.schema';
import type { ModuleDefinition } from '../../../builder/types';

export const MediaTextModule: ModuleDefinition<MediaTextProps> = {
    meta:        MediaTextMeta,
    propsSchema: MediaTextPropsSchema,
    defaults:    MediaTextDefaults,
    Component:   MediaText,
};

export { default as MediaText } from './MediaText';
export type { MediaTextProps } from './MediaText.schema';
