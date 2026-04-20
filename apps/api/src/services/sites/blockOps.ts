import { and, eq, gt, gte, sql } from 'drizzle-orm';
import type { BlockSpec, Tone } from '@website-builder/shared';
import { moduleContentFields, splitProps } from '@website-builder/shared';
import { db, schema } from '../../db/client';

/**
 * Known `tone` values. Mirror of the enum in `BlockSpecSchema` (schemas.ts).
 */
export const ALLOWED_TONES: readonly Tone[] = [
    'surface',
    'muted',
    'primary',
    'dark',
    'accent',
];

/** Either a top-level db handle or an active transaction — both expose the same
 *  subset of methods we use here. Extracted so we can share helper functions. */
type DbOrTx = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

export interface AddBlockInput {
    identifier: string;
    pagePath?: string;
    parentBlockId?: string | null;
    position: number;
    block: BlockSpec;
}

export interface AddBlockResult {
    id: string;
    position: number;
}

export interface RemoveBlockInput {
    identifier: string;
    blockId: string;
}

export interface MoveBlockInput {
    identifier: string;
    blockId: string;
    newPosition: number;
    newParentBlockId?: string | null;
}

export interface PatchToneInput {
    identifier: string;
    blockId: string;
    tone: Tone | null;
}

export type BlockOpError =
    | { kind: 'site_not_found' }
    | { kind: 'page_not_found' }
    | { kind: 'block_not_found' }
    | { kind: 'block_not_in_site' }
    | { kind: 'parent_not_in_page' }
    | { kind: 'unknown_type'; type: string }
    | { kind: 'invalid_position' };

export class BlockOpFailure extends Error {
    constructor(public readonly detail: BlockOpError) {
        super(detail.kind);
    }
}

function stringifyValue(v: unknown): string | null {
    if (v === null || v === undefined) return null;
    if (typeof v === 'string') return v;
    return JSON.stringify(v);
}

async function findSiteByIdentifier(identifier: string) {
    return db.query.sites.findFirst({
        where: eq(schema.sites.identifier, identifier),
    });
}

async function findPageByPath(siteId: string, path: string) {
    return db.query.pages.findFirst({
        where: and(eq(schema.pages.siteId, siteId), eq(schema.pages.path, path)),
    });
}

type BlockRow = typeof schema.pageBlocks.$inferSelect;
type PageRow = typeof schema.pages.$inferSelect;
type SiteRow = typeof schema.sites.$inferSelect;

type OwnerLookup =
    | { error: BlockOpError; block?: undefined; page?: undefined; site?: undefined }
    | { error?: undefined; block: BlockRow; page: PageRow; site: SiteRow };

async function findBlockOwnedBySite(
    blockId: string,
    identifier: string,
): Promise<OwnerLookup> {
    const block = await db.query.pageBlocks.findFirst({
        where: eq(schema.pageBlocks.id, blockId),
    });
    if (!block) return { error: { kind: 'block_not_found' } };

    const page = await db.query.pages.findFirst({
        where: eq(schema.pages.id, block.pageId),
    });
    if (!page) return { error: { kind: 'page_not_found' } };

    const site = await db.query.sites.findFirst({
        where: and(
            eq(schema.sites.id, page.siteId),
            eq(schema.sites.identifier, identifier),
        ),
    });
    if (!site) return { error: { kind: 'block_not_in_site' } };

    return { block, page, site };
}

/**
 * Shifts positions of all sibling blocks at `>= position` on the given
 * `(pageId, parentBlockId)` level by `+1`, so a new block can be inserted
 * at `position`.
 */
async function makeGapForInsert(
    tx: DbOrTx,
    pageId: string,
    parentBlockId: string | null,
    position: number,
): Promise<void> {
    const parentCond = parentBlockId === null
        ? sql`${schema.pageBlocks.parentBlockId} IS NULL`
        : eq(schema.pageBlocks.parentBlockId, parentBlockId);

    await tx
        .update(schema.pageBlocks)
        .set({ position: sql`${schema.pageBlocks.position} + 1` })
        .where(and(
            eq(schema.pageBlocks.pageId, pageId),
            parentCond,
            gte(schema.pageBlocks.position, position),
        ));
}

