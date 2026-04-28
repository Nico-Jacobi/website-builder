import { useRef } from 'react';
import type { FocusEvent } from 'react';
import { useEditableField } from './useEditableField';

/**
 * Returns props to spread onto a text-bearing element.
 *   Normal mode: {} (no overhead).
 *   Edit mode: contentEditable + blur handler that commits the new text.
 *
 * Skips commit when the text is unchanged (avoids a no-op spec replace
 * and a PATCH over the wire on every tab-through).
 *
 * Usage:
 *   const editProps = useEditableText('heading');
 *   <h2 {...editProps}>{heading}</h2>
 */
export function useEditableText(propPath: string) {
    const { isEditMode, commit } = useEditableField(propPath);
    const originalRef = useRef<string | null>(null);

    if (!isEditMode) return {};

    return {
        contentEditable: true as const,
        suppressContentEditableWarning: true,
        'data-edit-mode': 'text' as const,
        onFocus: (e: FocusEvent<HTMLElement>) => {
            originalRef.current = e.currentTarget.textContent ?? '';
            const sel = window.getSelection();
            if (sel) {
                const range = document.createRange();
                range.selectNodeContents(e.currentTarget);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        },
        onBlur: (e: FocusEvent<HTMLElement>) => {
            const next = e.currentTarget.textContent ?? '';
            if (next !== originalRef.current) commit(next);
        },
    };
}
