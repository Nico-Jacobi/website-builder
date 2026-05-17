import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { setNestedProp, getNestedProp } from './propPath';
import {
    EditModeActionsContext,
    EditModeStateContext,
    AutoSaveContext,
    useEditModeActions,
    type EditModeActionsValue,
} from './editModeStore';
import { useBlockTarget } from './blockTarget';
import type { AutoSaveAdapter } from './autoSaveTypes';
import type { SiteSpec } from './schemas';
import { getModule } from './registry';
import { ensureBlockIds } from './blockIds';
import {
    reorderTopLevelBlocks,
    appendBlockToSpec,
    removeBlockFromSpec,
} from '../pages/EditorPage/specOps';
import { scheduleChromeSave } from '../data/autoSave';

interface EditModeProviderProps {
    children: ReactNode;
    spec: SiteSpec;
    onSpecChange: (spec: SiteSpec) => void;
    autoSave?: AutoSaveAdapter;
    initialEditMode?: boolean;
    activePagePath?: string;
    /**
     * Wird bei jedem Inline-Edit aufgerufen, bevor der neue State publiziert
     * wird. `key` folgt der `InlineEditedKey`-Konvention:
     *   `${blockId}:${propPath}` — Feld-Edit
     * Wird vom `useInlineEditTracker` der EditorPage konsumiert, um beim
     * Konflikt-Handling (Plan 06) LLM-Ops gegen zeitgleiche User-Edits zu
     * verteidigen.
     */
    onInlineEdit?: (key: string) => void;
    /**
     * The site identifier — required for chrome persistence via PUT /chrome.
     * When not provided, chrome edits are applied locally but not persisted.
     */
    identifier?: string;
}

/** Context that provides chrome-specific edit helpers to child components. */
export interface ChromeEditHelpers {
    updateChromeProp: (position: 'header' | 'footer', propPath: string, value: unknown) => void;
    updateChromeList: (position: 'header' | 'footer', listPath: string, nextArray: unknown[]) => void;
    getChromeProp: (position: 'header' | 'footer', listPath: string) => unknown;
}

const ChromeEditContext = createContext<ChromeEditHelpers | null>(null);

export function useChromeEditHelpers(): ChromeEditHelpers | null {
    return useContext(ChromeEditContext);
}

