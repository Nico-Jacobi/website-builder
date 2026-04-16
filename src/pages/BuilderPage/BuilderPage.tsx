import { useSyncExternalStore, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './BuilderPage.css';
import { generateSpec } from '../../llm/generateSpec';
import { loadState, savePrompt, saveSpec } from '../../state/specStore';
import { clearLog, getLogSnapshot, subscribeLog, type LogEntry } from '../../llm/logger';
import type { GenerateResult } from '../../llm/types';
import { listModules, getRegistryLLMSurface } from '../../builder/registry';
import { subscribeTrace, getTrace } from '../../llm/llmTrace';

type UIStatus = 'idle' | 'loading' | 'done';

export function BuilderPage() {
    const [prompt, setPrompt] = useState(() => loadState().prompt);
    const [status, setStatus] = useState<UIStatus>('idle');
    const [result, setResult] = useState<GenerateResult | null>(null);
    const entries = useSyncExternalStore(subscribeLog, getLogSnapshot);

    async function onGenerate() {
        const trimmed = prompt.trim();
        if (!trimmed || status === 'loading') return;

        clearLog();
        setStatus('loading');
        setResult(null);
        const next = await generateSpec(trimmed);
        if (next.kind === 'ok') {
            saveSpec(next.spec);
        }
        setResult(next);
        setStatus('done');
    }

    return (
        <div className="builder_page">
            <h1 className="builder_page__title">Website-Builder</h1>

            <section className="builder_page__input">
                <label className="builder_page__label" htmlFor="builder_prompt">
                    Prompt
                </label>
                <textarea
                    id="builder_prompt"
                    className="builder_page__textarea"
                    placeholder="Hier prompt…"
                    value={prompt}
                    onChange={(e) => {
                        const next = e.target.value;
                        setPrompt(next);
                        savePrompt(next);
                    }}
                    rows={4}
                />
                <button
                    className="builder_page__button"
                    onClick={onGenerate}
                    disabled={status === 'loading' || prompt.trim() === ''}
                >
                    {status === 'loading' ? 'Wird generiert…' : 'Generieren'}
                </button>
            </section>

            <LogWindow entries={entries} status={status} />

            <section className="builder_page__output">
                {status === 'done' && result && <ResultView result={result} />}
            </section>

            <DebugPanel />
        </div>
    );
}

function LogWindow({ entries, status }: { entries: readonly LogEntry[]; status: UIStatus }) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [entries]);

    const t0 = entries[0]?.ts ?? 0;
    const statusLabel =
        status === 'loading' ? 'läuft…' : status === 'done' ? 'fertig' : 'bereit';

    return (
        <section className="log_window">
            <div className="log_window__head">
                <span className="log_window__head-title">Log</span>
                <span className="log_window__status">{statusLabel}</span>
            </div>
            <div className="log_window__body" ref={scrollRef}>
                {entries.length === 0 ? (
                    <div className="log_window__empty">Noch keine Einträge.</div>
                ) : (
                    entries.map((e) => (
                        <div key={e.id} className={`log_line log_line--${e.level}`}>
                            <span className="log_line__ts">
                                +{((e.ts - t0) / 1000).toFixed(2)}s
                            </span>
                            <span className="log_line__lvl">{e.level}</span>
                            <span className="log_line__msg">{e.message}</span>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}

function ResultView({ result }: { result: GenerateResult }) {
    switch (result.kind) {
        case 'ok':
            return (
                <div className="builder_page__success">
                    <p>Website generiert.</p>
                    <Link to="/site" className="builder_page__view-button">
                        Website ansehen
                    </Link>
                </div>
            );
        case 'missing_key':
            return (
                <ErrorPanel
                    title="Kein API-Key konfiguriert"
                    detail="Trage VITE_GOOGLE_API_KEY in deiner .env ein und starte den Dev-Server neu."
                />
            );
        case 'api_error':
            return <ErrorPanel title="API-Fehler" detail={result.message} />;
        case 'invalid_json':
            return (
                <ErrorPanel
                    title="Unerwartete LLM-Antwort"
                    detail={result.message}
                    rawInput={result.rawText}
                />
            );
        case 'validation_failed':
            return (
                <ErrorPanel
                    title="Generierte Spec ist ungültig"
                    detail={formatSpecErrors(result.errors)}
                    rawInput={result.rawInput}
                />
            );
        default: {
            const _exhaustive: never = result;
            return _exhaustive;
        }
    }
}

function ErrorPanel({
    title,
    detail,
    rawInput,
}: {
    title: string;
    detail: string;
    rawInput?: unknown;
}) {
    return (
        <div className="builder_page__error">
            <strong>{title}</strong>
            <pre className="builder_page__error-detail">{detail}</pre>
            {rawInput !== undefined && (
                <details className="builder_page__error-raw">
                    <summary>Raw LLM output</summary>
                    <pre>{JSON.stringify(rawInput, null, 2)}</pre>
                </details>
            )}
        </div>
    );
}

function formatSpecErrors(errors: Array<{ path: string; message: string }>): string {
    return errors.map((e) => `• ${e.path || '(root)'}: ${e.message}`).join('\n');
}

function DebugPanel() {
    const modules = listModules();
    const surface = getRegistryLLMSurface();
    const trace = useSyncExternalStore(subscribeTrace, getTrace);

    return (
        <details className="debug_panel">
            <summary className="debug_panel__toggle">Debug</summary>

            <div className="debug_panel__sections">
                <details className="debug_panel__section">
                    <summary className="debug_panel__summary">
                        listModules() — {modules.length} Module
                    </summary>
                    <div className="debug_panel__body">
                        <table className="debug_table">
                            <thead>
                                <tr>
                                    <th>name</th>
                                    <th>category</th>
                                    <th>description</th>
                                    <th>tags</th>
                                </tr>
                            </thead>
                            <tbody>
                                {modules.map((m) => (
                                    <tr key={m.meta.name}>
                                        <td>{m.meta.name}</td>
                                        <td>{m.meta.category}</td>
                                        <td>{m.meta.description}</td>
                                        <td>{m.meta.tags?.join(', ') ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </details>

                <details className="debug_panel__section">
                    <summary className="debug_panel__summary">
                        getRegistryLLMSurface()
                    </summary>
                    <div className="debug_panel__body">
                        <pre className="debug_panel__pre">
                            {JSON.stringify(surface, null, 2)}
                        </pre>
                    </div>
                </details>

                <details className="debug_panel__section">
                    <summary className="debug_panel__summary">
                        Letzter LLM-Request / Response
                        {trace ? '' : ' — noch kein Request'}
                    </summary>
                    <div className="debug_panel__body">
                        {!trace ? (
                            <p className="debug_panel__empty">Noch kein Request abgesetzt.</p>
                        ) : (
                            <div className="debug_trace">
                                <details className="debug_trace__part" open>
                                    <summary className="debug_trace__label">
                                        User Prompt
                                    </summary>
                                    <pre className="debug_panel__pre debug_panel__pre--prose">{trace.userPrompt}</pre>
                                </details>

                                <details className="debug_trace__part">
                                    <summary className="debug_trace__label">
                                        System Prompt ({trace.systemPrompt.length} chars)
                                    </summary>
                                    <pre className="debug_panel__pre debug_panel__pre--prose">{trace.systemPrompt}</pre>
                                </details>

                                <details className="debug_trace__part" open>
                                    <summary className="debug_trace__label">
                                        Raw Response {trace.rawResponse ? `(${trace.rawResponse.length} chars)` : '— ausstehend'}
                                    </summary>
                                    {trace.rawResponse ? (
                                        <pre className="debug_panel__pre">{formatJson(trace.rawResponse)}</pre>
                                    ) : (
                                        <p className="debug_panel__empty">Warte auf Antwort…</p>
                                    )}
                                </details>
                            </div>
                        )}
                    </div>
                </details>
            </div>
        </details>
    );
}

function formatJson(text: string): string {
    try {
        return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
        return text;
    }
}
