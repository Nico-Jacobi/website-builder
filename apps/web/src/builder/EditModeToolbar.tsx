import { useEffect, useState } from 'react';
import './EditModeToolbar.css';
import { useEditModeState, useEditModeActions, useAutoSave } from './editModeStore';
import type { SaveStatus } from './autoSaveTypes';

/**
 * Schwebende Toolbar zum Umschalten des Edit Modes.
 *
 * TEMPORÄR — wird später durch Auth/Login ersetzt.
 * Entfernen: `<EditModeToolbar />` aus App.tsx und diesen Import löschen.
 * Keine andere Datei kennt diese Komponente.
 */

const STATUS_LABELS: Record<SaveStatus, string> = {
    idle:   '',
    saving: 'Speichert\u2026',
    saved:  'Gespeichert',
    error:  'Fehler \u2014 erneut versuchen',
};

export function EditModeToolbar() {
    const { isEditMode } = useEditModeState();
    const { setIsEditMode } = useEditModeActions();
    const autoSave = useAutoSave();

    const [saveStatus, setSaveStatus] = useState<SaveStatus>(
        () => autoSave?.getStatus() ?? 'idle',
    );

    useEffect(() => {
        if (!autoSave) return;
        setSaveStatus(autoSave.getStatus());
        return autoSave.subscribe(setSaveStatus);
    }, [autoSave]);

    const statusLabel = isEditMode ? STATUS_LABELS[saveStatus] : '';

    return (
        <div className="edit-toolbar">
            {statusLabel && (
                <span
                    className={`edit-toolbar__status edit-toolbar__status--${saveStatus}`}
                    role="status"
                    aria-live="polite"
                >
                    {statusLabel}
                </span>
            )}
            <button
                className={`edit-toolbar__btn${isEditMode ? ' edit-toolbar__btn--active' : ''}`}
                onClick={() => setIsEditMode(!isEditMode)}
            >
                {isEditMode ? 'Fertig' : 'Bearbeiten'}
            </button>
        </div>
    );
}
