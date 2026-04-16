import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { SiteSpec } from '@website-builder/shared';
import './SitePreview.css';
import Renderer from '../../builder/Renderer';
import { loadState } from '../../state/specStore';
import { fetchSiteSpec } from '../../data/siteClient';

type Status =
    | { kind: 'loading' }
    | { kind: 'ok'; spec: SiteSpec }
    | { kind: 'empty' }
    | { kind: 'error'; message: string };

export function SitePreview() {
    const [params] = useSearchParams();
    const identifier = params.get('identifier');
    const path = params.get('path') ?? '/';

    const [status, setStatus] = useState<Status>(() => {
        if (identifier) return { kind: 'loading' };
        const local = loadState().spec;
        return local ? { kind: 'ok', spec: local } : { kind: 'empty' };
    });

    useEffect(() => {
        if (!identifier) return;
        let cancelled = false;
        setStatus({ kind: 'loading' });
        fetchSiteSpec(identifier, path)
            .then((spec) => { if (!cancelled) setStatus({ kind: 'ok', spec }); })
            .catch((err: unknown) => {
                if (!cancelled) {
                    setStatus({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
                }
            });
        return () => { cancelled = true; };
    }, [identifier, path]);

    if (status.kind === 'loading') {
        return <div className="site_preview__empty"><p>Lade Website…</p></div>;
    }

    if (status.kind === 'error') {
        return (
            <div className="site_preview__empty">
                <p>Fehler beim Laden: {status.message}</p>
                <Link to="/" className="site_preview__back-link">← Zurück zum Prompt</Link>
            </div>
        );
    }

    if (status.kind === 'empty') {
        return (
            <div className="site_preview__empty">
                <p>Noch keine Website generiert.</p>
                <Link to="/" className="site_preview__back-link">← Zurück zum Prompt</Link>
            </div>
        );
    }

    return (
        <>
            <Link to="/" className="site_preview__back-overlay">← Zurück</Link>
            <Renderer spec={status.spec} />
        </>
    );
}
