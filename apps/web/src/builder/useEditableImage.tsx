import { useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, KeyboardEvent, MouseEvent } from 'react';
import { Pencil, X } from 'lucide-react';
import './EditMode.css';
import { useEditableField } from './useEditableField';
import { useAutoSave } from './editModeStore';

/**
 * Gibt ein Overlay-ReactNode zurück, das neben dem <img> gerendert wird.
 * Im normalen Modus: null (kein Overhead).
 * Im Edit Mode: schwebende Schaltfläche über dem Bild; Klick öffnet Upload-Overlay.
 *
 * Verwendung:
 *   const { overlayElement, dragProps, openModal } = useEditableImage(src, 'imageSrc');
 *   <div className="mymodule__image-wrap" {...dragProps}>
 *     <img src={src} alt={alt} />
 *     {overlayElement}
 *   </div>
 *
 * Hinweis: Das Eltern-Element braucht `position: relative`.
 */
export function useEditableImage(
    currentSrc: string,
    propPath: string,
    altPath?: string,
    currentAlt?: string,
) {
    const { isEditMode, commit: commitSrc } = useEditableField(propPath);
    const { commit: commitAlt } = useEditableField(altPath ?? '_alt_noop');
    const autoSave = useAutoSave();

    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState(currentSrc);
    const [altInputValue, setAltInputValue] = useState(currentAlt ?? '');
    const [uploading, setUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const overlayRef = useRef<HTMLDivElement>(null);

    if (!isEditMode) return { overlayElement: null, dragProps: {}, openModal: undefined };

    function openModal() {
        setInputValue(currentSrc);
        setAltInputValue(currentAlt ?? '');
        setOpen(true);
    }

    function commitAll(src: string) {
        if (src) commitSrc(src);
        if (altPath && altInputValue !== (currentAlt ?? '')) commitAlt(altInputValue);
        setOpen(false);
    }

    function commitUrl() {
        commitAll(inputValue.trim());
    }

    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') commitUrl();
        if (e.key === 'Escape') setOpen(false);
    }

    function handleOverlayClick(e: MouseEvent) {
        if (e.target === overlayRef.current) setOpen(false);
    }

    async function uploadFile(file: File) {
        if (!autoSave) return;
        const isImage = file.type.startsWith('image/');
        if (!isImage) return;

        setUploading(true);
        try {
            const { url } = await autoSave.uploadAsset(file);
            commitSrc(url);
            if (altPath && altInputValue !== (currentAlt ?? '')) commitAlt(altInputValue);
            setOpen(false);
        } catch {
            // Fehler wird im AutoSave-Status angezeigt (Toolbar)
        } finally {
            setUploading(false);
        }
    }

    async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) await uploadFile(file);
    }

    // Drag-and-Drop direkt auf den Bild-Wrapper
    const dragProps = {
        'data-drag-over': isDragOver ? 'true' : undefined,
        onDragOver(e: DragEvent) {
            e.preventDefault();
            if (!isDragOver) setIsDragOver(true);
        },
        onDragLeave(e: DragEvent) {
            // Nur wenn wirklich den Wrapper verlassen (nicht Kind-Elemente)
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setIsDragOver(false);
            }
        },
        async onDrop(e: DragEvent) {
            e.preventDefault();
            setIsDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) await uploadFile(file);
        },
    };

    const hasUpload = autoSave !== null;
    const hasAlt = altPath !== undefined;

    const overlayElement = (
        <div className="edit__image-wrap">
            <button
                className="edit__image-btn"
                onClick={openModal}
                title="Bild tauschen"
            >
                <Pencil size={13} strokeWidth={1.75} aria-hidden="true" />
            </button>

            {open && (
                <div
                    ref={overlayRef}
                    className="edit__image-overlay"
                    onClick={handleOverlayClick}
                >
                    <div className="edit__image-panel edit__image-panel--vertical">
                        {hasUpload && (
                            <div className="edit__image-file-section">
                                <label className="edit__image-file-input">
                                    {uploading ? (
                                        <span className="edit__image-upload-status">
                                            Wird hochgeladen…
                                        </span>
                                    ) : (
                                        <>
                                            <span>Bild wählen</span>
                                            <input
                                                type="file"
                                                accept="image/png,image/jpeg,image/webp"
                                                onChange={handleFileChange}
                                                hidden
                                            />
                                        </>
                                    )}
                                </label>
                            </div>
                        )}

                        {hasUpload && (
                            <div className="edit__image-divider">
                                <span>Oder URL eintragen:</span>
                            </div>
                        )}

                        <div className="edit__image-url-section">
                            <input
                                className="edit__image-input"
                                type="url"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Bild-URL eingeben…"
                                autoFocus={!hasUpload}
                            />
                        </div>

                        {hasAlt && (
                            <div className="edit__image-alt-section">
                                <input
                                    className="edit__image-input edit__image-input--alt"
                                    type="text"
                                    value={altInputValue}
                                    onChange={(e) => setAltInputValue(e.target.value)}
                                    placeholder="Alt-Text (Barrierefreiheit)…"
                                />
                            </div>
                        )}

                        <div className="edit__image-actions">
                            <button className="edit__image-confirm" onClick={commitUrl}>
                                OK
                            </button>
                            <button
                                className="edit__image-cancel"
                                onClick={() => setOpen(false)}
                                aria-label="Abbrechen"
                            >
                                <X size={14} strokeWidth={1.75} aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return { overlayElement, dragProps, openModal };
}
