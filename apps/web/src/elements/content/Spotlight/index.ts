import Spotlight from './Spotlight';
import { SpotlightPropsSchema, SpotlightDefaults, SpotlightMeta, SpotlightContentFields } from './Spotlight.schema';
import type { SpotlightProps } from './Spotlight.schema';
import type { ModuleDefinition } from '../../../builder/types';

export const SpotlightModule: ModuleDefinition<SpotlightProps> = {
    meta:        SpotlightMeta,
    propsSchema: SpotlightPropsSchema,
    defaults:    SpotlightDefaults,
    Component:   Spotlight,
    contentFields: SpotlightContentFields,
};

export { default as Spotlight } from './Spotlight';
export type { SpotlightProps } from './Spotlight.schema';
