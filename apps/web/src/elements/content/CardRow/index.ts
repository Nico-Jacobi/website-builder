import CardRow from './CardRow';
import { CardRowPropsSchema, CardRowDefaults, CardRowMeta, CardRowContentFields } from './CardRow.schema';
import type { CardRowProps } from './CardRow.schema';
import type { ModuleDefinition } from '../../../builder/types';

export const CardRowModule: ModuleDefinition<CardRowProps> = {
    meta:        CardRowMeta,
    propsSchema: CardRowPropsSchema,
    defaults:    CardRowDefaults,
    Component:   CardRow,
    contentFields: CardRowContentFields,
};

export { default as CardRow } from './CardRow';
export type { CardRowProps } from './CardRow.schema';
