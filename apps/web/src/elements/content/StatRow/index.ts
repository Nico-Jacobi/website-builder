import StatRow from './StatRow';
import { StatRowPropsSchema, StatRowDefaults, StatRowMeta, StatRowContentFields } from './StatRow.schema';
import type { StatRowProps } from './StatRow.schema';
import type { ModuleDefinition } from '../../../builder/types';

export const StatRowModule: ModuleDefinition<StatRowProps> = {
    meta:        StatRowMeta,
    propsSchema: StatRowPropsSchema,
    defaults:    StatRowDefaults,
    Component:   StatRow,
    contentFields: StatRowContentFields,
};

export { default as StatRow } from './StatRow';
export type { StatRowProps } from './StatRow.schema';
