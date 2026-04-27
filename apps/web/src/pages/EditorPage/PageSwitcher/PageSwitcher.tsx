import { useState } from 'react';
import './PageSwitcher.css';
import { useActivePagePath, useNavigateToPage } from '../../../builder/usePageNavigation';
import { flushAutoSave } from '../../../data/autoSave';
import { regeneratePage, deletePage } from '../../../data/siteClient';
import type { UseGenerationStreamResult } from '../../../data/useGenerationStream';
import { AddPageDialog } from './AddPageDialog';

export function PageSwitcher({
    identifier,
    stream,
}: {
    identifier: string;
    stream: UseGenerationStreamResult;
}) {
    const { state: { sitemap, pages, isGenerating } } = stream;
    const activePagePath = useActivePagePath();
    const navigateToPage = useNavigateToPage(identifier, 'editor');
    const [showAddDialog, setShowAddDialog] = useState(false);

    const handleSwitch = async (path: string) => {
        if (path === activePagePath) return;
        await flushAutoSave();
        navigateToPage(path);
    };

    const handleRetry = async (path: string) => {
        try { await regeneratePage(identifier, path); } catch { /* SSE shows status */ }
    };

    const handleDelete = async (path: string) => {
        if (!confirm(`Page "${path}" wirklich löschen? Alle Inhalte gehen verloren.`)) return;
        try {
            await deletePage(identifier, path);
            if (path === activePagePath) navigateToPage('/');
        } catch (err) { alert(String(err)); }
    };

    return (
        <aside className="page-switcher">
            <header className="page-switcher__header">
                <span className="page-switcher__label">Pages</span>
                {isGenerating && <span className="page-switcher__spinner" aria-label="generating" />}
            </header>
            <ul className="page-switcher__list">
                {sitemap?.map(entry => {
                    const status = pages.get(entry.path) ?? 'pending';
                    const isActive = entry.path === activePagePath;
                    return (
                        <li
                            key={entry.path}
                            className={`page-row page-row--${status}${isActive ? ' page-row--active' : ''}`}
                        >
                            <button
                                className="page-row__main"
                                onClick={() => void handleSwitch(entry.path)}
                                title={entry.title}
                            >
                                <span className="page-row__path">{entry.path}</span>
                                <span className="page-row__title">{entry.title}</span>
                                <span className={`page-row__status page-row__status--${status}`}>{status}</span>
                            </button>
                            {status === 'failed' && (
                                <button
                                    className="page-row__retry"
                                    onClick={() => void handleRetry(entry.path)}
                                >
                                    Retry
                                </button>
                            )}
                            {entry.path !== '/' && (
                                <button
                                    className="page-row__delete"
                                    aria-label="Remove page"
                                    onClick={() => void handleDelete(entry.path)}
                                >
                                    ×
                                </button>
                            )}
                        </li>
                    );
                })}
                {!sitemap && (
                    <li className="page-switcher__empty">No pages yet</li>
                )}
            </ul>
            <button
                className="page-switcher__add"
                onClick={() => setShowAddDialog(true)}
            >
                + Add Page
            </button>
            {showAddDialog && (
                <AddPageDialog
                    identifier={identifier}
                    sitemap={sitemap ?? []}
                    onClose={() => setShowAddDialog(false)}
                />
            )}
        </aside>
    );
}
