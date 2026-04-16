import Footer from './Footer';
import { FooterPropsSchema, FooterDefaults, FooterMeta } from './Footer.schema';
import type { FooterProps } from './Footer.schema';
import type { ModuleDefinition } from '../../../builder/types';

export const FooterModule: ModuleDefinition<FooterProps> = {
    meta:        FooterMeta,
    propsSchema: FooterPropsSchema,
    defaults:    FooterDefaults,
    Component:   Footer,
};

export { default as Footer } from './Footer';
export type { FooterProps } from './Footer.schema';
