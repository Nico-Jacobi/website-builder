import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { setNestedProp } from './propPath';
import {
    EditModeActionsContext,
    EditModeStateContext,
} from './editModeStore';
import type { SiteSpec } from './schemas';

interface EditModeProviderProps {
    children: ReactNode;
    spec: SiteSpec;
    onSpecChange: (spec: SiteSpec) => void;
}

export function EditModeProvider({ children, spec, onSpecChange }: EditModeProviderProps) {
    const [isEditMode, setIsEditMode] = useState(false);

    const updateBlock = useCallback(
        (blockIndex: number, propPath: string, value: unknown) => {
            onSpecChange({
                ...spec,
                blocks: spec.blocks.map((block, i) => {
                    if (i !== blockIndex) return block;
                    return {
                        ...block,
                        props: setNestedProp(block.props, propPath, value),
                    };
                }),
            });
        },
        [spec, onSpecChange],
    );

    const stateValue = useMemo(() => ({ isEditMode }), [isEditMode]);
    const actionsValue = useMemo(
        () => ({ updateBlock, setIsEditMode }),
        [updateBlock],
    );

    return (
        <EditModeStateContext.Provider value={stateValue}>
            <EditModeActionsContext.Provider value={actionsValue}>
                {children}
            </EditModeActionsContext.Provider>
        </EditModeStateContext.Provider>
    );
}
