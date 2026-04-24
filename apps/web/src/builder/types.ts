import type { ComponentType } from 'react';
import type { ZodType } from 'zod';
import type { ModuleMeta, ContentField } from '@website-builder/shared';

/**
 * A module is a self-contained, parameterized website part.
 * Each folder under src/elements/ produces a registered `ModuleDefinition`.
 *
 * Schema / meta / defaults / contentFields live in `@website-builder/shared`
 * (React-independent). The web side adds the React component on top.
 */
export interface ModuleDefinition<P = unknown> {
    meta: ModuleMeta;
    /** Zod schema — source of truth for the props shape. */
    propsSchema: ZodType<P>;
    /** Starter props so a freshly-inserted block always renders. */
    defaults: P;
    /** The React component to render. */
    Component: ComponentType<P>;
    /**
     * Declares which prop paths are editable content (text, url, image-ref)
     * vs. structural layout/variant fields. Empty by default — the backend
     * treats an unspecified module as "all struct, no content".
     */
    contentFields?: ContentField[];
}
