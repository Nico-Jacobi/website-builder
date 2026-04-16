import type { FocusEvent } from 'react';
import { useEditableField } from './useEditableField';

/**
 * Returns props to spread onto a text-bearing element.
 *   Normal mode: {} (no overhead).
 *   Edit mode: contentEditable + blur handler that commits the new text.
 *
 * Usage:
 *   const editProps = useEditableText('heading');
 *   <h2 {...editProps}>{heading}</h2>
 */
export function useEditableText(propPath: string) {
    const { isEditMode, commit } = useEditableField(propPath);

    if (!isEditMode) return {};

    return {
        contentEditable: true as const,
        suppressContentEditableWarning: true,
        'data-edit-mode': 'text' as const,
        onBlur: (e: FocusEvent<HTMLElement>) => {
            commit(e.currentTarget.textContent ?? '');
        },
    };
}
