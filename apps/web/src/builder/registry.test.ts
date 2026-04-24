import { describe, expect, it } from 'vitest';
import { listModules, getModule } from './registry';

describe('registry', () => {
    const modules = listModules();

    it('is non-empty', () => {
        expect(modules.length).toBeGreaterThan(0);
    });

    it.each(modules.map((m) => [m.meta.name, m] as const))(
        '%s: defaults parse against propsSchema',
        (_name, module) => {
            const result = module.propsSchema.safeParse(module.defaults);
            if (!result.success) {
                throw new Error(
                    `${module.meta.name}.defaults failed schema validation:\n` +
                        JSON.stringify(result.error.issues, null, 2),
                );
            }
            expect(result.success).toBe(true);
        },
    );

    it.each(modules.map((m) => [m.meta.name, m] as const))(
        '%s: meta.name is registered under itself',
        (name, module) => {
            expect(getModule(name)).toBe(module);
        },
    );

    it('has no duplicate meta.name values', () => {
        const names = modules.map((m) => m.meta.name);
        expect(new Set(names).size).toBe(names.length);
    });
});
