/**
 * useInlineEditTracker — sammelt Inline-Edit-Keys während eines LLM-Turns.
 *
 * Der Tracker wird zu Beginn jedes Chat-Turns per `reset()` geleert.
 * Solange der LLM-Call läuft (und der Refine-/Diff-/Apply-Zyklus läuft),
 * meldet der `EditModeProvider` jeden Inline-Edit über `markEdited(key)`.
 * `snapshot()` liefert eine Kopie des aktuellen Sets und wird dem
 * `detectConflicts(...)`-Helfer übergeben, damit LLM-Ops auf gleichzeitig
 * inline-geänderten Feldern verworfen werden (Masterplan §4.3).
 *
 * Intern wird `useRef<Set<string>>` genutzt, damit das Mutieren des Sets
 * **keine** Re-Renders auslöst — Inline-Edits passieren bei jedem Tastendruck
 * und würden sonst die Edit-Komponenten ständig neu mounten.
 */

import { useCallback, useRef } from 'react';
import type { InlineEditedKey } from '../../diff/types';

export interface InlineEditTracker {
    markEdited: (key: InlineEditedKey) => void;
    reset:      () => void;
    snapshot:   () => Set<InlineEditedKey>;
}

export function useInlineEditTracker(): InlineEditTracker {
    const setRef = useRef<Set<InlineEditedKey>>(new Set());

    const markEdited = useCallback((key: InlineEditedKey): void => {
        setRef.current.add(key);
    }, []);

    const reset = useCallback((): void => {
        setRef.current = new Set();
    }, []);

    const snapshot = useCallback((): Set<InlineEditedKey> => {
        return new Set(setRef.current);
    }, []);

    return { markEdited, reset, snapshot };
}
