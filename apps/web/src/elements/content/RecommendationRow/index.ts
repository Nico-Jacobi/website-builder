import RecommendationRow from './RecommendationRow';
import {
    RecommendationRowPropsSchema,
    RecommendationRowDefaults,
    RecommendationRowMeta,
} from './RecommendationRow.schema';
import type { RecommendationRowProps } from './RecommendationRow.schema';
import type { ModuleDefinition } from '../../../builder/types';

export const RecommendationRowModule: ModuleDefinition<RecommendationRowProps> = {
    meta:        RecommendationRowMeta,
    propsSchema: RecommendationRowPropsSchema,
    defaults:    RecommendationRowDefaults,
    Component:   RecommendationRow,
};

export { default as RecommendationRow } from './RecommendationRow';
export type { RecommendationRowProps, Recommendation } from './RecommendationRow.schema';
