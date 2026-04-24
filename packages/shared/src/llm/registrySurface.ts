import { z } from 'zod';
import { SiteSpecSchema } from '../schemas';
import { listSharedModules } from '../modules/index';
import type { ModuleLLMDescriptor, RegistryLLMSurface } from '../types';

/**
 * Projects the shared module registry into a shape that an LLM (or any
 * external consumer) can use to produce valid SiteSpecs.
 *
 * One `ModuleLLMDescriptor` per registered module (meta + propsSchema as
 * JSON Schema) plus the full `SiteSpecSchema` as JSON Schema.
 */
function stripSchema(raw: Record<string, unknown>): Record<string, unknown> {
    const { $schema, ...rest } = raw;
    void $schema;
    return rest;
}

export function getRegistryLLMSurface(): RegistryLLMSurface {
    const modules: ModuleLLMDescriptor[] = listSharedModules().map((m) => ({
        name:        m.meta.name,
        category:    m.meta.category,
        description: m.meta.description,
        ...(m.meta.tags ? { tags: m.meta.tags } : {}),
        propsJSONSchema: stripSchema(z.toJSONSchema(m.propsSchema) as Record<string, unknown>),
    }));

    const siteSpec = z.toJSONSchema(SiteSpecSchema) as Record<string, unknown>;

    return {
        $schema: siteSpec['$schema'] as string,
        modules,
        siteSpecJSONSchema: stripSchema(siteSpec),
    };
}
