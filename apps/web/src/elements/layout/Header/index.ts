import Header from './Header';
import { HeaderPropsSchema, HeaderDefaults, HeaderMeta, HeaderContentFields } from './Header.schema';
import type { HeaderProps } from './Header.schema';
import type { ModuleDefinition } from '../../../builder/types';

export const HeaderModule: ModuleDefinition<HeaderProps> = {
    meta: HeaderMeta,
    propsSchema: HeaderPropsSchema,
    defaults: HeaderDefaults,
    Component: Header,
    contentFields: HeaderContentFields,
};

export { default as Header } from './Header';
export type { HeaderProps } from './Header.schema';
