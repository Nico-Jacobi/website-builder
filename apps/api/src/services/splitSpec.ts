import { randomUUID } from 'node:crypto';
import type { BlockSpec, SiteSpec } from '@website-builder/shared';
import { moduleContentFields, splitProps } from '@website-builder/shared';

export interface SplitBlockContent {
    fieldPath: string;
    valueType: 'text' | 'rich_text' | 'url' | 'image_ref';
    textValue: string | null;
}

export interface SplitBlock {
    /** Synthetic id used to wire up parent_block_id references during insert. */
    tempId: string;
    parentTempId: string | null;
    position: number;
    type: string;
    tone: string | null;
    structProps: Record<string, unknown>;
    content: SplitBlockContent[];
}

export interface SplitSpec {
    theme: Record<string, string> | null;
    blocks: SplitBlock[];
}

/**
 * Takes a complete SiteSpec and walks it, producing a flat list of blocks
 * with structural props + extracted content items ready to be inserted into
 * `page_blocks` and `block_content`.
 *
 * Nested Container.children are flattened; the tree is rebuilt on read via
 * `parent_block_id` + `position`.
 */
export function splitSpec(spec: SiteSpec): SplitSpec {
    const blocks: SplitBlock[] = [];
    walkBlocks(spec.blocks ?? [], null, blocks);
    return {
        theme: spec.theme ?? null,
        blocks,
    };
}

function walkBlocks(blockSpecs: BlockSpec[], parentTempId: string | null, out: SplitBlock[]): void {
    blockSpecs.forEach((block, position) => {
        const tempId = randomUUID();
        const fields = moduleContentFields[block.type] ?? [];

        // Detach nested children (if any) before splitting props — they're their own rows.
        const props: Record<string, unknown> = { ...(block.props ?? {}) };
        const children = Array.isArray(props['children']) ? (props['children'] as BlockSpec[]) : null;
        if (children) delete props['children'];

        const { struct, content } = splitProps(fields, props);

        out.push({
            tempId,
            parentTempId,
            position,
            type: block.type,
            tone: block.tone ?? null,
            structProps: struct,
            content: content.map((c) => ({
                fieldPath: c.path,
                valueType: c.type,
                textValue: stringifyValue(c.value),
            })),
        });

        if (children && children.length > 0) {
            walkBlocks(children, tempId, out);
        }
    });
}

function stringifyValue(v: unknown): string | null {
    if (v === null || v === undefined) return null;
    if (typeof v === 'string') return v;
    return JSON.stringify(v);
}
