import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import type { SiteSpec } from '@website-builder/shared';
import './EditorPage.css';
import Renderer from '../../builder/Renderer';
import { EditModeProvider } from '../../builder/EditModeContext';
import { fetchSiteMeta, fetchSiteSpec } from '../../data/siteClient';
import { makeAutoSaveAdapter } from '../../data/autoSave';
import { makeBlockOpsAdapter } from '../../data/blockOps';
import type { BlockOpsAdapter } from '../../data/blockOps';
import type { AutoSaveAdapter, SaveStatus } from '../../builder/autoSaveTypes';
import { ChatPanel } from './chat/ChatPanel';
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
    const [fetchStatus, setFetchStatus] = useState<FetchStatus>({ kind: 'loading' });
    const [chatBusy, setChatBusy] = useState<boolean>(false);

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
    const autoSave = useMemo<AutoSaveAdapter | undefined>(
        () => (identifier ? makeAutoSaveAdapter({ identifier }) : undefined),
        [identifier],
    );

    const blockOps = useMemo<BlockOpsAdapter | undefined>(
        () => (identifier ? makeBlockOpsAdapter({ identifier }) : undefined),
        [identifier],
    );

    useEffect(() => {
        return () => {
            (autoSave as unknown as { dispose?: () => void })?.dispose?.();
        };
    }, [autoSave]);

    useEffect(() => {
        return () => blockOps?.dispose();
    }, [blockOps]);

    // --- Chat-History + Inline-Edit-Tracker -------------------------------
    const chat = useChatHistory(identifier ?? '');
    const tracker = useInlineEditTracker();

    // --- Chat-Submit: voller LLM-Turn -------------------------------------
    async function handleChatSubmit(userMessage: string): Promise<void> {
        if (!spec || !identifier || !blockOps) return;

        setChatBusy(true);
        try {
            await chat.appendUser(userMessage);
            tracker.reset();

            const isInitial = spec.blocks.length === 0;
            const historyEntries = toHistoryEntries(chat.messages);

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

            const summary = summarizeApply(applyResult, rejected, llmResult.explanation);
            await chat.appendAssistant(summary.assistant, {
                applied:  applyResult.applied,
                rejected: rejected.length,
            });
            if (rejected.length > 0) {
                await chat.appendSystem(summary.conflictWarning);
            }
        } finally {
            setChatBusy(false);
        }
    }

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
                <Link to="/" className="editor_page__back">← Zurück zur Übersicht</Link>
            </div>
        );
    }

    if (!spec) return null;

    const chatStatus = chatBusy ? 'sending' : chat.status;

    return (
        <div className="editor_page">
            <EditorHeader
                name={siteName}
                onNameChange={setSiteName}
                autoSave={autoSave}
                blockOps={blockOps}
            />
            <div className="editor_page__body">
                <aside className="editor_page__chat_slot">
                    <ChatPanel
                        messages={chat.messages}
                        status={chatStatus}
                        onSubmit={handleChatSubmit}
                        onRetry={chat.retry}
                    />
                </aside>
                <main className="editor_page__preview">
                    <EditModeProvider
                        spec={spec}
                        onSpecChange={setSpec}
                        autoSave={autoSave}
                        initialEditMode={true}
                        onInlineEdit={tracker.markEdited}
                    >
                        <Renderer spec={spec} />
                    </EditModeProvider>
                </main>
            </div>
        </div>
    );
}

// --- Subcomponents --------------------------------------------------------

interface EditorHeaderProps {
    name:         string;
    onNameChange: (next: string) => void;
    autoSave:     AutoSaveAdapter | undefined;
    blockOps:     BlockOpsAdapter | undefined;
}

function EditorHeader({ name, onNameChange, autoSave, blockOps }: EditorHeaderProps) {
    const status = useCombinedSaveStatus(autoSave, blockOps);

    return (
        <header className="editor_page__header">
            <div className="editor_page__title-row">
                <Link to="/" className="editor_page__back">← Zurück</Link>
                <input
                    type="text"
                    className="editor_page__name-input"
                    value={name}
                    onChange={(e) => onNameChange(e.target.value)}
                    placeholder="Site-Name"
                    aria-label="Site-Name"
                />
            </div>
            <SaveStatusIndicator status={status} />
        </header>
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
