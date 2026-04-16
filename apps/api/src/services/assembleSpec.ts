import { and, eq, inArray } from 'drizzle-orm';
import type { BlockSpec, SiteSpec, ContentFieldType, Tone } from '@website-builder/shared';
import { mergeProps } from '@website-builder/shared';
import { db, schema } from '../db/client';

/**
 * Loads a site + page from the database and reconstructs the full SiteSpec
 * the client Renderer expects — merging struct_props with block_content
 * (and eventually resolved asset URLs).
 *
 * Returns `null` if the site or page is not found.
 */
export async function assembleSpec(identifier: string, pagePath: string): Promise<SiteSpec | null> {
    const site = await db.query.sites.findFirst({
        where: eq(schema.sites.identifier, identifier),
    });
    if (!site) return null;

    const page = await db.query.pages.findFirst({
        where: and(eq(schema.pages.siteId, site.id), eq(schema.pages.path, pagePath)),
    });
    if (!page) return null;

    const blocks = await db.query.pageBlocks.findMany({
        where: eq(schema.pageBlocks.pageId, page.id),
    });
    if (blocks.length === 0) {
        return { theme: site.theme ?? undefined, blocks: [] };
    }

    const blockIds = blocks.map((b) => b.id);
    const contentRows = await db
        .select()
        .from(schema.blockContent)
        .where(inArray(schema.blockContent.blockId, blockIds));

    // Group content by block.
    const contentByBlock = new Map<string, typeof contentRows>();
    for (const row of contentRows) {
        const list = contentByBlock.get(row.blockId);
        if (list) list.push(row);
        else contentByBlock.set(row.blockId, [row]);
    }

    // Group blocks by parent.
    type BlockRow = typeof blocks[number];
    const childrenByParent = new Map<string | null, BlockRow[]>();
    for (const b of blocks) {
        const key = b.parentBlockId ?? null;
        const list = childrenByParent.get(key);
        if (list) list.push(b);
        else childrenByParent.set(key, [b]);
    }
    for (const list of childrenByParent.values()) {
        list.sort((a, b) => a.position - b.position);
    }

    const buildBlock = (row: BlockRow): BlockSpec => {
        const items = (contentByBlock.get(row.id) ?? []).map((c) => ({
            path: c.fieldPath,
            type: c.valueType as ContentFieldType,
            value: parseStoredValue(c.valueType, c.textValue),
        }));
        const props: Record<string, unknown> = mergeProps(row.structProps, items);

        const children = childrenByParent.get(row.id);
        if (children && children.length > 0) {
            props['children'] = children.map(buildBlock);
        }

        return {
            id: row.id,
            type: row.type,
            props,
            tone: (row.tone as Tone | null) ?? undefined,
        };
    };

    const rootBlocks = (childrenByParent.get(null) ?? []).map(buildBlock);

    return {
        theme: site.theme ?? undefined,
        blocks: rootBlocks,
    };
}

function parseStoredValue(valueType: string, textValue: string | null): unknown {
    if (textValue === null) return null;
    // All current content types are stored as plain strings.
    if (
        valueType === 'text' ||
        valueType === 'rich_text' ||
        valueType === 'url' ||
        valueType === 'image_ref'
    ) {
        return textValue;
    }
    try {
        return JSON.parse(textValue);
    } catch {
        return textValue;
    }
}
