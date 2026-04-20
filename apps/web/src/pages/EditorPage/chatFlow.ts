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
    switch (r.kind) {
        case 'missing_key':
            return 'Kein API-Key gesetzt (VITE_GEMINI_API_KEY fehlt in .env).';
        case 'api_error':
            return `LLM-Aufruf fehlgeschlagen: ${r.message}`;
        case 'invalid_json':
            return `LLM hat kein gültiges JSON geliefert: ${r.message}`;
        case 'validation_failed': {
            const count = r.errors.length;
            return `LLM-Antwort ist keine gültige Spec (${count} Validation-Fehler).`;
        }
        case 'ok':
            // Nicht erreichbar — Caller prüft das vorher. Defensiv:
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
 */
export function summarizeApply(
    apply:       ApplyResult,
    rejected:    RejectedOp[],
    explanation: string,
): ApplySummary {
    const parts: string[] = [];
    if (explanation.trim()) parts.push(explanation.trim());

    if (apply.kind === 'ok') {
        if (apply.applied === 0 && rejected.length === 0) {
            parts.push('Keine Änderungen angewendet.');
        } else if (apply.applied > 0) {
            parts.push(`Angewendet: ${apply.applied} Änderung${apply.applied === 1 ? '' : 'en'}.`);
        }
    } else {
        parts.push(
            `Teilweise angewendet: ${apply.applied} Änderung${apply.applied === 1 ? '' : 'en'} vor Fehler (${apply.error}).`,
        );
    }

    const conflictWarning = rejected.length === 0
        ? ''
        : `Hinweis: ${rejected.length} Änderung${rejected.length === 1 ? '' : 'en'} des LLM verworfen, weil du dieselbe Stelle gerade selbst bearbeitet hast.`;

    return {
        assistant:       parts.join(' ').trim() || 'Ok.',
        conflictWarning,
    };
}
