import { useSyncExternalStore, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { SiteSpec } from '@website-builder/shared';
import './BuilderPage.css';
import { generateSpec } from '../../llm/generateSpec';
import { loadState, savePrompt, saveSpec } from '../../state/specStore';
import { clearLog, getLogSnapshot, subscribeLog, type LogEntry } from '../../llm/logger';
import type { GenerateResult } from '../../llm/types';
import { listModules, getRegistryLLMSurface } from '../../builder/registry';
import { subscribeTrace, getTrace } from '../../llm/llmTrace';
import { publishSpec, listSites, deleteSite, type SiteListItem } from '../../data/siteClient';

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

            <SitesList />

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
                    <PublishPanel spec={result.spec} />
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

type PublishStatus =
    | { kind: 'idle' }
    | { kind: 'publishing' }
    | { kind: 'ok'; identifier: string; path: string; wasUpdate: boolean }
    | { kind: 'err'; message: string };

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 64);
}

function PublishPanel({ spec }: { spec: SiteSpec }) {
    const [name, setName] = useState('Demo Site');
    const [identifier, setIdentifier] = useState(() => slugify('Demo Site'));
    const [identifierEdited, setIdentifierEdited] = useState(false);
    const [exists, setExists] = useState<boolean | null>(null);
    const [status, setStatus] = useState<PublishStatus>({ kind: 'idle' });

    // Check if identifier already exists (debounced)
    useEffect(() => {
        if (!identifier) { setExists(null); return; }
        setExists(null);
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(
                    `${(import.meta.env.VITE_API_BASE as string | undefined) ?? 'http://localhost:3001'}/api/sites/${encodeURIComponent(identifier)}/spec`,
                );
                setExists(res.ok);
            } catch {
                setExists(null);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [identifier]);

    function onNameChange(next: string) {
        setName(next);
        if (!identifierEdited) {
            setIdentifier(slugify(next));
        }
    }

    function onIdentifierChange(next: string) {
        setIdentifier(next);
        setIdentifierEdited(true);
    }

    async function onPublish() {
        if (status.kind === 'publishing') return;
        setStatus({ kind: 'publishing' });
        try {
            const res = await publishSpec({ identifier, name, path: '/', spec });
            setStatus({ kind: 'ok', identifier: res.identifier, path: res.path, wasUpdate: exists === true });
        } catch (err) {
            setStatus({ kind: 'err', message: err instanceof Error ? err.message : String(err) });
        }
    }

    const identifierInvalid = identifier.length > 0 && !/^[a-z0-9-]+$/.test(identifier);

    return (
        <div className="builder_page__publish">
            <div className="builder_page__publish-row">
                <label>
                    name{' '}
                    <input value={name} onChange={(e) => onNameChange(e.target.value)} />
                </label>
                <label>
                    identifier{' '}
                    <input
                        value={identifier}
                        onChange={(e) => onIdentifierChange(e.target.value)}
                        className={identifierInvalid ? 'builder_page__input--invalid' : undefined}
                    />
                </label>
                <button
                    className="builder_page__button"
                    onClick={onPublish}
                    disabled={status.kind === 'publishing' || !identifier || !name || identifierInvalid}
                >
                    {status.kind === 'publishing'
                        ? 'Publiziere…'
                        : exists
                          ? 'Überschreiben & pushen'
                          : 'Ins Backend pushen'}
                </button>
            </div>
            {exists === true && status.kind !== 'ok' && (
                <p className="builder_page__publish-warn">
                    Identifier „{identifier}" existiert bereits — wird beim Pushen überschrieben.
                </p>
            )}
            {identifierInvalid && (
                <p className="builder_page__publish-warn">
                    Nur Kleinbuchstaben, Ziffern und Bindestriche erlaubt.
                </p>
            )}
            {status.kind === 'ok' && (
                <p className="builder_page__publish-ok">
                    {status.wasUpdate ? 'Aktualisiert.' : 'Erstellt.'} Jetzt live unter{' '}
                    <Link to={`/site?identifier=${encodeURIComponent(status.identifier)}&path=${encodeURIComponent(status.path)}`}>
                        /site?identifier={status.identifier}
                    </Link>
                </p>
            )}
            {status.kind === 'err' && (
                <p className="builder_page__publish-err">Fehler: {status.message}</p>
            )}
        </div>
    );
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

function SitesList() {
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
                                        to={`/site?identifier=${encodeURIComponent(s.identifier)}&path=/`}
                                        className="sites_list__btn sites_list__btn--open"
                                    >
                                        Öffnen
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
