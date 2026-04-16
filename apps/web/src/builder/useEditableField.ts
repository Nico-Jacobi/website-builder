import { useCallback } from 'react';
import { useEditModeState, useEditModeActions, useBlockIndex } from './editModeStore';

/**
 * Shared setup for edit-mode field hooks (useEditableText, useEditableImage, …).
 *
 * Consolidates the three context reads and binds a `commit(value)` callback
 * to the current block index + prop path, so field hooks don't have to know
 * about blockIndex/updateBlock plumbing.
 */
export function useEditableField(propPath: string) {
    const { isEditMode } = useEditModeState();
    const { updateBlock } = useEditModeActions();
    const blockIndex = useBlockIndex();

    const commit = useCallback(
        (value: unknown) => updateBlock(blockIndex, propPath, value),
        [updateBlock, blockIndex, propPath],
    );

    return { isEditMode, commit };
}
