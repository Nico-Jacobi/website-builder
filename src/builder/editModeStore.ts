import { createContext, useContext } from 'react';

// ── State Context (isEditMode) ────────────────────────────────────────────────
// Separated from actions so consumers that only need the flag don't re-render
// when updateBlock changes.

export interface EditModeStateValue {
    isEditMode: boolean;
}

export const EditModeStateContext = createContext<EditModeStateValue>({
    isEditMode: false,
});

export function useEditModeState(): EditModeStateValue {
    return useContext(EditModeStateContext);
}

// ── Actions Context (updateBlock, setIsEditMode) ──────────────────────────────

export interface EditModeActionsValue {
    updateBlock: (blockIndex: number, propPath: string, value: unknown) => void;
    setIsEditMode: (value: boolean) => void;
}

export const EditModeActionsContext = createContext<EditModeActionsValue>({
    updateBlock: () => {},
    setIsEditMode: () => {},
});

export function useEditModeActions(): EditModeActionsValue {
    return useContext(EditModeActionsContext);
}

// ── Block Index Context ───────────────────────────────────────────────────────
// The Renderer sets this before each block; field hooks read it without the
// module having to receive an index prop.

export const BlockIndexContext = createContext<number>(-1);

export function useBlockIndex(): number {
    return useContext(BlockIndexContext);
}
