import { db, schema } from '../../db/client';

export interface CreateSiteInput {
    name: string;
}

export interface CreateSiteResult {
    id: string;
    identifier: string;
    name: string;
}

function generateDraftSlug(): string {
    // 6-char slug aus [a-z0-9]
    return Math.random().toString(36).slice(2, 8).padEnd(6, '0');
}

/**
 * Erzeugt einen neuen Site-Draft mit auto-generiertem Identifier
 * (`draft-<slug>`) und einer leeren Default-Page `/`.
 */
export async function createSite(input: CreateSiteInput): Promise<CreateSiteResult> {
    const name = input.name;

    // Try up to a handful of times to avoid slug collisions (extremely unlikely but cheap).
    for (let attempt = 0; attempt < 5; attempt++) {
        const identifier = `draft-${generateDraftSlug()}`;
        const existing = await db.query.sites.findFirst({
            where: (s, { eq }) => eq(s.identifier, identifier),
        });
        if (existing) continue;

        const result = await db.transaction(async (tx) => {
            const [site] = await tx
                .insert(schema.sites)
                .values({ identifier, name, theme: null })
                .returning();
            if (!site) throw new Error('failed to insert site');

            await tx.insert(schema.pages).values({
                siteId:    site.id,
                path:      '/',
                published: false,
            });

            return { id: site.id, identifier: site.identifier, name: site.name };
        });
        return result;
    }

    throw new Error('could not generate unique draft identifier');
}
