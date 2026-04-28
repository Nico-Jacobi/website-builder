import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    closestCenter,
    pointerWithin,
    type CollisionDetection,
    type DragEndEvent,
    type DragOverEvent,
    type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useEditModeActions } from './editModeStore';
import { getModuleIcon } from './iconMap';
import { getModule } from './registry';

// ── DropIndicator ─────────────────────────────────────────────────────────────

export interface DropIndicator {
    blockIndex: number;
    position: 'before' | 'after';
}

export const DropIndicatorContext = createContext<DropIndicator | null>(null);

/** Active module type while dragging from the palette (null otherwise). */
export const PaletteModuleTypeContext = createContext<string | null>(null);

export function useDropIndicator(blockIndex: number): { isBefore: boolean; isAfter: boolean } {
    const indicator = useContext(DropIndicatorContext);
    const paletteModuleType = useContext(PaletteModuleTypeContext);

    // Ghost block handles the visual indicator during palette drags — suppress 2px lines.
    if (paletteModuleType) return { isBefore: false, isAfter: false };

    return {
        isBefore: indicator !== null && indicator.blockIndex === blockIndex && indicator.position === 'before',
        isAfter:  indicator !== null && indicator.blockIndex === blockIndex && indicator.position === 'after',
    };
}

// ── PaletteDragOverlay ────────────────────────────────────────────────────────

function PaletteDragOverlay({ moduleType }: { moduleType: string | null }) {
    const module = moduleType ? getModule(moduleType) : undefined;
    const Icon = module ? getModuleIcon(module.meta) : null;

    return (
        <DragOverlay dropAnimation={null}>
            {module && Icon ? (
                <div className="module-palette__card module-palette__card--ghost">
                    <Icon size={16} className="module-palette__icon" aria-hidden="true" />
                    <span className="module-palette__card-name">{module.meta.name}</span>
                </div>
            ) : null}
        </DragOverlay>
    );
}

// ── EditorDndProvider ─────────────────────────────────────────────────────────

export function EditorDndProvider({ children }: { children: ReactNode }) {
    const { reorderBlocks, addBlock } = useEditModeActions();
    const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null);
    const [activeModuleType, setActiveModuleType] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    // Palette items: use pointerWithin so the pointer must be inside a droppable rect.
    // canvas-drop-zone overlaps with every sortable block, so prefer specific blocks first —
    // only fall back to canvas-drop-zone when no block is under the pointer (empty canvas).
    // Sortable reorder keeps closestCenter (works better across block gaps).
    const collisionDetection = useCallback<CollisionDetection>((args) => {
        const activeData = args.active.data.current as Record<string, unknown> | undefined;
        if (activeData?.type === 'palette') {
            const hits = pointerWithin(args);
            const blockHit = hits.find(c => c.id !== 'canvas-drop-zone');
            if (blockHit) return [blockHit];
            const canvasHit = hits.find(c => c.id === 'canvas-drop-zone');
            if (canvasHit) return [canvasHit];
            return [];
        }
        return closestCenter(args);
    }, []);

    const handleDragStart = (event: DragStartEvent) => {
        const data = event.active.data.current as Record<string, unknown> | undefined;
        if (data?.type === 'palette') {
            setActiveModuleType(data.moduleType as string);
        } else {
            setActiveModuleType(null);
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        const activeData = active.data.current as Record<string, unknown> | undefined;
        if (activeData?.type !== 'palette') return;
        if (!over) { setDropIndicator(null); return; }

        const blockIndex = (over.data.current?.sortable as Record<string, unknown> | undefined)?.index as number | undefined;
        if (blockIndex === undefined) { setDropIndicator(null); return; }

        // Use active.rect.current.translated for current drag position
        const translated = active.rect.current.translated as { top: number; height: number } | null;
        const draggedTop    = translated?.top ?? 0;
        const draggedHeight = translated?.height ?? 0;
        const draggedMidY   = draggedTop + draggedHeight / 2;

        const overRect = over.rect as { top: number; height: number };
        const overMidY = overRect.top + overRect.height / 2;

        const position: 'before' | 'after' = draggedMidY < overMidY ? 'before' : 'after';
        setDropIndicator({ blockIndex, position });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const savedIndicator = dropIndicator;
        setDropIndicator(null);
        setActiveModuleType(null);

        const { active, over } = event;
        const activeData = active.data.current as Record<string, unknown> | undefined;

        if (activeData?.type === 'palette') {
            const moduleType = activeData.moduleType as string;

            // Dropped outside any droppable (e.g. back into palette) — discard.
            if (!over) return;

            const blockIndex = (over.data.current?.sortable as Record<string, unknown> | undefined)?.index as number | undefined;
            if (blockIndex !== undefined) {
                // Dropped on a specific sortable block — insert at computed position.
                const insertIndex = savedIndicator?.position === 'before' ? blockIndex : blockIndex + 1;
                addBlock(moduleType, insertIndex);
            } else if (over.id === 'canvas-drop-zone') {
                // Dropped on the canvas background (no specific block) — append at end.
                addBlock(moduleType);
            }
            // Any other over target (e.g. palette items) — discard.
            return;
        }

        // Sortable-Reorder: Index directly from useSortable data
        if (!over || active.id === over.id) return;
        const fromIndex = (active.data.current?.sortable as Record<string, unknown> | undefined)?.index as number | undefined;
        const toIndex   = (over.data.current?.sortable as Record<string, unknown> | undefined)?.index   as number | undefined;
        if (fromIndex === undefined || toIndex === undefined) return;
        reorderBlocks(fromIndex, toIndex);
    };

    const handleDragCancel = () => {
        setDropIndicator(null);
        setActiveModuleType(null);
    };

    return (
        <DropIndicatorContext.Provider value={dropIndicator}>
            <DndContext
                sensors={sensors}
                collisionDetection={collisionDetection}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
            >
                <PaletteModuleTypeContext.Provider value={activeModuleType}>
                    {children}
                </PaletteModuleTypeContext.Provider>
                <PaletteDragOverlay moduleType={activeModuleType} />
            </DndContext>
        </DropIndicatorContext.Provider>
    );
}
