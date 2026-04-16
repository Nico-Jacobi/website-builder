import { useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import './EditMode.css';
import { useEditableField } from './useEditableField';

/**
 * Gibt ein Overlay-ReactNode zurück, das neben dem <img> gerendert wird.
 * Im normalen Modus: null (kein Overhead).
 * Im Edit Mode: schwebende Schaltfläche über dem Bild; Klick öffnet URL-Eingabe.
 *
 * Verwendung:
 *   const { overlayElement } = useEditableImage(src, 'imageSrc');
 *   <div className="mymodule__image-wrap">
 *     <img src={src} alt={alt} />
 *     {overlayElement}
 *   </div>
 *
 * Hinweis: Das Eltern-Element braucht `position: relative`.
 */
export function useEditableImage(currentSrc: string, propPath: string) {
    const { isEditMode, commit: commitValue } = useEditableField(propPath);

    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState(currentSrc);
    const overlayRef = useRef<HTMLDivElement>(null);

    if (!isEditMode) return { overlayElement: null };

    function commit() {
        const trimmed = inputValue.trim();
        if (trimmed) commitValue(trimmed);
        setOpen(false);
    }

    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') setOpen(false);
    }

    function handleOverlayClick(e: MouseEvent) {
        if (e.target === overlayRef.current) setOpen(false);
    }

    const overlayElement = (
        <div className="edit__image-wrap">
            <button
                className="edit__image-btn"
                onClick={() => {
                    setInputValue(currentSrc);
                    setOpen(true);
                }}
                title="Bild tauschen"
            >
                ✎
            </button>

            {open && (
                <div
                    ref={overlayRef}
                    className="edit__image-overlay"
                    onClick={handleOverlayClick}
                >
                    <div className="edit__image-panel">
                        <input
                            className="edit__image-input"
                            type="url"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Bild-URL eingeben…"
                            autoFocus
                        />
                        <button className="edit__image-confirm" onClick={commit}>
                            OK
                        </button>
                        <button
                            className="edit__image-cancel"
                            onClick={() => setOpen(false)}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    return { overlayElement };
}
