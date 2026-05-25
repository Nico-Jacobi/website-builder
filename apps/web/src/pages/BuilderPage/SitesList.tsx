import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { RotateCw, Trash2, Pencil, Loader2, Code, Copy, X } from 'lucide-react';
import { listSites, deleteSite, fetchSiteSpec, type SiteListItem } from '../../data/siteClient';
import type { SiteSpec } from '@website-builder/shared';

export function SitesList() {
    const { t } = useTranslation();
    const [sites, setSites] = useState<SiteListItem[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [jsonModal, setJsonModal] = useState<{ spec: SiteSpec; siteName: string } | null>(null);
    const [loadingJson, setLoadingJson] = useState<string | null>(null);

    async function load() {
        setError(null);
        try {
            setSites(await listSites());
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    }

    useEffect(() => { void load(); }, []);

    async function onShowJson(s: SiteListItem) {
        setLoadingJson(s.identifier);
        try {
            const spec = await fetchSiteSpec(s.identifier);
            setJsonModal({ spec, siteName: s.name });
        } catch {
            // ignore — user can retry
        } finally {
            setLoadingJson(null);
        }
    }

    async function onDelete(identifier: string) {
        if (!confirm(t('builder.sitesList.confirmDelete', { name: identifier }))) return;
        setDeleting(identifier);
        try {
            await deleteSite(identifier);
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setDeleting(null);
        }
    }

    return (
        <>
        <section className="sites_list">
            <div className="sites_list__head">
                <span className="sites_list__title">{t('builder.sitesList.title')}</span>
                <button className="sites_list__refresh" onClick={load}>
                    <RotateCw size={13} strokeWidth={1.75} aria-hidden="true" />
                    <span>{t('builder.sitesList.refreshLabel')}</span>
                </button>
            </div>
            {error && <p className="sites_list__error">{error}</p>}
            {sites === null && !error && <p className="sites_list__empty">{t('common.loadingLabel')}</p>}
            {sites !== null && sites.length === 0 && (
                <p className="sites_list__empty">{t('builder.sitesList.empty')}</p>
            )}
            {sites !== null && sites.length > 0 && (
                <ul className="sites_list__items">
                    {sites.map((s) => (
                        <li key={s.id} className="sites_list__row">
                            <div className="sites_list__row-main">
                                <span className="sites_list__row-name">{s.name}</span>
                                <code className="sites_list__row-identifier">{s.identifier}</code>
                            </div>
                            <div className="sites_list__row-meta">
                                <span className="sites_list__row-date">
                                    {new Date(s.createdAt).toLocaleDateString('de-DE')}
                                </span>
                            </div>
                            <div className="sites_list__actions">
                                <button
                                    className="sites_list__btn sites_list__btn--json"
                                    onClick={() => onShowJson(s)}
                                    disabled={loadingJson === s.identifier}
                                    aria-label={t('editor.header.viewJsonLabel')}
                                    title={t('editor.header.viewJsonLabel')}
                                >
                                    {loadingJson === s.identifier ? (
                                        <Loader2 className="sites_list__btn-spinner" size={13} strokeWidth={1.75} aria-hidden="true" />
                                    ) : (
                                        <Code size={13} strokeWidth={1.75} aria-hidden="true" />
                                    )}
                                </button>
                                <Link
                                    to={`/editor/${encodeURIComponent(s.identifier)}`}
                                    className="sites_list__btn sites_list__btn--open"
                                    aria-label={t('builder.sitesList.editAriaLabel', { name: s.name })}
                                >
                                    <Pencil size={13} strokeWidth={1.75} aria-hidden="true" />
                                    <span>{t('builder.sitesList.editLabel')}</span>
                                </Link>
                                <button
                                    className="sites_list__btn sites_list__btn--delete"
                                    onClick={() => onDelete(s.identifier)}
                                    disabled={deleting === s.identifier}
                                    aria-label={t('builder.sitesList.deleteAriaLabel', { name: s.name })}
                                >
                                    {deleting === s.identifier ? (
                                        <Loader2
                                            className="sites_list__btn-spinner"
                                            size={13}
                                            strokeWidth={1.75}
                                            aria-hidden="true"
                                        />
                                    ) : (
                                        <Trash2 size={13} strokeWidth={1.75} aria-hidden="true" />
                                    )}
                                    <span>{t('builder.sitesList.deleteLabel')}</span>
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
        {jsonModal && (
            <JsonModal
                spec={jsonModal.spec}
                siteName={jsonModal.siteName}
                onClose={() => setJsonModal(null)}
            />
        )}
        </>
    );
}

function JsonModal({ spec, siteName, onClose }: { spec: SiteSpec; siteName: string; onClose: () => void }) {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);
    const json = JSON.stringify(spec, null, 2);

    function handleCopy() {
        void navigator.clipboard.writeText(json).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    }

    useEffect(() => {
        function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div className="json_modal__backdrop" onClick={onClose}>
            <div
                className="json_modal"
                role="dialog"
                aria-label={t('editor.jsonModal.ariaLabel')}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="json_modal__header">
                    <span className="json_modal__title">{siteName}</span>
                    <div className="json_modal__actions">
                        <button
                            type="button"
                            className="json_modal__action-btn"
                            onClick={handleCopy}
                            title={t('editor.jsonModal.copyLabel')}
                        >
                            <Copy size={14} strokeWidth={1.75} />
                            <span>{copied ? t('editor.jsonModal.copiedLabel') : t('editor.jsonModal.copyLabel')}</span>
                        </button>
                        <button
                            type="button"
                            className="json_modal__close-btn"
                            onClick={onClose}
                            aria-label={t('common.closeAriaLabel')}
                        >
                            <X size={16} strokeWidth={1.75} />
                        </button>
                    </div>
                </div>
                <pre className="json_modal__body">{json}</pre>
            </div>
        </div>
    );
}