/**
 * Re-compacts positions on a given level. Iterates rows, assigns
 * 0..N-1 in the same ordering.
 */
async function compactPositions(
    tx: DbOrTx,
    pageId: string,
    parentBlockId: string | null,
): Promise<void> {
    const parentCond = parentBlockId === null
        ? sql`${schema.pageBlocks.parentBlockId} IS NULL`
        : eq(schema.pageBlocks.parentBlockId, parentBlockId);

    const rows = await tx
        .select({ id: schema.pageBlocks.id, position: schema.pageBlocks.position })
        .from(schema.pageBlocks)
        .where(and(eq(schema.pageBlocks.pageId, pageId), parentCond))
        .orderBy(schema.pageBlocks.position);

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!;
        if (row.position !== i) {
            await tx
                .update(schema.pageBlocks)
                .set({ position: i })
                .where(eq(schema.pageBlocks.id, row.id));
        }
    }
}

async function countSiblings(
    tx: DbOrTx,
    pageId: string,
    parentBlockId: string | null,
): Promise<number> {
    const parentCond = parentBlockId === null
        ? sql`${schema.pageBlocks.parentBlockId} IS NULL`
        : eq(schema.pageBlocks.parentBlockId, parentBlockId);

    const rows = await tx
        .select({ id: schema.pageBlocks.id })
        .from(schema.pageBlocks)
        .where(and(eq(schema.pageBlocks.pageId, pageId), parentCond));
    return rows.length;
}

export async function addBlock(input: AddBlockInput): Promise<AddBlockResult> {
    const { identifier, block } = input;
    const pagePath = input.pagePath ?? '/';
    const parentBlockId = input.parentBlockId ?? null;

    const site = await findSiteByIdentifier(identifier);
    if (!site) throw new BlockOpFailure({ kind: 'site_not_found' });

    const page = await findPageByPath(site.id, pagePath);
    if (!page) throw new BlockOpFailure({ kind: 'page_not_found' });

    if (parentBlockId !== null) {
        const parent = await db.query.pageBlocks.findFirst({
            where: eq(schema.pageBlocks.id, parentBlockId),
        });
        if (!parent || parent.pageId !== page.id) {
            throw new BlockOpFailure({ kind: 'parent_not_in_page' });
        }
    }

    const fields = moduleContentFields[block.type] ?? [];
    if (!moduleContentFields[block.type] && !isKnownContainerlessType(block.type)) {
        throw new BlockOpFailure({ kind: 'unknown_type', type: block.type });
    }

    const props: Record<string, unknown> = { ...(block.props ?? {}) };
    if ('children' in props) delete props['children'];

    const { struct, content } = splitProps(fields, props);

    return db.transaction(async (tx) => {
        const existingCount = await countSiblings(tx, page.id, parentBlockId);
        const position = Math.max(0, Math.min(input.position, existingCount));

        await makeGapForInsert(tx, page.id, parentBlockId, position);

        const [inserted] = await tx
            .insert(schema.pageBlocks)
            .values({
                pageId:        page.id,
                parentBlockId,
                position,
                type:          block.type,
                tone:          block.tone ?? null,
                structProps:   struct,
            })
            .returning({ id: schema.pageBlocks.id });

        if (!inserted) throw new Error('failed to insert block');

        if (content.length > 0) {
            await tx.insert(schema.blockContent).values(
                content.map((c) => ({
                    blockId:   inserted.id,
                    fieldPath: c.path,
                    valueType: c.type,
                    textValue: stringifyValue(c.value),
                })),
            );
        }

        return { id: inserted.id, position };
    });
}

function isKnownContainerlessType(type: string): boolean {
    // Module types without entries in `moduleContentFields` (e.g. Container) are
    // valid as long as the client registry knows them. We can't know the
    // registry on the server, so we accept any non-empty type here.
    return type.trim().length > 0;
}

