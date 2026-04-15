import type { ComponentType } from 'react';
import Container from './Container';
import { ContainerPropsSchema, ContainerDefaults, ContainerMeta } from './Container.schema';
import type { ContainerProps } from './Container.schema';
import type { ModuleDefinition } from '../../../builder/types';

export const ContainerModule: ModuleDefinition<ContainerProps> = {
    meta:        ContainerMeta,
    propsSchema: ContainerPropsSchema,
    defaults:    ContainerDefaults,
    // Cast required: Renderer materializes children (BlockSpec[] → ReactNode) before
    // calling the component. The component types reflect runtime reality; the schema
    // types reflect what the spec JSON contains. They diverge by design.
    Component:   Container as ComponentType<ContainerProps>,
};

export { default as Container } from './Container';
export type { ContainerProps } from './Container.schema';
