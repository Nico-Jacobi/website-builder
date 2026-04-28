import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, 'migrations');

export async function runMigrations(databaseUrl: string): Promise<void> {
    const sql = postgres(databaseUrl);
    try {
        const [{ existed }] = await sql`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_name = '_migrations'
            ) AS existed
        `;

        await sql`
            CREATE TABLE IF NOT EXISTS _migrations (
                name text PRIMARY KEY,
                applied_at timestamptz NOT NULL DEFAULT now()
            )
        `;

        const files = (await readdir(MIGRATIONS_DIR))
            .filter((f) => f.endsWith('.sql'))
            .sort();

        if (!existed) {
            // First run: schema was already applied via drizzle-kit push.
            // Mark all current migration files as done without executing them.
            for (const file of files) {
                await sql`INSERT INTO _migrations (name) VALUES (${file}) ON CONFLICT DO NOTHING`;
            }
            console.log(`migrations bootstrapped: ${files.length} file(s) marked as applied`);
            return;
        }

        for (const file of files) {
            const [{ count }] = await sql`
                SELECT count(*)::int AS count FROM _migrations WHERE name = ${file}
            `;
            if (count > 0) continue;

            const body = await readFile(join(MIGRATIONS_DIR, file), 'utf8');
            await sql.begin(async (tx) => {
                await tx.unsafe(body);
                await tx`INSERT INTO _migrations (name) VALUES (${file})`;
            });
            console.log(`migration applied: ${file}`);
        }
    } finally {
        await sql.end();
    }
}
