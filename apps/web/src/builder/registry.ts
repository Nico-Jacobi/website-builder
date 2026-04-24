import { sharedModuleRegistry, type ModuleSpec } from '@website-builder/shared';
import type { ModuleDefinition } from './types';
import { componentMap } from './componentMap';

/**
 * The module registry: every website part the builder knows about.
 *
 * Schema + Meta + Defaults + contentFields come from `@website-builder/shared`.
 * The React components live in `./componentMap`. This file composes both
 * into full `ModuleDefinition` objects at runtime.
 *
 * Adding a new module:
 *   1. Create `packages/shared/src/modules/<Name>.ts` with schema + meta +
 *      defaults + contentFields; register it in the shared module registry.
 *   2. Write the React component in `apps/web/src/elements/<cat>/<Name>/<Name>.tsx`.
 *   3. Add the component to `./componentMap` under the same name.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyModule = ModuleDefinition<any>;

function composeModule(spec: ModuleSpec): AnyModule {
    const Component = componentMap[spec.meta.name];
    if (!Component) {
        throw new Error(
            `No React component registered for module "${spec.meta.name}". ` +
                `Add it to apps/web/src/builder/componentMap.ts.`,
        );
    }
    return {
        meta:          spec.meta,
        propsSchema:   spec.propsSchema,
        defaults:      spec.defaults,
        Component,
        ...(spec.contentFields ? { contentFields: spec.contentFields } : {}),
    };
}

const modules: AnyModule[] = Object.values(sharedModuleRegistry).map(composeModule);

export const registry: Record<string, AnyModule> = Object.fromEntries(
    modules.map((m) => [m.meta.name, m]),
);

export function getModule(name: string): AnyModule | undefined {
    return registry[name];
}

export function listModules(): AnyModule[] {
    return modules;
}
