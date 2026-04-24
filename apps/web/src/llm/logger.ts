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

/**
 * Ersetzt den aktuellen Log-Zustand durch eine extern gebildete Liste
 * (z.B. aus einer Backend-Response). `id` und `ts` werden aus den Entries
 * übernommen. `nextId` wird so erhöht, dass spätere `log()`-Aufrufe
 * (rein theoretisch, im aktuellen Flow kaum relevant) kollisionsfrei sind.
 */
export function ingestLog(fromBackend: LogEntry[]): void {
    entries = fromBackend.slice();
    if (entries.length > 0) {
        nextId = Math.max(...entries.map((e) => e.id)) + 1;
    }
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
