/**
 * chatFlow — Helpers für den "LLM-Turn"-Flow der EditorPage.
 *
 * Hier leben die reinen Pure-Funktionen: History-Mapping, Result-Adapter,
 * Fehler-Formatter und Apply-Summary. Die Orchestrierung selbst (Chat-Append
 * → refineSpec → diff → apply) bleibt in `EditorPage.tsx::handleChatSubmit`.
 */

import type { ChatMessage } from './chat/types';
import type { ChatHistoryEntry, GenerateResult, RefineResult } from '../../llm/types';
import type { ApplyResult } from './applyPatchOps';
import type { RejectedOp } from '../../diff/types';
import type { StreamEvent } from '../../data/useGenerationStream';
import i18n from '../../i18n';

/** Maximum number of turns we ship to the LLM — matches REFINE_HISTORY_MAX. */
export const CHAT_HISTORY_MAX = 10;

/**
 * Letzte N user+assistant-Messages aus dem Chat-Verlauf nehmen und in das
 * schmale `ChatHistoryEntry`-Shape übersetzen, das der LLM-Layer erwartet.
 * System-Messages (Konflikt-Hinweise, Fehler) werden ausgefiltert — die sind
 * Meta-Informationen für den User, nicht für das Modell.
 */
export function toHistoryEntries(messages: ChatMessage[]): ChatHistoryEntry[] {
    return messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-CHAT_HISTORY_MAX)
        .map((m) => ({
            role:    m.role as 'user' | 'assistant',
            content: m.content,
        }));
}

/**
 * Hebt das Ergebnis eines `generateSpec()`-Calls auf das `RefineResult`-Shape
 * an. `generateSpec` liefert `spec`, `refineSpec` liefert `nextSpec` +
 * `explanation` — wir normalisieren auf Letzteres, damit der Downstream-Code
 * nur einen Result-Typen behandeln muss.
 */
export function adaptGenerateResult(r: GenerateResult): RefineResult {
    if (r.kind === 'ok') {
        return { kind: 'ok', nextSpec: r.spec, explanation: '' };
    }
    return r;
}

/**
 * Fehler-Kind → user-sichtbare System-Message. Texte DE, damit die Chat-
 * UI konsistent ist.
 */
export function formatLLMError(r: RefineResult): string {
    const t = i18n.t.bind(i18n);
    switch (r.kind) {
        case 'missing_key':
            return t('editor.chat.errorNoApiKey');
        case 'api_error':
            return t('editor.chat.errorApiCall', { message: r.message });
        case 'safety_block':
            return t('editor.chat.errorSafetyBlock', { message: r.message });
        case 'invalid_json':
            return t('editor.chat.errorInvalidJson', { message: r.message });
        case 'validation_failed': {
            const count = r.errors.length;
            return t('editor.chat.errorValidationFailed', { count });
        }
        case 'ok':
            return '';
    }
}

export interface ApplySummary {
    assistant:       string;
    conflictWarning: string;
}

/**
 * Textuelle Zusammenfassung dessen, was im Turn passiert ist — wird dem
 * User als Assistant-Message und optional als System-Warning angezeigt.
 *
 * Wenn das LLM eine eigene `explanation` mitgeschickt hat, wird die an den
 * Anfang der Assistant-Message gestellt; die automatisch berechnete
 * Ops-Zusammenfassung kommt als zweite Zeile.
 *
 * Bei der Erst-Generation (`initial`) ersetzen wir die Ops-Zahl durch eine
 * nutzerfreundliche Gesamtlauf-Zeit — "9 Änderungen angewendet" ist für den
 * ersten Turn keine nützliche Info, da ohnehin *alles* neu ist.
 *
 * Für Multi-Page-Refinement (scope='page' oder scope='chrome') wird der
 * page-context in die Summary eingebettet.
 */
export function summarizeApply(
    apply:       ApplyResult,
    rejected:    RejectedOp[],
    explanation: string,
    initial?:    { durationMs: number },
    _scope?:     string,
    pagePath?:   string,
): ApplySummary {
    const t = i18n.t.bind(i18n);
    const parts: string[] = [];
    if (explanation.trim()) parts.push(explanation.trim());

    if (apply.kind === 'ok') {
        if (apply.applied === 0 && rejected.length === 0) {
            parts.push(t('editor.chat.noChanges'));
        } else if (initial && apply.applied > 0) {
            const seconds = Math.max(1, Math.round(initial.durationMs / 1000));
            parts.push(t('editor.chat.siteGenerated', { seconds }));
        } else if (apply.applied > 0) {
            if (pagePath) {
                parts.push(t('editor.chat.pageUpdated', { pagePath, n: apply.applied }));
            } else {
                parts.push(t('editor.chat.changesApplied', { n: apply.applied }));
            }
        }
    } else {
        parts.push(t('editor.chat.partialApply', { n: apply.applied }));
    }

    const conflictWarning = rejected.length === 0
        ? ''
        : t('editor.chat.conflictWarning', { n: rejected.length });

    return {
        assistant:       parts.join(' ').trim() || t('editor.chat.ok'),
        conflictWarning,
    };
}

/**
 * Wandelt einen Generation-Stream-Event in eine ChatMessage-ähnliche Struktur
 * um, die im Chat-Feed angezeigt werden kann. Gibt `null` zurück für Events,
 * die keine sichtbare Nachricht erzeugen (z.B. snapshot, idle, *_started).
 *
 * `durations` ist eine Map von page-path → {start, end?} Timestamps
 * (in `performance.now()`-Millisekunden). start/end werden vom Caller gesetzt
 * wenn der zugehörige *_started- bzw. *_done-Event eintrifft.
 */
export function summarizeGenerationEvent(
    event:     StreamEvent,
    durations: Map<string, { start: number; end?: number }>,
): { role: 'assistant'; content: string } | null {
    function dur(path: string): string {
        const e = durations.get(path);
        if (!e?.end) return '?';
        const secs = ((e.end - e.start) / 1000).toFixed(1);
        return `${secs}s`;
    }

    const t = i18n.t.bind(i18n);
    switch (event.type) {
        case 'landing_done':
            return {
                role:    'assistant',
                content: t('editor.chat.landingDone', { dur: dur('/'), n: event.sitemap.length - 1 }),
            };
        case 'subpage_done':
            return {
                role:    'assistant',
                content: t('editor.chat.subpageDone', { path: event.path, dur: dur(event.path) }),
            };
        case 'subpage_failed':
            return {
                role:    'assistant',
                content: t('editor.chat.subpageFailed', { path: event.path, reason: event.reason }),
            };
        case 'complete':
            return { role: 'assistant', content: t('editor.chat.complete') };
        case 'error':
            return { role: 'assistant', content: t('editor.chat.generationFailed', { reason: event.reason }) };
        default:
            return null;
    }
}
