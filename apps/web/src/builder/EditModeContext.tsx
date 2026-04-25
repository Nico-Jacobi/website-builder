import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { setNestedProp, getNestedProp } from './propPath';
import {
    EditModeActionsContext,
    EditModeStateContext,
    AutoSaveContext,
    type EditModeActionsValue,
} from './editModeStore';
import type { AutoSaveAdapter } from './autoSaveTypes';
import type { SiteSpec } from './schemas';
import { getModule } from './registry';
import { ensureBlockIds } from './blockIds';
import {
    reorderTopLevelBlocks,
    appendBlockToSpec,
    removeBlockFromSpec,
} from '../pages/EditorPage/specOps';

interface EditModeProviderProps {
    children: ReactNode;
    spec: SiteSpec;
    onSpecChange: (spec: SiteSpec) => void;
    autoSave?: AutoSaveAdapter;
    initialEditMode?: boolean;
    /**
     * Wird bei jedem Inline-Edit aufgerufen, bevor der neue State publiziert
     * wird. `key` folgt der `InlineEditedKey`-Konvention:
     *   `${blockId}:${propPath}` — Feld-Edit
     * Wird vom `useInlineEditTracker` der EditorPage konsumiert, um beim
     * Konflikt-Handling (Plan 06) LLM-Ops gegen zeitgleiche User-Edits zu
     * verteidigen.
     */
    onInlineEdit?: (key: string) => void;
}

export function EditModeProvider({
    children,
    spec,
    onSpecChange,
    autoSave,
    initialEditMode = false,
    onInlineEdit,
}: EditModeProviderProps) {
    const [isEditMode, setIsEditMode] = useState(initialEditMode);

    // Refs so updateBlock keeps a stable identity. Without this, every blur
    // rebuilds actionsValue and re-renders every editable consumer.
    const specRef = useRef(spec);
    const onSpecChangeRef = useRef(onSpecChange);
    const autoSaveRef = useRef(autoSave);
    const onInlineEditRef = useRef(onInlineEdit);
    useEffect(() => {
        specRef.current = spec;
        onSpecChangeRef.current = onSpecChange;
        autoSaveRef.current = autoSave;
        onInlineEditRef.current = onInlineEdit;
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

            const existingArray = getNestedProp(block.props, listPath);
            const nextArray = Array.isArray(existingArray)
                ? [...existingArray, defaultItem]
                : [defaultItem];

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
                    <div
                        data-edit-mode={isEditMode ? 'true' : 'false'}
                        style={{ display: 'contents' }}
                    >
                        {children}
                    </div>
                </AutoSaveContext.Provider>
            </EditModeActionsContext.Provider>
        </EditModeStateContext.Provider>
    );
}
