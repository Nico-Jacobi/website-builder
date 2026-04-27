import type { SiteChrome } from '@website-builder/shared';

const apiBase: string = (import.meta.env.VITE_API_BASE as string | undefined) ?? 'http://localhost:3001';

export async function putChrome(identifier: string, chrome: SiteChrome): Promise<void> {
    const res = await fetch(`${apiBase}/api/sites/${encodeURIComponent(identifier)}/chrome`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chrome),
    });
    if (!res.ok) throw new Error(`chrome save failed: ${res.status}`);
}
