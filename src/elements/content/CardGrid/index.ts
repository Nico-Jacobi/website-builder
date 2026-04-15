import CardGrid from './CardGrid';
import { CardGridPropsSchema, CardGridDefaults, CardGridMeta } from './CardGrid.schema';
import type { CardGridProps } from './CardGrid.schema';
import type { ModuleDefinition } from '../../../builder/types';

export const CardGridModule: ModuleDefinition<CardGridProps> = {
    meta:        CardGridMeta,
    propsSchema: CardGridPropsSchema,
    defaults:    CardGridDefaults,
    Component:   CardGrid,
};

export { default as CardGrid } from './CardGrid';
export type { CardGridProps } from './CardGrid.schema';
