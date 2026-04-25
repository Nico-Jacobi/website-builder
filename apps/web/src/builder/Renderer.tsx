import { Fragment, type CSSProperties, type ReactNode } from 'react';
import './Renderer.css';
import {
    DndContext,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    closestCenter,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SectionShell } from '../elements/shared/SectionShell';
import { BlockIndexContext, useEditModeActions } from './editModeStore';
import { getModule } from './registry';
import type { BlockSpec, SiteSpec } from './schemas';

const MAX_MATERIALIZE_DEPTH = 32;

/**
 * Renders a SiteSpec into a live React tree.
 *
 * Responsibilities:
 *   1. Apply spec.theme as CSS custom properties on the root wrapper.
 *   2. For each block, look up registry[block.type].
 *   3. Validate block.props with the module's Zod schema.
 *   4. Recurse into any prop that is a BlockSpec[] (so container modules
 *      receive ready-to-render React children, not raw JSON).
 *   5. Render an inline error placeholder on unknown types or invalid props
 *      — errors are visible, never silent.
 */
export default function Renderer({ spec }: { spec: SiteSpec }) {
    const themeStyle = themeToCssVars(spec.theme);
    const { reorderBlocks, removeBlock } = useEditModeActions();

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const sortableIds = spec.blocks.map((b, i) => b.id ?? `idx_${i}`);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const from = sortableIds.indexOf(String(active.id));
        const to = sortableIds.indexOf(String(over.id));
        if (from === -1 || to === -1) return;
        reorderBlocks(from, to);
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                <div className="vertical_layout" style={themeStyle}>
                    {spec.blocks.map((block, i) => {
                        const id = sortableIds[i];
                        return (
                            <BlockIndexContext.Provider key={id} value={i}>
                                <SectionShell
                                    tone={block.tone}
                                    blockId={id}
                                    blockLabel={block.type}
                                    blockIndex={i}
                                    totalBlocks={spec.blocks.length}
                                    onMoveUp={() => reorderBlocks(i, i - 1)}
                                    onMoveDown={() => reorderBlocks(i, i + 1)}
                                    onDelete={() => removeBlock(i)}
                                >
                                    {renderBlock(block, `blocks[${i}]`)}
                                </SectionShell>
                            </BlockIndexContext.Provider>
                        );
                    })}
                </div>
            </SortableContext>
        </DndContext>
    );
}

/** Turns `{ primary: "#f06" }` into `{ "--primary": "#f06" }`. */
function themeToCssVars(theme: SiteSpec['theme']): CSSProperties | undefined {
    if (!theme) return undefined;
    const vars: Record<string, string> = {};
    for (const [key, value] of Object.entries(theme)) {
        vars[`--${key}`] = value;
    }
    return vars as CSSProperties;
}

/** Renders a single block: lookup → validate → recurse children → render. */
function renderBlock(block: BlockSpec, path: string): ReactNode {
    const module = getModule(block.type);
    if (!module) {
        return (
            <ErrorPlaceholder
                title={`Unknown module "${block.type}"`}
                detail={`At ${path}. Known modules are defined in src/builder/registry.ts.`}
            />
        );
    }

    const parsed = module.propsSchema.safeParse(block.props);
    if (!parsed.success) {
        return (
            <ErrorPlaceholder
                title={`Invalid props for "${block.type}"`}
                detail={`At ${path}:\n${formatZodError(parsed.error)}`}
            />
        );
    }

    const finalProps = materializeBlockProps(parsed.data, path, 0) as Record<string, unknown>;

    const Component = module.Component as (props: Record<string, unknown>) => ReactNode;
    return <Component {...finalProps} />;
}

/**
 * Recursively walks a props object. Any array whose items look like
 * BlockSpecs (`{ type: string, props: object }`) is converted into an array
 * of rendered React elements. Other values are left untouched.
 *
 * This is the one place recursion happens — container modules (e.g. a future
 * Section) just declare `children: z.array(BlockSpecSchema)` in their own
 * schema and receive ready-to-render ReactNodes here.
 *
 * Depth is capped as defense-in-depth: JSON can't carry cycles, but a future
 * in-memory editor could accidentally build one. We return the value as-is
 * at max depth instead of stack-overflowing.
 */
function materializeBlockProps(value: unknown, path: string, depth: number): unknown {
    if (depth > MAX_MATERIALIZE_DEPTH) return value;
    if (Array.isArray(value)) {
        if (value.length > 0 && value.every(isBlockSpec)) {
            return value.map((child, i) => (
                <Fragment key={child.id ?? `${path}[${i}]`}>
                    {renderBlock(child, `${path}[${i}]`)}
                </Fragment>
            ));
        }
        return value.map((v, i) => materializeBlockProps(v, `${path}[${i}]`, depth + 1));
    }
    if (value && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
            out[k] = materializeBlockProps(v, `${path}.${k}`, depth + 1);
        }
        return out;
    }
    return value;
}

function isBlockSpec(v: unknown): v is BlockSpec {
    return (
        !!v &&
        typeof v === 'object' &&
        typeof (v as BlockSpec).type === 'string' &&
        typeof (v as BlockSpec).props === 'object' &&
        (v as BlockSpec).props !== null
    );
}

interface ZodIssueLike {
    path: PropertyKey[];
    message: string;
}
interface ZodErrorLike {
    issues?: ZodIssueLike[];
}

function formatZodError(error: ZodErrorLike): string {
    if (error?.issues && Array.isArray(error.issues)) {
        return error.issues
            .map((i) => `  • ${i.path.map(String).join('.') || '(root)'}: ${i.message}`)
            .join('\n');
    }
    return String(error);
}

function ErrorPlaceholder({ title, detail }: { title: string; detail: string }) {
    return (
        <div className="builder__error">
            <strong>{title}</strong>
            <pre>{detail}</pre>
        </div>
    );
}
