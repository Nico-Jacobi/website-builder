import type { ComponentType } from 'react';
import type { ZodType } from 'zod';

/**
 * Human- and machine-readable description of a module.
 * Used by the registry, future editor UI, and (later) the LLM tool surface.
 */
export interface ModuleMeta {
    /** Unique registry key. Must match the folder name under src/elements/. */
    name: string;
    /** Broad grouping for UI/LLM (e.g. "layout", "content", "media", "form"). */
    category: string;
    /** One sentence: what this module renders and when to use it. */
    description: string;
    /** Free-form search/filter keywords. */
    tags?: string[];
}

/**
 * A module is a self-contained, parameterized website part.
 * Each folder under src/elements/ produces exactly one ModuleDefinition.
 */
export interface ModuleDefinition<P = unknown> {
    meta: ModuleMeta;
    /** Zod schema — source of truth for the props shape. */
    propsSchema: ZodType<P>;
    /** Starter props so a freshly-inserted block always renders. */
    defaults: P;
    /** The React component to render. */
    Component: ComponentType<P>;
}

/**
 * LLM-konsumierbare Beschreibung eines einzelnen Moduls.
 * Wird aus ModuleMeta + z.toJSONSchema(propsSchema) abgeleitet.
 */
export interface ModuleLLMDescriptor {
    name: string;
    category: string;
    description: string;
    tags?: string[];
    /** JSON Schema (Draft 2020-12) derived from module.propsSchema. */
    propsJSONSchema: Record<string, unknown>;
}

/**
 * Aggregat, das ein LLM (oder ein menschlicher API-Konsument) braucht,
 * um valide SiteSpecs zu erzeugen: die Liste aller Module und die
 * Top-Level-Spec-Shape als JSON Schema.
 */
export interface RegistryLLMSurface {
    /** JSON Schema dialect — applies to all schemas in this surface. */
    $schema: string;
    /** Descriptors in registry insertion order. */
    modules: ModuleLLMDescriptor[];
    /** JSON Schema for the full SiteSpec (shape only). */
    siteSpecJSONSchema: Record<string, unknown>;
}

/**
 * Visual tone for a block's SectionShell wrapper.
 * Applied by the Renderer — modules do not read this value directly.
 *
 * surface → white background, dark text
 * muted   → off-white/background-color, dark text  (alternates with surface)
 * primary → --primary background, inverted text
 * dark    → --secondary background, inverted text  (footer, dark CTAs)
 * accent  → --accent background, inverted text     (highlights, callouts)
 */
export type Tone = 'surface' | 'muted' | 'primary' | 'dark' | 'accent';
