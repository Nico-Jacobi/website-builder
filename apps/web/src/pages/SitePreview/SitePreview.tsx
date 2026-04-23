import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import type { SiteSpec } from '@website-builder/shared';
import './SitePreview.css';
import Renderer from '../../builder/Renderer';
import { fetchSiteSpec } from '../../data/siteClient';

type FetchStatus =
    | { kind: 'loading' }
    | { kind: 'ok' }
    | { kind: 'error'; message: string };

export function SitePreview() {
    const [params] = useSearchParams();
    const identifier = params.get('identifier');
    const path = params.get('path') ?? '/';

    const [spec, setSpec] = useState<SiteSpec | null>(null);
    const [fetchStatus, setFetchStatus] = useState<FetchStatus>({ kind: 'loading' });

    useEffect(() => {
        if (!identifier) return;
        let cancelled = false;
        setFetchStatus({ kind: 'loading' });
        fetchSiteSpec(identifier, path)
            .then((loaded) => {
                if (!cancelled) {
                    setSpec(loaded);
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
    }, [identifier, path]);

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
        <>
            <Link to="/" className="site_preview__back-overlay">← Zurück</Link>
            <Renderer spec={spec} />
        </>
    );
}
