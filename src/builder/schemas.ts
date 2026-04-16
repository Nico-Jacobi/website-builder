import { z } from 'zod';
import type { Tone } from './types';

/**
 * A single block inside a site spec.
 *
 * `type` must match a ModuleDefinition.meta.name in the registry.
 * `props` is validated against that module's propsSchema at render time
 * (and optionally up-front via validateSpecAgainstRegistry).
 *
 * `id` is optional in authored JSON but filled in by `ensureBlockIds`
 * before rendering, so React keys stay stable across reorder/insert/delete.
 *
 * `tone` is optional. When set, the Renderer wraps this block in a
 * SectionShell that applies the corresponding background and text color.
 * Modules do not receive or read `tone` — it is a layout-layer concern.
 *
 * Recursive: a block's `props` may contain arrays of nested BlockSpecs
 * (e.g. Container.children). The recursion is expressed via `z.lazy`
 * so the type definition is a single source of truth.
 */
export const BlockSpecSchema: z.ZodType<BlockSpec> = z.lazy(() =>
    z.object({
        id:    z.string().optional(),
        type:  z.string(),
        props: z.record(z.string(), z.unknown()),
        tone:  z.enum(['surface', 'muted', 'primary', 'dark', 'accent']).optional(),
    }),
);

export type BlockSpec = {
    id?: string;
    type: string;
    props: Record<string, unknown>;
    tone?: Tone;
};

/**
 * The full description of a website.
 * This is the object a user, editor, or (later) LLM produces and mutates.
 * No code — just data.
 */
export const SiteSpecSchema = z.object({
    /** Optional theme token overrides applied to :root at render time. */
    theme:  z.record(z.string(), z.string()).optional(),
    /** Vertical stack of blocks. Order = render order. */
    blocks: z.array(BlockSpecSchema),
});

export type SiteSpec = z.infer<typeof SiteSpecSchema>;
