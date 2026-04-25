import './SectionShell.css';
import type { CSSProperties, ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Tone } from '@website-builder/shared';
import { useEditModeState } from '../../builder/editModeStore';
import { BlockOverlay } from '../../builder/BlockOverlay';

interface SectionShellProps {
    tone?: Tone;
    /** Stable block id — required to make this shell a DnD-sortable item. */
    blockId?: string;
    /** Human-readable label used in the overlay header (currently block.type). */
    blockLabel?: string;
    /** Position of this block inside spec.blocks. */
    blockIndex?: number;
    /** Total number of top-level blocks — drives the ↑/↓ disabled state. */
    totalBlocks?: number;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    onDelete?: () => void;
    children: ReactNode;
}

/**
 * Thin layout wrapper that applies a visual background and text color
 * based on the block's `tone` field from the SiteSpec.
 *
 * When `tone` is undefined, the shell renders as a transparent pass-through
 * with no background or color override — the module manages its own styling.
 *
 * Padding is NOT set here — each module controls its own vertical spacing
 * via its CSS (typically through the shared .section class in App.css).
 *
 * In Edit-Mode, when all of `blockId`, `blockLabel`, `blockIndex`,
 * `totalBlocks`, `onMoveUp`, `onMoveDown`, `onDelete` are provided, the shell
 * becomes a @dnd-kit/sortable item and renders a {@link BlockOverlay} toolbar
 * with drag handle, ↑/↓ reorder buttons and a delete button. Outside Edit-Mode
 * the shell is a plain `<div>` with the `data-tone` attribute — identical to
 * the pre-DnD behavior.
 */
export function SectionShell({
    tone,
    blockId,
    blockLabel,
    blockIndex,
    totalBlocks,
    onMoveUp,
    onMoveDown,
    onDelete,
    children,
}: SectionShellProps) {
    const { isEditMode } = useEditModeState();
    const sortable = useSortable({
        id: blockId ?? '__static__',
        disabled: !isEditMode || !blockId,
    });

    const showOverlay =
        isEditMode &&
        !!blockId &&
        !!blockLabel &&
        !!onMoveUp &&
        !!onMoveDown &&
        !!onDelete &&
        blockIndex !== undefined &&
        totalBlocks !== undefined;

    const style: CSSProperties = {
        position: 'relative',
        transform: sortable.transform ? CSS.Transform.toString(sortable.transform) : undefined,
        transition: sortable.transition,
        opacity: sortable.isDragging ? 0.4 : 1,
    };

    return (
        <div
            ref={sortable.setNodeRef}
            className="block-overlay__wrapper"
            data-tone={tone ?? undefined}
            data-dragging={sortable.isDragging ? 'true' : undefined}
            style={style}
        >
            {showOverlay && (
                <BlockOverlay
                    label={blockLabel!}
                    canMoveUp={blockIndex! > 0}
                    canMoveDown={blockIndex! < totalBlocks! - 1}
                    onMoveUp={onMoveUp!}
                    onMoveDown={onMoveDown!}
                    onDelete={onDelete!}
                    dragListeners={sortable.listeners as Record<string, unknown> | undefined}
                    dragAttributes={sortable.attributes as unknown as Record<string, unknown>}
                />
            )}
            {children}
        </div>
    );
}
