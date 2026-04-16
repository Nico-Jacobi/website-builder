import RecommendationRow from './RecommendationRow';
import {
    RecommendationRowPropsSchema,
    RecommendationRowDefaults,
    RecommendationRowMeta,
    RecommendationRowContentFields,
} from './RecommendationRow.schema';
import type { RecommendationRowProps } from './RecommendationRow.schema';
import type { ModuleDefinition } from '../../../builder/types';

export const RecommendationRowModule: ModuleDefinition<RecommendationRowProps> = {
    meta:        RecommendationRowMeta,
    propsSchema: RecommendationRowPropsSchema,
    defaults:    RecommendationRowDefaults,
    Component:   RecommendationRow,
    contentFields: RecommendationRowContentFields,
};

export { default as RecommendationRow } from './RecommendationRow';
export type { RecommendationRowProps, Recommendation } from './RecommendationRow.schema';
