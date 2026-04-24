import type { LogEntry, LogLevel, LLMTrace } from './types';

export interface LogCollector {
    log(level: LogLevel, message: string): void;
    setTrace(trace: LLMTrace): void;
    getLog(): LogEntry[];
    getTrace(): LLMTrace | null;
}

/**
 * Request-scoped log/trace sink. Replaces the browser-side pub/sub stores.
 * Each LLM turn creates a fresh collector; the final result ships log + trace
 * back to the client so the debug UI can display them.
 */
export function createLogCollector(): LogCollector {
    const entries: LogEntry[] = [];
    let trace: LLMTrace | null = null;
    let nextId = 0;

    return {
        log(level, message) {
            entries.push({ id: nextId++, ts: Date.now(), level, message });
        },
        setTrace(t) {
            trace = t;
        },
        getLog() {
            return entries.slice();
        },
        getTrace() {
            return trace;
        },
    };
}
