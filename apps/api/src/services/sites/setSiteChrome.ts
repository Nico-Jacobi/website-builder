import { eq } from 'drizzle-orm';
import type { BlockSpec } from '@website-builder/shared';
import { db, schema } from '../../db/client';

/** Persistiert das Site-Chrome (Header + Footer) für eine Site. */
export async function setSiteChrome(
    identifier: string,
    chrome: { header?: BlockSpec; footer?: BlockSpec },
): Promise<void> {
    await db
        .update(schema.sites)
        .set({ chrome })
        .where(eq(schema.sites.identifier, identifier));
}
