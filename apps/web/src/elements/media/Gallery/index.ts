import Gallery from './Gallery';
import { GalleryPropsSchema, GalleryDefaults, GalleryMeta, GalleryContentFields } from './Gallery.schema';
import type { GalleryProps } from './Gallery.schema';
import type { ModuleDefinition } from '../../../builder/types';

export const GalleryModule: ModuleDefinition<GalleryProps> = {
    meta:        GalleryMeta,
    propsSchema: GalleryPropsSchema,
    defaults:    GalleryDefaults,
    Component:   Gallery,
    contentFields: GalleryContentFields,
};

export { default as Gallery } from './Gallery';
export type { GalleryProps } from './Gallery.schema';
