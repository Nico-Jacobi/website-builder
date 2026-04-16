/**
 * Stores the last LLM request/response pair so the debug UI can display it.
 * Same pub/sub pattern as logger.ts.
 */

export interface LLMTrace {
    systemPrompt: string;
    userPrompt: string;
    rawResponse: string | null;
}

type Listener = () => void;

let current: LLMTrace | null = null;
const listeners = new Set<Listener>();

function emit(): void {
    for (const l of listeners) l();
}

export function setTrace(trace: LLMTrace): void {
    current = trace;
    emit();
}

export function clearTrace(): void {
    current = null;
    emit();
}

export function getTrace(): LLMTrace | null {
    return current;
}

export function subscribeTrace(fn: Listener): () => void {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
}
