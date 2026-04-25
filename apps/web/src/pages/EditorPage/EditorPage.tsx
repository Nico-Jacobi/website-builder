import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import type { SiteSpec } from '@website-builder/shared';
import './EditorPage.css';
import Renderer from '../../builder/Renderer';
import { EditModeProvider } from '../../builder/EditModeContext';
import { useEditModeActions, useEditModeState } from '../../builder/editModeStore';
import { fetchSiteMeta, fetchSiteSpec, renameSite } from '../../data/siteClient';
import { makeAutoSaveAdapter } from '../../data/autoSave';
import { makeBlockOpsAdapter } from '../../data/blockOps';
import type { BlockOpsAdapter } from '../../data/blockOps';
import type { AutoSaveAdapter, SaveStatus } from '../../builder/autoSaveTypes';
import { ChatPanel } from './chat/ChatPanel';
import { ModulePalette } from './ModulePalette';
import { useChatHistory } from './chat/useChatHistory';
import { useInlineEditTracker } from './useInlineEditTracker';
import { applyPatchOps } from './applyPatchOps';
import { diffSpecs } from '../../diff/diffSpecs';
import { detectConflicts } from '../../diff/detectConflicts';
import { generateSpec } from '../../llm/generateSpec';
import { refineSpec } from '../../llm/refineSpec';
import { clearLog } from '../../llm/logger';
import { clearTrace } from '../../llm/llmTrace';
import {
    adaptGenerateResult,
    formatLLMError,
    summarizeApply,
    toHistoryEntries,
} from './chatFlow';

type FetchStatus =
    | { kind: 'loading' }
    | { kind: 'ok' }
    | { kind: 'error'; message: string };