export function EditModeProvider({
    children,
    spec,
    onSpecChange,
    autoSave,
    initialEditMode = false,
    onInlineEdit,
    activePagePath: _activePagePath,
    identifier,
}: EditModeProviderProps) {
    const [isEditMode, setIsEditMode] = useState(initialEditMode);

    // Refs so callbacks keep a stable identity. Without this, every blur
    // rebuilds actionsValue and re-renders every editable consumer.
    const specRef = useRef(spec);
    const onSpecChangeRef = useRef(onSpecChange);
    const autoSaveRef = useRef(autoSave);
    const onInlineEditRef = useRef(onInlineEdit);
    const identifierRef = useRef(identifier);
    useEffect(() => {
        specRef.current = spec;
        onSpecChangeRef.current = onSpecChange;
        autoSaveRef.current = autoSave;
        onInlineEditRef.current = onInlineEdit;
        identifierRef.current = identifier;
    });

    const updateBlock = useCallback(
        (blockIndex: number, propPath: string, value: unknown) => {
            const current = specRef.current;
            const blockId = current.blocks[blockIndex]?.id;
            if (blockId) {
                onInlineEditRef.current?.(`${blockId}:${propPath}`);
            }

            onSpecChangeRef.current({
                ...current,
                blocks: current.blocks.map((block, i) => {
                    if (i !== blockIndex) return block;
                    return {
                        ...block,
                        props: setNestedProp(block.props, propPath, value),
                    };
                }),
            });

            if (autoSaveRef.current && blockId) {
                autoSaveRef.current.patchContent(blockId, propPath, value);
            }
        },
        [],
    );

    const addItem = useCallback(
        (blockIndex: number, listPath: string, defaultItem: unknown) => {
            const current = specRef.current;
            const block = current.blocks[blockIndex];
            if (!block) return;

            // `structuredClone` so each added item is independent — otherwise
            // every new item (and the module's `defaults`) would share one
            // object reference, and editing one would alias the others.
            const fresh = structuredClone(defaultItem);
            const existingArray = getNestedProp(block.props, listPath);
            const nextArray = Array.isArray(existingArray)
                ? [...existingArray, fresh]
                : [fresh];

            const blockId = block.id;
            if (blockId) {
                onInlineEditRef.current?.(`${blockId}:${listPath}`);
            }

            onSpecChangeRef.current({
                ...current,
                blocks: current.blocks.map((b, i) => {
                    if (i !== blockIndex) return b;
                    return {
                        ...b,
                        props: setNestedProp(b.props, listPath, nextArray),
                    };
                }),
            });

            if (autoSaveRef.current && blockId) {
                autoSaveRef.current.patchContent(blockId, listPath, nextArray);
            }
        },
        [],
    );

    const removeItem = useCallback(
        (blockIndex: number, listPath: string, itemIndex: number) => {
            const current = specRef.current;
            const block = current.blocks[blockIndex];
            if (!block) return;

            const existingArray = getNestedProp(block.props, listPath);
            if (!Array.isArray(existingArray)) return;
            const nextArray = existingArray.filter((_, i) => i !== itemIndex);

            const blockId = block.id;
            if (blockId) {
                onInlineEditRef.current?.(`${blockId}:${listPath}`);
            }

            onSpecChangeRef.current({
                ...current,
                blocks: current.blocks.map((b, i) => {
                    if (i !== blockIndex) return b;
                    return {
                        ...b,
                        props: setNestedProp(b.props, listPath, nextArray),
                    };
                }),
            });

            if (autoSaveRef.current && blockId) {
                autoSaveRef.current.patchContent(blockId, listPath, nextArray);
            }
        },
        [],
    );

    // Structural top-level block actions. These write directly to the spec via
    // `onSpecChange` — they do NOT go through the LLM-diff pipeline or the
    // field-level `autoSave.patchContent` (which is keyed by blockId+fieldPath
    // and doesn't model block-level structure). Backend persistence of
    // structural edits is wired in a later plan via `blockOps`.

    const reorderBlocks = useCallback<EditModeActionsValue['reorderBlocks']>(
        (fromIndex, toIndex) => {
            const current = specRef.current;
            if (!current) return;
            const next = reorderTopLevelBlocks(current, fromIndex, toIndex);
            onSpecChangeRef.current(next);
        },
        [],
    );

    const addBlock = useCallback<EditModeActionsValue['addBlock']>(
        (moduleType, atIndex) => {
            const module = getModule(moduleType);
            if (!module) return;
            const current = specRef.current;
            if (!current) return;
            // `structuredClone` so every added block has independent props —
            // otherwise two blocks would share references into `module.defaults`.
            const fresh = {
                type: moduleType,
                props: structuredClone(module.defaults) as Record<string, unknown>,
            };
            const withAppended = appendBlockToSpec(current, fresh);
            const withIds = ensureBlockIds(withAppended);
            const finalSpec =
                atIndex === undefined
                    ? withIds
                    : reorderTopLevelBlocks(
                          withIds,
                          withIds.blocks.length - 1,
                          atIndex,
                      );
            onSpecChangeRef.current(finalSpec);
        },
        [],
    );

    const removeBlock = useCallback<EditModeActionsValue['removeBlock']>(
        (blockIndex) => {
            const current = specRef.current;
            if (!current) return;
            const target = current.blocks[blockIndex];
            if (!target?.id) return;
            const next = removeBlockFromSpec(current, target.id);
            onSpecChangeRef.current(next);
        },
        [],
    );

    // Chrome-aware helpers — exposed via ChromeEditContext for use by
    // ChromeActionsGuard (rendered by the Renderer around each chrome block).
    const updateChromeProp = useCallback(
        (position: 'header' | 'footer', propPath: string, value: unknown) => {
            const current = specRef.current;
            const chromeBlock = current.chrome?.[position];
            if (!chromeBlock) return;
            const updatedBlock = {
                ...chromeBlock,
                props: setNestedProp(chromeBlock.props, propPath, value),
            };
            const updatedChrome = { ...current.chrome, [position]: updatedBlock };
            onSpecChangeRef.current({ ...current, chrome: updatedChrome });
            const id = identifierRef.current;
            if (id) scheduleChromeSave(id, updatedChrome);
        },
        [],
    );

    const updateChromeList = useCallback(
        (position: 'header' | 'footer', listPath: string, nextArray: unknown[]) => {
            const current = specRef.current;
            const chromeBlock = current.chrome?.[position];
            if (!chromeBlock) return;
            const updatedBlock = {
                ...chromeBlock,
                props: setNestedProp(chromeBlock.props, listPath, nextArray),
            };
            const updatedChrome = { ...current.chrome, [position]: updatedBlock };
            onSpecChangeRef.current({ ...current, chrome: updatedChrome });
            const id = identifierRef.current;
            if (id) scheduleChromeSave(id, updatedChrome);
        },
        [],
    );

    const getChromeProp = useCallback(
        (position: 'header' | 'footer', listPath: string): unknown => {
            return getNestedProp(specRef.current.chrome?.[position]?.props ?? {}, listPath);
        },
        [],
    );

    const chromeHelpers = useMemo<ChromeEditHelpers>(
        () => ({ updateChromeProp, updateChromeList, getChromeProp }),
        [updateChromeProp, updateChromeList, getChromeProp],
    );

    const stateValue = useMemo(() => ({ isEditMode }), [isEditMode]);
    const actionsValue = useMemo(
        () => ({
            updateBlock,
            setIsEditMode,
            addItem,
            removeItem,
            reorderBlocks,
            addBlock,
            removeBlock,
        }),
        [
            updateBlock,
            setIsEditMode,
            addItem,
            removeItem,
            reorderBlocks,
            addBlock,
            removeBlock,
        ],
    );

    return (
        <EditModeStateContext.Provider value={stateValue}>
            <EditModeActionsContext.Provider value={actionsValue}>
                <AutoSaveContext.Provider value={autoSave ?? null}>
                    <ChromeEditContext.Provider value={chromeHelpers}>
                        <div
                            data-edit-mode={isEditMode ? 'true' : 'false'}
                            style={{ display: 'contents' }}
                        >
                            {children}
                        </div>
                    </ChromeEditContext.Provider>
                </AutoSaveContext.Provider>
            </EditModeActionsContext.Provider>
        </EditModeStateContext.Provider>
    );
}

