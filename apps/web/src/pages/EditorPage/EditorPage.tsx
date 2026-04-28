import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import type { SiteSpec, Sitemap } from '@website-builder/shared';
import './EditorPage.css';
import { PreviewSurface } from '../../builder/PreviewSurface';
import { useActivePagePath, useNavigateToPage } from '../../builder/usePageNavigation';
import { EditModeProvider } from '../../builder/EditModeContext';
import { useEditModeActions, useEditModeState } from '../../builder/editModeStore';
import { fetchSiteMeta, fetchSiteGenerationMeta, fetchSiteSpec, renameSite } from '../../data/siteClient';
import { makeAutoSaveAdapter, flushAutoSave } from '../../data/autoSave';
import { makeBlockOpsAdapter } from '../../data/blockOps';
import type { BlockOpsAdapter } from '../../data/blockOps';
import type { AutoSaveAdapter, SaveStatus } from '../../builder/autoSaveTypes';
import { ChatPanel } from './chat/ChatPanel';
import { ModulePalette } from './ModulePalette';
import { EditorDndProvider } from '../../builder/EditorDndProvider';
import { LanguageToggle } from '../../builder/LanguageToggle';
import { useChatHistory } from './chat/useChatHistory';
import { useInlineEditTracker } from './useInlineEditTracker';
import { applyPatchOps } from './applyPatchOps';
import { diffSpecs } from '../../diff/diffSpecs';
import { detectConflicts } from '../../diff/detectConflicts';
import { startGeneration } from '../../llm/generateSpec';
import { useGenerationStream } from '../../data/useGenerationStream';
import { refineSpec } from '../../llm/refineSpec';
import { clearLog } from '../../llm/logger';
import { clearTrace } from '../../llm/llmTrace';
import {
    formatLLMError,
    summarizeApply,
    summarizeGenerationEvent,
    toHistoryEntries,
} from './chatFlow';

type FetchStatus =
    | { kind: 'loading' }
    | { kind: 'ok' }
    | { kind: 'error'; message: string };

