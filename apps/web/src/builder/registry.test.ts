import { describe, expect, it } from 'vitest';
import { listModules, getModule, getRegistryLLMSurface } from './registry';

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

describe('getRegistryLLMSurface', () => {
    it('produces one descriptor per registered module', () => {
        const surface = getRegistryLLMSurface();
        expect(surface.modules).toHaveLength(listModules().length);
    });

    it('every descriptor has required fields with correct types', () => {
        const surface = getRegistryLLMSurface();
        for (const descriptor of surface.modules) {
            expect(typeof descriptor.name).toBe('string');
            expect(typeof descriptor.category).toBe('string');
            expect(typeof descriptor.description).toBe('string');
            expect(descriptor.propsJSONSchema).toBeTypeOf('object');
            expect(descriptor.propsJSONSchema).not.toBeNull();
        }
    });

    it('passes through tags when present (e.g. Header)', () => {
        const surface = getRegistryLLMSurface();
        const header = surface.modules.find((m) => m.name === 'Header');
        expect(header).toBeDefined();
        expect(header?.tags).toEqual(
            expect.arrayContaining(['header', 'nav', 'branding']),
        );
    });

    it('siteSpecJSONSchema is a valid JSON Schema object with a blocks field', () => {
        const surface = getRegistryLLMSurface();
        expect(surface.siteSpecJSONSchema).toHaveProperty('type', 'object');
        const properties = (surface.siteSpecJSONSchema as {
            properties?: Record<string, unknown>;
        }).properties;
        expect(properties).toBeDefined();
        expect(properties?.blocks).toBeDefined();
    });

    it("Container's propsJSONSchema references children", () => {
        const surface = getRegistryLLMSurface();
        const container = surface.modules.find((m) => m.name === 'Container');
        expect(container).toBeDefined();
        expect(JSON.stringify(container?.propsJSONSchema)).toContain('children');
    });

    it('is pure — two calls produce structurally identical results', () => {
        expect(getRegistryLLMSurface()).toEqual(getRegistryLLMSurface());
    });
});
