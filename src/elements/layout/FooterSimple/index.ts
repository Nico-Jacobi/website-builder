import FooterSimple from './FooterSimple';
import { FooterSimplePropsSchema, FooterSimpleDefaults, FooterSimpleMeta } from './FooterSimple.schema';
import type { FooterSimpleProps } from './FooterSimple.schema';
import type { ModuleDefinition } from '../../../builder/types';

export const FooterSimpleModule: ModuleDefinition<FooterSimpleProps> = {
    meta:        FooterSimpleMeta,
    propsSchema: FooterSimplePropsSchema,
    defaults:    FooterSimpleDefaults,
    Component:   FooterSimple,
};

export { default as FooterSimple } from './FooterSimple';
export type { FooterSimpleProps } from './FooterSimple.schema';
