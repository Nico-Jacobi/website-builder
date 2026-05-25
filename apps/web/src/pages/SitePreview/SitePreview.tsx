import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import type { SiteSpec, Sitemap } from '@website-builder/shared';
import './SitePreview.css';
import { PreviewSurface } from '../../builder/PreviewSurface';
import { useActivePagePath, useNavigateToPage } from '../../builder/usePageNavigation';
import { fetchSiteSpec, fetchSiteGenerationMeta } from '../../data/siteClient';

type FetchStatus =
    | { kind: 'loading' }
    | { kind: 'ok' }
    | { kind: 'error'; message: string };

export function SitePreview() {
    const { identifier } = useParams<{ identifier: string }>();
    const activePagePath = useActivePagePath();
    const navigateToPage = useNavigateToPage(identifier ?? '', 'site');

    const [spec, setSpec] = useState<SiteSpec | null>(null);
    const [sitemap, setSitemap] = useState<Sitemap | null>(null);
    const [fetchStatus, setFetchStatus] = useState<FetchStatus>({ kind: 'loading' });

    useEffect(() => {
        if (!identifier) return;
        let cancelled = false;
        setFetchStatus({ kind: 'loading' });
        Promise.all([
            fetchSiteSpec(identifier, activePagePath),
            fetchSiteGenerationMeta(identifier),
        ])
            .then(([loadedSpec, meta]) => {
                if (!cancelled) {
                    setSpec(loadedSpec);
                    setSitemap(meta.sitemap);
                    setFetchStatus({ kind: 'ok' });
                }
            })
            .catch((err: unknown) => {
                if (!cancelled) {
                    setFetchStatus({
                        kind: 'error',
                        message: err instanceof Error ? err.message : String(err),
                    });
                }
            });
        return () => { cancelled = true; };
    }, [identifier, activePagePath]);

    if (!identifier) {
        return <Navigate to="/" replace />;
    }

    if (fetchStatus.kind === 'loading') {
        return <div className="site_preview__empty"><p>Lade Website…</p></div>;
    }

    if (fetchStatus.kind === 'error') {
        return (
            <div className="site_preview__empty">
                <p>Fehler beim Laden: {fetchStatus.message}</p>
                <Link to="/" className="site_preview__back-link">← Zurück zur Übersicht</Link>
            </div>
        );
    }

    if (!spec) {
        return (
            <div className="site_preview__empty">
                <p>Keine Daten.</p>
                <Link to="/" className="site_preview__back-link">← Zurück zur Übersicht</Link>
            </div>
        );
    }

    return (
        <div style={{ display: 'contents' }}>
            <Link to="/" className="site_preview__back-overlay">← Zurück</Link>
            <PreviewSurface
                spec={spec}
                sitemap={sitemap ?? undefined}
                editMode={false}
                onNavigate={navigateToPage}
            />
        </div>
    );
}
