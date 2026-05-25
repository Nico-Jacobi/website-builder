import './Map.css';
import { useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { MapPin } from 'lucide-react';
import { useEditableText } from '../../../builder/useEditableText';
import { useEditableField } from '../../../builder/useEditableField';
import { useEditModeState } from '../../../builder/editModeStore';
import type { MapProps } from '@website-builder/shared';

export default function Map({ location, heading, height = 'md' }: MapProps) {
    const headingEdit = useEditableText('heading');
    const { isEditMode } = useEditModeState();
    const { commit } = useEditableField('location');
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState(location);

    const src = `https://maps.google.com/maps?q=${encodeURIComponent(location)}&output=embed&hl=en`;

    function openPopover() {
        setDraft(location);
        setOpen(true);
    }

    function confirmEdit() {
        const trimmed = draft.trim();
        if (trimmed && trimmed !== location) commit(trimmed);
        setOpen(false);
    }

    function handleKey(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') { e.preventDefault(); confirmEdit(); }
        if (e.key === 'Escape') setOpen(false);
    }

    function handleOverlay(e: MouseEvent) {
        if ((e.target as HTMLElement).classList.contains('map__edit-overlay')) setOpen(false);
    }

    return (
        <div className={`section map map--${height}`}>
            {heading && (
                <h2 className="map__heading" {...headingEdit}>{heading}</h2>
            )}
            <div className="map__edit-wrap">
                <iframe
                    className="map__frame"
                    src={src}
                    title={location}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                />
                {isEditMode && (
                    <button className="map__edit-btn" type="button" onClick={openPopover}>
                        <MapPin size={13} />
                        Change location
                    </button>
                )}
            </div>
            {open && (
                <div className="map__edit-overlay" onClick={handleOverlay}>
                    <div className="map__edit-popover">
                        <span className="map__edit-label">Location search term</span>
                        <input
                            className="map__edit-input"
                            type="text"
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={handleKey}
                            placeholder="e.g. Eiffel Tower, Paris"
                            autoFocus
                        />
                        <div className="map__edit-actions">
                            <button className="edit__image-cancel" type="button" onClick={() => setOpen(false)}>Cancel</button>
                            <button className="edit__image-confirm" type="button" onClick={confirmEdit}>Apply</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
