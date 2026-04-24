import { eq } from 'drizzle-orm';
import { db, schema } from '../../db/client';

export interface UpdateThemeInput {
    identifier: string;
    theme:      Record<string, string> | null;
}

export type UpdateThemeError = { kind: 'site_not_found' };

export class UpdateThemeFailure extends Error {
    constructor(public readonly detail: UpdateThemeError) {
        super(detail.kind);
    }
}

/**
 * Replaces a site's theme (CSS-variable overrides applied at :root).
 * Passing `null` clears the theme back to the design-token defaults.
 */
export async function updateTheme(input: UpdateThemeInput): Promise<void> {
    const site = await db.query.sites.findFirst({
        where: eq(schema.sites.identifier, input.identifier),
    });
    if (!site) throw new UpdateThemeFailure({ kind: 'site_not_found' });

    await db
        .update(schema.sites)
        .set({ theme: input.theme })
        .where(eq(schema.sites.id, site.id));
}