/**
 * Rendered by the Renderer *inside* each `BlockTargetContext.Provider` for
 * chrome blocks. It reads the chrome target from context and overrides
 * `EditModeActionsContext` with chrome-aware action implementations, so that
 * modules inside a chrome block transparently route their inline edits to
 * `spec.chrome` instead of `spec.blocks`.
 *
 * This component must be placed inside both:
 *   - `ChromeEditContext.Provider` (set by EditModeProvider)
 *   - `BlockTargetContext.Provider value={{kind:'chrome', ...}}` (set by Renderer)
 */
export function ChromeActionsGuard({ children }: { children: ReactNode }) {
    const target = useBlockTarget();
    const chromeHelpers = useChromeEditHelpers();
    const baseActions = useEditModeActions();

    const chromeAwareUpdateBlock = useCallback(
        (blockIndex: number, propPath: string, value: unknown) => {
            if (target?.kind === 'chrome' && chromeHelpers) {
                chromeHelpers.updateChromeProp(target.position, propPath, value);
            } else {
                baseActions.updateBlock(blockIndex, propPath, value);
            }
        },
        [target, chromeHelpers, baseActions],
    );

    const chromeAwareAddItem = useCallback(
        (blockIndex: number, listPath: string, defaultItem: unknown) => {
            if (target?.kind === 'chrome' && chromeHelpers) {
                const fresh = structuredClone(defaultItem);
                const existing = chromeHelpers.getChromeProp(target.position, listPath);
                const nextArray = Array.isArray(existing)
                    ? [...existing, fresh]
                    : [fresh];
                chromeHelpers.updateChromeList(target.position, listPath, nextArray);
            } else {
                baseActions.addItem(blockIndex, listPath, defaultItem);
            }
        },
        [target, chromeHelpers, baseActions],
    );

    const chromeAwareRemoveItem = useCallback(
        (blockIndex: number, listPath: string, itemIndex: number) => {
            if (target?.kind === 'chrome' && chromeHelpers) {
                const existing = chromeHelpers.getChromeProp(target.position, listPath);
                if (!Array.isArray(existing)) return;
                const nextArray = existing.filter((_, i) => i !== itemIndex);
                chromeHelpers.updateChromeList(target.position, listPath, nextArray);
            } else {
                baseActions.removeItem(blockIndex, listPath, itemIndex);
            }
        },
        [target, chromeHelpers, baseActions],
    );

    const chromeAwareActions = useMemo<EditModeActionsValue>(
        () => ({
            ...baseActions,
            updateBlock: chromeAwareUpdateBlock,
            addItem: chromeAwareAddItem,
            removeItem: chromeAwareRemoveItem,
            // addBlock / removeBlock / reorderBlocks are page-only
        }),
        [baseActions, chromeAwareUpdateBlock, chromeAwareAddItem, chromeAwareRemoveItem],
    );

    return (
        <EditModeActionsContext.Provider value={chromeAwareActions}>
            {children}
        </EditModeActionsContext.Provider>
    );
}
