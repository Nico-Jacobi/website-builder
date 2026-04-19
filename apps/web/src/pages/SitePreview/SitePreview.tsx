import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { SiteSpec } from '@website-builder/shared';
import './SitePreview.css';
import Renderer from '../../builder/Renderer';
import { EditModeProvider } from '../../builder/EditModeContext';
import { EditModeToolbar } from '../../builder/EditModeToolbar';
import { loadState } from '../../state/specStore';
import { fetchSiteSpec } from '../../data/siteClient';
import { makeAutoSaveAdapter } from '../../data/autoSave';

type FetchStatus =
    | { kind: 'loading' }
    | { kind: 'ok' }
    | { kind: 'empty' }
    | { kind: 'error'; message: string };

export function SitePreview() {
    const [params] = useSearchParams();
    const identifier = params.get('identifier');
    const path = params.get('path') ?? '/';

    const [spec, setSpec] = useState<SiteSpec | null>(() => {
        if (identifier) return null;
        return loadState().spec ?? null;
    });

    const [fetchStatus, setFetchStatus] = useState<FetchStatus>(() => {
        if (identifier) return { kind: 'loading' };
        return spec ? { kind: 'ok' } : { kind: 'empty' };
    });

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

    const autoSave = useMemo(
        () => identifier ? makeAutoSaveAdapter({ identifier }) : undefined,
        [identifier],
    );

    useEffect(() => {
        return () => autoSave?.dispose();
    }, [autoSave]);

    if (fetchStatus.kind === 'loading') {
        return <div className="site_preview__empty"><p>Lade Website…</p></div>;
    }

    if (fetchStatus.kind === 'error') {
        return (
            <div className="site_preview__empty">
                <p>Fehler beim Laden: {fetchStatus.message}</p>
                <Link to="/" className="site_preview__back-link">← Zurück zum Prompt</Link>
            </div>
        );
    }

    if (fetchStatus.kind === 'empty' || !spec) {
        return (
            <div className="site_preview__empty">
                <p>Noch keine Website generiert.</p>
                <Link to="/" className="site_preview__back-link">← Zurück zum Prompt</Link>
            </div>
        );
    }

    return (
        <EditModeProvider spec={spec} onSpecChange={setSpec} autoSave={autoSave}>
            <Link to="/" className="site_preview__back-overlay">← Zurück</Link>
            <Renderer spec={spec} />
            <EditModeToolbar />
        </EditModeProvider>
    );
}
