import './EditModeToolbar.css';
import { useEditModeState, useEditModeActions } from './editModeStore';

/**
 * Schwebende Toolbar zum Umschalten des Edit Modes.
 *
 * TEMPORÄR — wird später durch Auth/Login ersetzt.
 * Entfernen: `<EditModeToolbar />` aus App.tsx und diesen Import löschen.
 * Keine andere Datei kennt diese Komponente.
 */
export function EditModeToolbar() {
    const { isEditMode } = useEditModeState();
    const { setIsEditMode } = useEditModeActions();

    return (
        <div className="edit-toolbar">
            <button
                className={`edit-toolbar__btn${isEditMode ? ' edit-toolbar__btn--active' : ''}`}
                onClick={() => setIsEditMode(!isEditMode)}
            >
                {isEditMode ? 'Fertig' : 'Bearbeiten'}
            </button>
        </div>
    );
}
