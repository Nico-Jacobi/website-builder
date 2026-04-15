import HeroBanner from './HeroBanner';
import { HeroBannerPropsSchema, HeroBannerDefaults, HeroBannerMeta } from './HeroBanner.schema';
import type { HeroBannerProps } from './HeroBanner.schema';
import type { ModuleDefinition } from '../../../builder/types';

export const HeroBannerModule: ModuleDefinition<HeroBannerProps> = {
    meta:        HeroBannerMeta,
    propsSchema: HeroBannerPropsSchema,
    defaults:    HeroBannerDefaults,
    Component:   HeroBanner,
};

export { default as HeroBanner } from './HeroBanner';
export type { HeroBannerProps } from './HeroBanner.schema';
