import { useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { Link } from 'lucide-react';
import { useEditableText } from '../../builder/useEditableText';
import { useEditableField } from '../../builder/useEditableField';
import { useEditModeState } from '../../builder/editModeStore';

export interface EditableLinkProps {
    href: string;
    label: string;
    labelPath: string;
    hrefPath?: string;
    className?: string;
}

export function EditableLink({ href, label, labelPath, hrefPath, className }: EditableLinkProps) {
    const labelEdit = useEditableText(labelPath);
    const { isEditMode } = useEditModeState();
    const { commit: commitHref } = useEditableField(hrefPath ?? '_href_noop');
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState(href);

    const link = (
        <a className={className} href={href} {...labelEdit}>
            {label}
        </a>
    );

    if (!isEditMode || !hrefPath) return link;

    function openPopover() {
        setInputValue(href);
        setOpen(true);
    }

    function commit() {
        const trimmed = inputValue.trim();
        if (trimmed !== href) commitHref(trimmed);
        setOpen(false);
    }

    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') { e.preventDefault(); commit(); }
        if (e.key === 'Escape') setOpen(false);
    }

    function handleOverlayClick(e: MouseEvent) {
        if ((e.target as HTMLElement).classList.contains('edit__link-overlay')) setOpen(false);
    }

    return (
        <span className="edit__link-wrap">
            {link}
            <button
                className="edit__link-btn"
                onClick={openPopover}
                title="Edit URL"
                type="button"
            >
                <Link size={11} strokeWidth={1.75} aria-hidden="true" />
            </button>
            {open && (
                <div className="edit__link-overlay" onClick={handleOverlayClick}>
                    <div className="edit__link-popover">
                        <input
                            className="edit__image-input"
                            type="url"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="https://..."
                            autoFocus
                        />
                        <div className="edit__image-actions">
                            <button className="edit__image-confirm" type="button" onClick={commit}>OK</button>
                            <button className="edit__image-cancel" type="button" onClick={() => setOpen(false)}>✕</button>
                        </div>
                    </div>
                </div>
            )}
        </span>
    );
}