export function EditorPage() {
    const { identifier } = useParams<{ identifier: string }>();
    const [spec, setSpec] = useState<SiteSpec | null>(null);
    const [siteName, setSiteName] = useState<string>('');
    const [initialPrompt, setInitialPrompt] = useState<string | null>(null);
    const [fetchStatus, setFetchStatus] = useState<FetchStatus>({ kind: 'loading' });
    const [chatBusy, setChatBusy] = useState<boolean>(false);
    const [autoGenerating, setAutoGenerating] = useState<boolean>(false);
    const inFlightRef = useRef<boolean>(false);
    const autoTriggerRef = useRef<boolean>(false);

    // --- Site-Fetch -------------------------------------------------------
    useEffect(() => {
        if (!identifier) return;
        let cancelled = false;
        setFetchStatus({ kind: 'loading' });

        Promise.all([fetchSiteSpec(identifier), fetchSiteMeta(identifier)])
            .then(([loadedSpec, meta]) => {
                if (cancelled) return;
                setSpec(loadedSpec);
                setSiteName(meta.name);
                setInitialPrompt(meta.initialPrompt);
                setFetchStatus({ kind: 'ok' });
            })
            .catch((err: unknown) => {
                if (cancelled) return;
                setFetchStatus({
                    kind:    'error',
                    message: err instanceof Error ? err.message : String(err),
                });
            });

        return () => {
            cancelled = true;
        };
    }, [identifier]);

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
        const adapter = makeBlockOpsAdapter({ identifier });
        setBlockOps(adapter);
        return () => adapter.dispose();
    }, [identifier]);

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

    // --- Chat-History + Inline-Edit-Tracker -------------------------------
    const chat = useChatHistory(identifier ?? '');
    const tracker = useInlineEditTracker();

    // --- Chat-Submit: voller LLM-Turn -------------------------------------
    async function handleChatSubmit(userMessage: string): Promise<void> {
        if (!spec || !identifier || !blockOps) return;
        if (inFlightRef.current) return;
        inFlightRef.current = true;

        setChatBusy(true);
        try {
            await chat.appendUser(userMessage);
            tracker.reset();

            const isInitial = spec.blocks.length === 0;
            const historyEntries = toHistoryEntries(chat.messages);

            const turnStart = performance.now();
            const llmResult = isInitial
                ? adaptGenerateResult(await generateSpec(userMessage))
                : await refineSpec({
                      currentSpec: spec,
                      history:     historyEntries,
                      userMessage,
                  });

            if (llmResult.kind !== 'ok') {
                await chat.appendSystem(formatLLMError(llmResult));
                return;
            }

            const ops = diffSpecs(spec, llmResult.nextSpec);
            if (ops.length === 0) {
                await chat.appendAssistant(
                    llmResult.explanation || 'Keine Änderungen.',
                );
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
                isInitial ? { durationMs: performance.now() - turnStart } : undefined,
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

    // --- Auto-Trigger: Erst-Generation beim Öffnen einer frisch erstellten Site.
    // Feuert einmal pro Mount (autoTriggerRef), sobald Spec + Meta + BlockOps
    // bereit sind und die Site einen initialPrompt hat. Nach erfolgreichem
    // addBlock setzt das Backend initialPrompt=NULL → Reload triggert nicht mehr.
    useEffect(() => {
        if (fetchStatus.kind !== 'ok') return;
        if (!spec || !identifier || !blockOps) return;
        if (autoTriggerRef.current) return;
        if (spec.blocks.length !== 0) return;
        if (!initialPrompt) return;

        autoTriggerRef.current = true;
        setAutoGenerating(true);
        void handleChatSubmit(initialPrompt).finally(() => {
            setAutoGenerating(false);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchStatus.kind, spec, identifier, blockOps, initialPrompt]);

    // --- Render-Guards ----------------------------------------------------
    if (!identifier) return <Navigate to="/" replace />;

    if (fetchStatus.kind === 'loading') {
        return (
            <div className="editor_page__fallback">
                <p>Lade Editor…</p>
            </div>
        );
    }

    if (fetchStatus.kind === 'error') {
        return (
            <div className="editor_page__fallback">
                <p>Fehler beim Laden: {fetchStatus.message}</p>
                <Link to="/" className="editor_page__back">
                    <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
                    <span>Zurück</span>
                </Link>
            </div>
        );
    }

    if (!spec) return null;

    const chatStatus = chatBusy ? 'sending' : chat.status;

    return (
        <EditModeProvider
            spec={spec}
            onSpecChange={setSpec}
            autoSave={autoSave}
            initialEditMode={true}
            onInlineEdit={tracker.markEdited}
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
                    <aside className="editor_page__chat_slot">
                        <ChatPanel
                            messages={chat.messages}
                            status={chatStatus}
                            onSubmit={handleChatSubmit}
                        />
                    </aside>
                    <main className="editor_page__preview">
                        {autoGenerating && spec.blocks.length === 0 ? (
                            <div className="editor_page__preview-loading">
                                <Loader2
                                    className="editor_page__preview-loading-spinner"
                                    size={40}
                                    strokeWidth={1.75}
                                    aria-hidden="true"
                                />
                                <p className="editor_page__preview-loading-text">
                                    Generiere deine Website… ca. 18s
                                </p>
                            </div>
                        ) : (
                            <div className="editor_page__preview-frame">
                                <Renderer spec={spec} />
                            </div>
                        )}
                    </main>
                    <ModulePalette />
                </div>
            </div>
        </EditModeProvider>
    );
}

// --- Subcomponents --------------------------------------------------------

interface EditorHeaderProps {
    name:         string;
    onNameChange: (next: string) => void;
    identifier:   string;
    autoSave:     AutoSaveAdapter | undefined;
    blockOps:     BlockOpsAdapter | undefined;
}

function EditorHeader({ name, onNameChange, identifier, autoSave, blockOps }: EditorHeaderProps) {
    const status = useCombinedSaveStatus(autoSave, blockOps);
    const previewHref = `/site?identifier=${encodeURIComponent(identifier)}`;

    return (
        <header className="editor_page__header">
            <div className="editor_page__title-row">
                <Link to="/" className="editor_page__back">
                    <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
                    <span>Zurück</span>
                </Link>
                <input
                    type="text"
                    className="editor_page__name-input"
                    value={name}
                    onChange={(e) => onNameChange(e.target.value)}
                    placeholder="Site-Name"
                    aria-label="Site-Name"
                />
            </div>
            <div className="editor_page__header-actions">
                <SaveStatusIndicator status={status} />
                <EditModeToggle />
                <a
                    href={previewHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="editor_page__preview-link"
                >
                    <span>In neuem Tab öffnen</span>
                    <ExternalLink size={14} strokeWidth={1.75} aria-hidden="true" />
                </a>
            </div>
        </header>
    );
}

function EditModeToggle() {
    const { isEditMode } = useEditModeState();
    const { setIsEditMode } = useEditModeActions();

    return (
        <div
            className="editor_page__mode-toggle"
            role="group"
            aria-label="Ansicht umschalten"
        >
            <button
                type="button"
                className={`editor_page__mode-btn${isEditMode ? ' editor_page__mode-btn--active' : ''}`}
                aria-pressed={isEditMode}
                onClick={() => setIsEditMode(true)}
            >
                Bearbeiten
            </button>
            <button
                type="button"
                className={`editor_page__mode-btn${!isEditMode ? ' editor_page__mode-btn--active' : ''}`}
                aria-pressed={!isEditMode}
                onClick={() => setIsEditMode(false)}
            >
                Vorschau
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
