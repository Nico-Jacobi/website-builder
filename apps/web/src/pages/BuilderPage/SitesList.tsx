import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listSites, deleteSite, type SiteListItem } from '../../data/siteClient';

export function SitesList() {
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
        if (!confirm(`Site „${identifier}" wirklich löschen?`)) return;
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
                <span className="sites_list__title">Gespeicherte Sites</span>
                <button className="sites_list__refresh" onClick={load}>↺ Aktualisieren</button>
            </div>
            {error && <p className="sites_list__error">{error}</p>}
            {sites === null && !error && <p className="sites_list__empty">Lädt…</p>}
            {sites !== null && sites.length === 0 && (
                <p className="sites_list__empty">Noch keine gespeicherte Seite.</p>
            )}
            {sites !== null && sites.length > 0 && (
                <table className="sites_list__table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Identifier</th>
                            <th>Erstellt</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {sites.map((s) => (
                            <tr key={s.id}>
                                <td>{s.name}</td>
                                <td><code>{s.identifier}</code></td>
                                <td>{new Date(s.createdAt).toLocaleDateString('de-DE')}</td>
                                <td className="sites_list__actions">
                                    <Link
                                        to={`/editor/${encodeURIComponent(s.identifier)}`}
                                        className="sites_list__btn sites_list__btn--open"
                                    >
                                        Bearbeiten
                                    </Link>
                                    <button
                                        className="sites_list__btn sites_list__btn--delete"
                                        onClick={() => onDelete(s.identifier)}
                                        disabled={deleting === s.identifier}
                                    >
                                        {deleting === s.identifier ? '…' : 'Löschen'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </section>
    );
}
