import './BlockOverlay.css';
import { forwardRef, type CSSProperties } from 'react';
import { GripVertical, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';

interface BlockOverlayProps {
    label: string;
    canMoveUp: boolean;
    canMoveDown: boolean;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onDelete: () => void;
    dragListeners?: Record<string, unknown>;
    dragAttributes?: Record<string, unknown>;
    style?: CSSProperties;
}

/**
 * Per-block editor toolbar shown on hover in Edit-Mode.
 *
 * Pure presentation: all interactivity is wired by the parent (SectionShell),
 * which also owns the @dnd-kit/sortable integration. The overlay is positioned
 * absolutely relative to its SectionShell wrapper and uses only `--ui_*` chrome
 * tokens — never module tokens — so the editor's appearance stays decoupled
 * from the generated site's theme.
 */
export const BlockOverlay = forwardRef<HTMLDivElement, BlockOverlayProps>(function BlockOverlay(
    {
        label,
        canMoveUp,
        canMoveDown,
        onMoveUp,
        onMoveDown,
        onDelete,
        dragListeners,
        dragAttributes,
        style,
    },
    ref,
) {
    return (
        <div ref={ref} className="block-overlay" style={style} data-edit-only="">
            <button
                type="button"
                className="block-overlay__handle"
                aria-label={`Block ${label} verschieben`}
                {...dragAttributes}
                {...dragListeners}
            >
                <GripVertical size={16} aria-hidden="true" />
            </button>
            <span className="block-overlay__label">{label}</span>
            <div className="block-overlay__actions">
                <button
                    type="button"
                    className="block-overlay__btn"
                    aria-label="Block nach oben"
                    onClick={onMoveUp}
                    disabled={!canMoveUp}
                >
                    <ArrowUp size={14} aria-hidden="true" />
                </button>
                <button
                    type="button"
                    className="block-overlay__btn"
                    aria-label="Block nach unten"
                    onClick={onMoveDown}
                    disabled={!canMoveDown}
                >
                    <ArrowDown size={14} aria-hidden="true" />
                </button>
                <button
                    type="button"
                    className="block-overlay__btn block-overlay__btn--danger"
                    aria-label="Block löschen"
                    onClick={onDelete}
                >
                    <Trash2 size={14} aria-hidden="true" />
                </button>
            </div>
        </div>
    );
});
