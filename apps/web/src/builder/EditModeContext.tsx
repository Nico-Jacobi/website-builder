import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { setNestedProp, getNestedProp } from './propPath';
import {
    EditModeActionsContext,
    EditModeStateContext,
    AutoSaveContext,
} from './editModeStore';
import type { AutoSaveAdapter } from './autoSaveTypes';
import type { SiteSpec } from './schemas';

interface EditModeProviderProps {
    children: ReactNode;
    spec: SiteSpec;
    onSpecChange: (spec: SiteSpec) => void;
    autoSave?: AutoSaveAdapter;
}

export function EditModeProvider({ children, spec, onSpecChange, autoSave }: EditModeProviderProps) {
    const [isEditMode, setIsEditMode] = useState(false);

    // Refs so updateBlock keeps a stable identity. Without this, every blur
    // rebuilds actionsValue and re-renders every editable consumer.
    const specRef = useRef(spec);
    const onSpecChangeRef = useRef(onSpecChange);
    const autoSaveRef = useRef(autoSave);
    useEffect(() => {
        specRef.current = spec;
        onSpecChangeRef.current = onSpecChange;
        autoSaveRef.current = autoSave;
    });

    const updateBlock = useCallback(
        (blockIndex: number, propPath: string, value: unknown) => {
            const current = specRef.current;
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

            const blockId = current.blocks[blockIndex]?.id;
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

            const blockId = block.id;
            if (autoSaveRef.current && blockId) {
                autoSaveRef.current.patchContent(blockId, listPath, nextArray);
            }
        },
        [],
    );

    const stateValue = useMemo(() => ({ isEditMode }), [isEditMode]);
    const actionsValue = useMemo(
        () => ({ updateBlock, setIsEditMode, addItem }),
        [updateBlock, addItem],
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
