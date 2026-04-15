import Callout from './Callout';
import { CalloutPropsSchema, CalloutDefaults, CalloutMeta } from './Callout.schema';
import type { CalloutProps } from './Callout.schema';
import type { ModuleDefinition } from '../../../builder/types';

export const CalloutModule: ModuleDefinition<CalloutProps> = {
    meta:        CalloutMeta,
    propsSchema: CalloutPropsSchema,
    defaults:    CalloutDefaults,
    Component:   Callout,
};

export { default as Callout } from './Callout';
export type { CalloutProps } from './Callout.schema';
