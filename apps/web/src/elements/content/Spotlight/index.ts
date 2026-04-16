import Spotlight from './Spotlight';
import { SpotlightPropsSchema, SpotlightDefaults, SpotlightMeta } from './Spotlight.schema';
import type { SpotlightProps } from './Spotlight.schema';
import type { ModuleDefinition } from '../../../builder/types';

export const SpotlightModule: ModuleDefinition<SpotlightProps> = {
    meta:        SpotlightMeta,
    propsSchema: SpotlightPropsSchema,
    defaults:    SpotlightDefaults,
    Component:   Spotlight,
};

export { default as Spotlight } from './Spotlight';
export type { SpotlightProps } from './Spotlight.schema';
