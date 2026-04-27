import { useState, useCallback, useEffect } from 'react';
import type { Sitemap, SiteChrome } from '@website-builder/shared';
import type { UseGenerationStreamResult } from './useGenerationStream';
import { fetchSiteGenerationMeta } from './siteClient';

export interface SiteGenerationMeta {
    sitemap: Sitemap | null;
    chrome: SiteChrome | null;
    initialPrompt: string | null;
    pages: Array<{ path: string; status: string; metaDesc?: string }>;
}

export function useSiteMeta(identifier: string, stream: UseGenerationStreamResult): SiteGenerationMeta | null {
    const [meta, setMeta] = useState<SiteGenerationMeta | null>(null);

    const refetch = useCallback(async () => {
        const data = await fetchSiteGenerationMeta(identifier);
        setMeta(data);
    }, [identifier]);

    useEffect(() => { void refetch(); }, [refetch]);

    useEffect(() => stream.subscribe(event => {
        if (event.type === 'landing_done' || event.type === 'subpage_done' || event.type === 'subpage_failed') {
            void refetch();
        }
    }), [stream, refetch]);

    return meta;
}
