import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { RotateCw, Trash2, Pencil, Loader2 } from 'lucide-react';
import { listSites, deleteSite, type SiteListItem } from '../../data/siteClient';

export function SitesList() {
    const { t } = useTranslation();
    const [sites, setSites] = useState<SiteListItem[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

    async function load() {
        setError(null);
        try {
            setSites(await listSites());
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    }

    useEffect(() => { void load(); }, []);

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
    );
}
