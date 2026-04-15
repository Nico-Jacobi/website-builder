/**
 * In-memory Pub/Sub-Log für den Generierungs-Prozess. Ermöglicht der
 * BuilderPage, die Zwischenschritte von generateSpec live anzuzeigen.
 *
 * Der Log ist ein Modul-Singleton — wer `log()` aufruft, schreibt in
 * denselben Store, auf den die UI via `subscribeLog`/`getLogSnapshot`
 * hört. Vor jeder neuen Generierung sollte `clearLog()` gerufen werden.
 */

export type LogLevel = 'info' | 'step' | 'ok' | 'warn' | 'error';

export interface LogEntry {
    id: number;
    ts: number;
    level: LogLevel;
    message: string;
}

type Listener = () => void;

let entries: LogEntry[] = [];
let snapshot: readonly LogEntry[] = entries;
let nextId = 0;
const listeners = new Set<Listener>();

function emit(): void {
    snapshot = entries.slice();
    for (const l of listeners) l();
}

export function log(level: LogLevel, message: string): void {
    entries.push({ id: nextId++, ts: Date.now(), level, message });
    emit();
}

export function clearLog(): void {
    entries = [];
    emit();
}

export function subscribeLog(fn: Listener): () => void {
    listeners.add(fn);
    return () => {
        listeners.delete(fn);
    };
}

export function getLogSnapshot(): readonly LogEntry[] {
    return snapshot;
}
