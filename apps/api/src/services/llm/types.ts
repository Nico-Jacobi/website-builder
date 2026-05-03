import type { SiteSpec, SpecError } from '@website-builder/shared';

export type LogLevel = 'info' | 'step' | 'ok' | 'warn' | 'error';

export interface LogEntry {
    id: number;
    ts: number;
    level: LogLevel;
    message: string;
}

export interface LLMTrace {
    systemPrompt: string;
    userPrompt: string;
    rawResponse: string | null;
}

export interface ChatHistoryEntry {
    role: 'user' | 'assistant';
    content: string;
}

export type RefineCoreResult =
    | { kind: 'ok';                nextSpec: SiteSpec; explanation: string;              log: LogEntry[]; trace: LLMTrace | null }
    | { kind: 'validation_failed'; errors: SpecError[]; rawInput: unknown;               log: LogEntry[]; trace: LLMTrace | null }
    | { kind: 'api_error';         message: string;                                      log: LogEntry[]; trace: LLMTrace | null }
    | { kind: 'missing_key';                                                             log: LogEntry[]; trace: LLMTrace | null }
    | { kind: 'safety_block';      message: string;                                      log: LogEntry[]; trace: LLMTrace | null }
    | { kind: 'invalid_json';      message: string;                                      log: LogEntry[]; trace: LLMTrace | null };