export async function removeBlock(input: RemoveBlockInput): Promise<void> {
    const { identifier, blockId } = input;

    const lookup = await findBlockOwnedBySite(blockId, identifier);
    if (lookup.error) throw new BlockOpFailure(lookup.error);
    const { block, page } = lookup;

    await db.transaction(async (tx) => {
        await tx.delete(schema.pageBlocks).where(eq(schema.pageBlocks.id, block.id));
        await compactPositions(tx, page.id, block.parentBlockId ?? null);
    });
}

export async function moveBlock(input: MoveBlockInput): Promise<void> {
    const { identifier, blockId, newPosition } = input;

    const lookup = await findBlockOwnedBySite(blockId, identifier);
    if (lookup.error) throw new BlockOpFailure(lookup.error);
    const { block, page } = lookup;

    const oldParent = block.parentBlockId ?? null;
    const newParent = input.newParentBlockId === undefined
        ? oldParent
        : (input.newParentBlockId ?? null);

    if (newParent !== null) {
        const parent = await db.query.pageBlocks.findFirst({
            where: eq(schema.pageBlocks.id, newParent),
        });
        if (!parent || parent.pageId !== page.id) {
            throw new BlockOpFailure({ kind: 'parent_not_in_page' });
        }
        if (newParent === block.id) {
            throw new BlockOpFailure({ kind: 'parent_not_in_page' });
        }
        if (await isDescendantOf(newParent, block.id)) {
            throw new BlockOpFailure({ kind: 'parent_not_in_page' });
        }
    }

    await db.transaction(async (tx) => {
        const oldParentCond = oldParent === null
            ? sql`${schema.pageBlocks.parentBlockId} IS NULL`
            : eq(schema.pageBlocks.parentBlockId, oldParent);

        // Close gap on old level (rows behind the moved block move up by 1).
        await tx
            .update(schema.pageBlocks)
            .set({ position: sql`${schema.pageBlocks.position} - 1` })
            .where(and(
                eq(schema.pageBlocks.pageId, page.id),
                oldParentCond,
                gt(schema.pageBlocks.position, block.position),
            ));

        // Count siblings on new level (the moving block is still in the table,
        // counted if staying on the same level).
        const siblingCount = await countSiblings(tx, page.id, newParent);
        const maxPos = oldParent === newParent
            ? Math.max(0, siblingCount - 1)
            : siblingCount;
        const clamped = Math.max(0, Math.min(newPosition, maxPos));

        const newParentCond = newParent === null
            ? sql`${schema.pageBlocks.parentBlockId} IS NULL`
            : eq(schema.pageBlocks.parentBlockId, newParent);

        // Make room on new level (skipping the moving block).
        await tx
            .update(schema.pageBlocks)
            .set({ position: sql`${schema.pageBlocks.position} + 1` })
            .where(and(
                eq(schema.pageBlocks.pageId, page.id),
                newParentCond,
                gte(schema.pageBlocks.position, clamped),
                sql`${schema.pageBlocks.id} <> ${block.id}`,
            ));

        await tx
            .update(schema.pageBlocks)
            .set({ position: clamped, parentBlockId: newParent })
            .where(eq(schema.pageBlocks.id, block.id));

        if (oldParent !== newParent) {
            await compactPositions(tx, page.id, oldParent);
        }
        await compactPositions(tx, page.id, newParent);
    });
}

async function isDescendantOf(candidateId: string, ancestorId: string): Promise<boolean> {
    let cursorId: string | null = candidateId;
    for (let i = 0; i < 64 && cursorId !== null; i++) {
        if (cursorId === ancestorId) return true;
        const currentId: string = cursorId;
        const row: BlockRow | undefined = await db.query.pageBlocks.findFirst({
            where: eq(schema.pageBlocks.id, currentId),
        });
        if (!row) return false;
        cursorId = row.parentBlockId ?? null;
    }
    return false;
}

export async function patchTone(input: PatchToneInput): Promise<void> {
    const { identifier, blockId, tone } = input;

    const lookup = await findBlockOwnedBySite(blockId, identifier);
    if (lookup.error) throw new BlockOpFailure(lookup.error);

    await db
        .update(schema.pageBlocks)
        .set({ tone })
        .where(eq(schema.pageBlocks.id, blockId));
}
