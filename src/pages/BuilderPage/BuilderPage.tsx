import { useSyncExternalStore, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './BuilderPage.css';
import { generateSpec } from '../../llm/generateSpec';
import { loadState, savePrompt, saveSpec } from '../../state/specStore';
import { clearLog, getLogSnapshot, subscribeLog, type LogEntry } from '../../llm/logger';
import type { GenerateResult } from '../../llm/types';

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
