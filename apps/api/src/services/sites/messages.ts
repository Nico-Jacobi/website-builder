import { asc, eq } from 'drizzle-orm';
import { db, schema } from '../../db/client';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface MessageRow {
    id:        string;
    role:      MessageRole;
    content:   string;
    metadata:  Record<string, unknown> | null;
    createdAt: Date;
}

export interface AppendMessageInput {
    role:      MessageRole;
    content:   string;
    metadata?: Record<string, unknown> | null;
}

export async function listMessages(siteId: string): Promise<MessageRow[]> {
    const rows = await db
        .select()
        .from(schema.siteMessages)
        .where(eq(schema.siteMessages.siteId, siteId))
        .orderBy(asc(schema.siteMessages.createdAt));

    return rows.map((r) => ({
        id:        r.id,
        role:      r.role as MessageRole,
        content:   r.content,
        metadata:  r.metadata ?? null,
        createdAt: r.createdAt,
    }));
}

export async function appendMessage(
    siteId: string,
    input: AppendMessageInput,
): Promise<MessageRow> {
    const [row] = await db
        .insert(schema.siteMessages)
        .values({
            siteId,
            role:     input.role,
            content:  input.content,
            metadata: input.metadata ?? null,
        })
        .returning();

    if (!row) throw new Error('failed to insert message');

    return {
        id:        row.id,
        role:      row.role as MessageRole,
        content:   row.content,
        metadata:  row.metadata ?? null,
        createdAt: row.createdAt,
    };
}