export function EditorPage() {
    const { t } = useTranslation();
    const { identifier } = useParams<{ identifier: string }>();
    const activePagePath = useActivePagePath();
    const navigateToPage = useNavigateToPage(identifier ?? '', 'editor');
    const [spec, setSpec] = useState<SiteSpec | null>(null);
    const [siteName, setSiteName] = useState<string>('');
    const [sitemap, setSitemap] = useState<Sitemap | null>(null);
    const [fetchStatus, setFetchStatus] = useState<FetchStatus>({ kind: 'loading' });
    const [chatBusy, setChatBusy] = useState<boolean>(false);
    const inFlightRef = useRef<boolean>(false);
    const durationsRef = useRef<Map<string, { start: number; end?: number }>>(new Map());
    const [specRefreshKey, setSpecRefreshKey] = useState(0);

    // --- Site-Fetch -------------------------------------------------------
    useEffect(() => {
        if (!identifier) return;
        let cancelled = false;
        // Only show the loading spinner on first load (no spec yet).
        if (spec === null) setFetchStatus({ kind: 'loading' });

        void (async () => {
            const [specResult, metaResult] = await Promise.allSettled([
                fetchSiteSpec(identifier, activePagePath),
                fetchSiteMeta(identifier),
            ]);
            if (cancelled) return;

            if (metaResult.status === 'rejected') {
                const err = metaResult.reason;
                setFetchStatus({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
                return;
            }
            setSiteName(metaResult.value.name);

            if (specResult.status === 'rejected') {
                const msg = specResult.reason instanceof Error ? specResult.reason.message : String(specResult.reason);
                // 404 = page not generated yet; show empty canvas and let the SSE stream update us.
                if (msg.includes('site or page not found')) {
                    setSpec((prev) => prev ?? { blocks: [] });
                    setFetchStatus({ kind: 'ok' });
                } else {
                    setFetchStatus({ kind: 'error', message: msg });
                }
            } else {
                setSpec(specResult.value);
                setFetchStatus({ kind: 'ok' });
            }
        })();

        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [identifier, activePagePath, specRefreshKey]);

    // --- Trace/Log-Reset bei Site-Wechsel ---------------------------------
    useEffect(() => {
        clearTrace();
        clearLog();
    }, [identifier]);

    // --- Adapter: autoSave + blockOps -------------------------------------
    // Disposable Ressourcen dürfen NICHT in useMemo leben: React StrictMode
    // simuliert in Dev einen mount/unmount-Zyklus, bei dem die Effect-Cleanup
    // den Adapter disposed, während useMemo denselben Wert wiederverwendet —
    // danach bleibt `disposed = true` hängen und der erste Chat-Turn schlägt
    // mit "blockOps adapter disposed" fehl. useEffect erzeugt den Adapter
    // zusammen mit seiner Cleanup, dann stimmt der Lifecycle wieder.
    const [autoSave, setAutoSave] = useState<AutoSaveAdapter | undefined>(undefined);
    const [blockOps, setBlockOps] = useState<BlockOpsAdapter | undefined>(undefined);

    useEffect(() => {
        if (!identifier) { setAutoSave(undefined); return; }
        const adapter = makeAutoSaveAdapter({ identifier });
        setAutoSave(adapter);
        return () => adapter.dispose();
    }, [identifier]);

    useEffect(() => {
        if (!identifier) { setBlockOps(undefined); return; }
        const adapter = makeBlockOpsAdapter({ identifier, pagePath: activePagePath });
        setBlockOps(adapter);
        return () => adapter.dispose();
    }, [identifier, activePagePath]);

    // --- Page navigation with flush ---------------------------------------
    const handleNavigate = useCallback(async (path: string) => {
        await flushAutoSave();
        navigateToPage(path);
    }, [navigateToPage]);

    // --- Debounced site rename --------------------------------------------
    const renameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const handleNameChange = useCallback((next: string) => {
        setSiteName(next);
        if (!identifier) return;
        if (renameTimer.current) clearTimeout(renameTimer.current);
        renameTimer.current = setTimeout(() => {
            if (next.trim()) void renameSite(identifier, next.trim());
        }, 600);
    }, [identifier]);
    useEffect(() => () => { if (renameTimer.current) clearTimeout(renameTimer.current); }, []);

    // --- Generation stream (SSE) — one connection per editor session -----
    const stream = useGenerationStream(identifier ?? '');

    // --- Chat-History + Inline-Edit-Tracker -------------------------------
    const chat = useChatHistory(identifier ?? '');
    const tracker = useInlineEditTracker();

    // --- Auto-Trigger: Erst-Generation sobald sitemap === null und initialPrompt vorhanden.
    // Basiert auf fetchSiteGenerationMeta (DB-Abfrage) statt spec.blocks.length,
    // da Subpages am Anfang leer sein können (blocks=[] ist kein sicherer Indikator).
    const autoTriggeredRef = useRef<boolean>(false);
    // True from the moment we call startGeneration until the SSE stream confirms
    // landing_started (at which point stream.state.isGenerating takes over).
    const [generationPending, setGenerationPending] = useState(false);

    // Auto-Trigger: Check sitemap directly from DB on mount. If sitemap === null
    // and initialPrompt is set, kick off initial generation via SSE-driven startGeneration.
    // Uses fetchSiteGenerationMeta which includes `sitemap` (unlike fetchSiteMeta).
    useEffect(() => {
        if (!identifier) return;
        if (autoTriggeredRef.current) return;
        let cancelled = false;
        fetchSiteGenerationMeta(identifier)
            .then(meta => {
                if (cancelled) return;
                setSitemap(meta.sitemap);
                if (autoTriggeredRef.current) return;
                if (!meta.initialPrompt) return;
                if (meta.sitemap !== null) return; // already generated
                autoTriggeredRef.current = true;
                setGenerationPending(true);
                void startGeneration(identifier, meta.initialPrompt);
            })
            .catch(() => { /* ignore — main fetch handles the error display */ });
        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [identifier]);

    // --- SSE → Chat-Feed Listener ----------------------------------------
    useEffect(() => {
        return stream.subscribe(event => {
            // Once the stream confirms generation is running, the pending flag is no longer needed.
            if (
                event.type === 'landing_started' ||
                event.type === 'complete' ||
                event.type === 'error' ||
                (event.type === 'snapshot' && event.pages.some(p => p.status === 'generating' || p.status === 'pending'))
            ) {
                setGenerationPending(false);
            }

            // Track durations for timing summaries
            if (event.type === 'landing_started') {
                durationsRef.current.set('/', { start: performance.now() });
            } else if (event.type === 'subpage_started') {
                durationsRef.current.set(event.path, { start: performance.now() });
            } else if (event.type === 'landing_done' || event.type === 'subpage_done') {
                const path = event.type === 'landing_done' ? '/' : event.path;
                const e = durationsRef.current.get(path);
                if (e) {
                    e.end = performance.now();
                }
                // Refresh sitemap and spec after generation completes.
                if (identifier) {
                    void fetchSiteGenerationMeta(identifier).then(meta => setSitemap(meta.sitemap));
                }
                setSpecRefreshKey(k => k + 1);
            } else if (event.type === 'subpage_failed') {
                let e = durationsRef.current.get(event.path);
                if (!e) {
                    e = { start: performance.now() };
                    durationsRef.current.set(event.path, e);
                }
                e.end = performance.now();
            }

            const msg = summarizeGenerationEvent(event, durationsRef.current);
            if (msg) {
                void chat.appendAssistant(msg.content);
            }
        });
    }, [stream.subscribe, chat.appendAssistant, identifier]);

    // --- Chat-Submit: voller LLM-Turn -------------------------------------
    async function handleChatSubmit(userMessage: string): Promise<void> {
        if (!spec || !identifier || !blockOps) return;
        if (inFlightRef.current) return;
        inFlightRef.current = true;

        setChatBusy(true);
        try {
            await chat.appendUser(userMessage);
            tracker.reset();

            const historyEntries = toHistoryEntries(chat.messages);

            const llmResult = await refineSpec({
                siteIdentifier: identifier,
                pagePath:       activePagePath,
                history:        historyEntries,
                userMessage,
            });

            if (llmResult.kind !== 'ok') {
                await chat.appendSystem(formatLLMError(llmResult));
                return;
            }

            const ops = diffSpecs(spec, llmResult.nextSpec);
            if (ops.length === 0) {
                await chat.appendAssistant(llmResult.explanation || 'Keine Änderungen.');
                return;
            }

            const { apply, rejected } = detectConflicts(ops, tracker.snapshot());

            const applyResult = await applyPatchOps({
                ops:         apply,
                currentSpec: spec,
                identifier,
                blockOps,
            });

            setSpec(applyResult.nextSpec);

            const summary = summarizeApply(
                applyResult,
                rejected,
                llmResult.explanation,
                undefined,
                'page',
                activePagePath,
            );
            await chat.appendAssistant(summary.assistant, {
                applied:  applyResult.applied,
                rejected: rejected.length,
            });
            if (rejected.length > 0) {
                await chat.appendSystem(summary.conflictWarning);
            }
        } finally {
            setChatBusy(false);
            inFlightRef.current = false;
        }
    }

    // --- Render-Guards ----------------------------------------------------
    if (!identifier) return <Navigate to="/" replace />;

    if (fetchStatus.kind === 'loading') {
        return (
            <div className="editor_page__fallback">
                <p>{t('editor.loading')}</p>
            </div>
        );
    }

    if (fetchStatus.kind === 'error') {
        return (
            <div className="editor_page__fallback">
                <p>{t('editor.loadError', { message: fetchStatus.message })}</p>
                <Link to="/" className="editor_page__back">
                    <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
                    <span>{t('common.backLabel')}</span>
                </Link>
            </div>
        );
    }

    if (!spec) return null;

    const chatStatus = chatBusy ? 'sending' : chat.status;

    // Show loading overlay while landing page is not yet ready.
    // generationPending covers the gap between startGeneration() and the first SSE event.
    const landingStatus = stream.state.pages.get('/');
    const showLoadingOverlay =
        (generationPending || (stream.state.isGenerating && landingStatus !== 'ready')) &&
        (!spec || spec.blocks.length === 0);

    return (
        <EditModeProvider
            spec={spec}
            onSpecChange={setSpec}
            autoSave={autoSave}
            initialEditMode={true}
            onInlineEdit={tracker.markEdited}
            activePagePath={activePagePath}
            identifier={identifier}
        >
            <div className="editor_page">
                <EditorHeader
                    name={siteName}
                    onNameChange={handleNameChange}
                    identifier={identifier}
                    autoSave={autoSave}
                    blockOps={blockOps}
                />
                <div className="editor_page__body">
                    <EditorDndProvider>
                        <aside className="editor_page__chat_slot">
                            <ChatPanel
                                messages={chat.messages}
                                status={chatStatus}
                                onSubmit={handleChatSubmit}
                            />
                        </aside>
                        <main className="editor_page__preview">
                            {showLoadingOverlay ? (
                                <div className="editor_page__preview-loading">
                                    <Loader2
                                        className="editor_page__preview-loading-spinner"
                                        size={40}
                                        strokeWidth={1.75}
                                        aria-hidden="true"
                                    />
                                    <p className="editor_page__preview-loading-text">
                                        {t('editor.generatingLabel')}
                                    </p>
                                </div>
                            ) : (
                                <div className="editor_page__preview-frame">
                                    <EditorPreview
                                        spec={spec}
                                        sitemap={sitemap}
                                        onNavigate={handleNavigate}
                                    />
                                </div>
                            )}
                        </main>
                        <ModulePalette />
                    </EditorDndProvider>
                </div>
            </div>
        </EditModeProvider>
    );
}

// --- Subcomponents --------------------------------------------------------

/**
 * Thin wrapper that reads `isEditMode` from EditModeContext (must be rendered
 * inside an EditModeProvider) and forwards it to PreviewSurface.
 */
function EditorPreview({
    spec,
    sitemap,
    onNavigate,
}: {
    spec: SiteSpec;
    sitemap: Sitemap | null;
    onNavigate: (path: string) => void;
}) {
    const { isEditMode } = useEditModeState();
    return (
        <PreviewSurface
            spec={spec}
            sitemap={sitemap ?? undefined}
            editMode={isEditMode}
            onNavigate={onNavigate}
        />
    );
}

interface EditorHeaderProps {
    name:         string;
    onNameChange: (next: string) => void;
    identifier:   string;
    autoSave:     AutoSaveAdapter | undefined;
    blockOps:     BlockOpsAdapter | undefined;
}

function EditorHeader({ name, onNameChange, identifier, autoSave, blockOps }: EditorHeaderProps) {
    const { t } = useTranslation();
    const status = useCombinedSaveStatus(autoSave, blockOps);
    const previewHref = `/site/${encodeURIComponent(identifier)}`;

    return (
        <header className="editor_page__header">
            <div className="editor_page__title-row">
                <Link to="/" className="editor_page__back">
                    <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
                    <span>{t('common.backLabel')}</span>
                </Link>
                <input
                    type="text"
                    className="editor_page__name-input"
                    value={name}
                    onChange={(e) => onNameChange(e.target.value)}
                    placeholder={t('editor.header.siteNamePlaceholder')}
                    aria-label={t('editor.header.siteNameAriaLabel')}
                />
            </div>
            <div className="editor_page__header-actions">
                <SaveStatusIndicator status={status} />
                <LanguageToggle />
                <EditModeToggle />
                <a
                    href={previewHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="editor_page__preview-link"
                >
                    <span>{t('editor.header.openInNewTabLabel')}</span>
                    <ExternalLink size={14} strokeWidth={1.75} aria-hidden="true" />
                </a>
            </div>
        </header>
    );
}

function EditModeToggle() {
    const { t } = useTranslation();
    const { isEditMode } = useEditModeState();
    const { setIsEditMode } = useEditModeActions();

    return (
        <div
            className="editor_page__mode-toggle"
            role="group"
            aria-label={t('editor.modeToggle.ariaLabel')}
        >
            <button
                type="button"
                className={`editor_page__mode-btn${isEditMode ? ' editor_page__mode-btn--active' : ''}`}
                aria-pressed={isEditMode}
                onClick={() => setIsEditMode(true)}
            >
                {t('editor.modeToggle.editLabel')}
            </button>
            <button
                type="button"
                className={`editor_page__mode-btn${!isEditMode ? ' editor_page__mode-btn--active' : ''}`}
                aria-pressed={!isEditMode}
                onClick={() => setIsEditMode(false)}
            >
                {t('editor.modeToggle.previewLabel')}
            </button>
        </div>
    );
}

/**
 * Kombiniert die `SaveStatus` beider Adapter:
 *   - irgendeiner 'error'  → 'error'
 *   - irgendeiner 'saving' → 'saving'
 *   - irgendeiner 'saved'  → 'saved'
 *   - sonst                → 'idle'
 */
function useCombinedSaveStatus(
    autoSave: AutoSaveAdapter | undefined,
    blockOps: BlockOpsAdapter | undefined,
): SaveStatus {
    const [a, setA] = useState<SaveStatus>(() => autoSave?.getStatus() ?? 'idle');
    const [b, setB] = useState<SaveStatus>(() => blockOps?.getStatus() ?? 'idle');

    useEffect(() => {
        if (!autoSave) { setA('idle'); return; }
        setA(autoSave.getStatus());
        return autoSave.subscribe(setA);
    }, [autoSave]);

    useEffect(() => {
        if (!blockOps) { setB('idle'); return; }
        setB(blockOps.getStatus());
        return blockOps.subscribe(setB);
    }, [blockOps]);

    if (a === 'error'  || b === 'error')  return 'error';
    if (a === 'saving' || b === 'saving') return 'saving';
    if (a === 'saved'  || b === 'saved')  return 'saved';
    return 'idle';
}

function SaveStatusIndicator({ status }: { status: SaveStatus }) {
    const label = labelForStatus(status);
    return (
        <div
            className={`editor_page__status editor_page__status--${status}`}
            role="status"
            aria-live="polite"
        >
            <span className="editor_page__status-dot" aria-hidden="true" />
            <span className="editor_page__status-label">{label}</span>
        </div>
    );
}

function labelForStatus(status: SaveStatus): string {
    switch (status) {
        case 'saving': return 'Speichern…';
        case 'saved':  return 'Gespeichert';
        case 'error':  return 'Fehler beim Speichern';
        case 'idle':
        default:       return 'Bereit';
    }
}
