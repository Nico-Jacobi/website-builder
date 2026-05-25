import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();
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
        if (!confirm(t('editor.pageSwitcher.confirmDelete', { name: path }))) return;
        try {
            await deletePage(identifier, path);
            if (path === activePagePath) navigateToPage('/');
        } catch (err) { alert(String(err)); }
    };

    return (
        <aside className="page-switcher">
            <header className="page-switcher__header">
                <span className="page-switcher__label">{t('editor.pageSwitcher.title')}</span>
                {isGenerating && <span className="page-switcher__spinner" aria-label={t('editor.pageSwitcher.generatingAriaLabel')} />}
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
                                <span className={`page-row__status page-row__status--${status}`}>{t(`editor.pageSwitcher.status${status.charAt(0).toUpperCase() + status.slice(1)}`)}</span>
                            </button>
                            {status === 'failed' && (
                                <button
                                    className="page-row__retry"
                                    onClick={() => void handleRetry(entry.path)}
                                >
                                    {t('editor.pageSwitcher.retryLabel')}
                                </button>
                            )}
                            {entry.path !== '/' && (
                                <button
                                    className="page-row__delete"
                                    aria-label={t('editor.pageSwitcher.removePageAriaLabel')}
                                    onClick={() => void handleDelete(entry.path)}
                                >
                                    ×
                                </button>
                            )}
                        </li>
                    );
                })}
                {!sitemap && (
                    <li className="page-switcher__empty">{t('editor.pageSwitcher.noPages')}</li>
                )}
            </ul>
            <button
                className="page-switcher__add"
                onClick={() => setShowAddDialog(true)}
            >
                {t('editor.pageSwitcher.addPageLabel')}
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
