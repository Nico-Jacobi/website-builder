/**
 * Human- and machine-readable description of a module.
 * Used by the registry, future editor UI, and the LLM tool surface.
 */
export interface ModuleMeta {
    /** Unique registry key. Must match the folder name under elements/. */
    name: string;
    /** Broad grouping (e.g. "layout", "content", "media", "form"). */
    category: string;
    /** One sentence: what this module renders and when to use it. */
    description: string;
    /** Free-form search/filter keywords. */
    tags?: string[];
}

/**
 * LLM-consumable description of one module.
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
 * Aggregate that an LLM (or a human API consumer) needs to produce
 * valid SiteSpecs.
 */
export interface RegistryLLMSurface {
    $schema: string;
    modules: ModuleLLMDescriptor[];
    siteSpecJSONSchema: Record<string, unknown>;
}

/**
 * Visual tone for a block's SectionShell wrapper.
 * Applied by the Renderer — modules do not read this directly.
 */
export type Tone = 'surface' | 'muted' | 'primary' | 'dark' | 'accent';

/**
 * Declares which fields of a module's props are editable content
 * (text / image-ref / url) vs. structural (layout, variants).
 * Used by the backend to split props for storage and to merge them
 * back into a renderable SiteSpec.
 */
export type ContentFieldType = 'text' | 'rich_text' | 'url' | 'image_ref';

export interface ContentField {
    /** Dot/bracket path inside props. Examples: "title", "links[].label", "cards[].imageQuery". */
    path: string;
    type: ContentFieldType;
}
