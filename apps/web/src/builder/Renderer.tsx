import { Fragment, useContext, type CSSProperties, type ReactNode } from 'react';
import './Renderer.css';
import {
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { SectionShell } from '../elements/shared/SectionShell';
import { BlockIndexContext, useEditModeActions } from './editModeStore';
import { BlockTargetContext } from './blockTarget';
import { ChromeActionsGuard } from './EditModeContext';
import { DropIndicatorContext, PaletteModuleTypeContext } from './EditorDndProvider';
import { getModule } from './registry';
import type { BlockSpec, SiteSpec } from './schemas';

const MAX_MATERIALIZE_DEPTH = 32;

/**
 * Renders a SiteSpec into a live React tree.
 *
 * Responsibilities:
 *   1. Apply spec.theme as CSS custom properties on the root wrapper.
 *   2. Render chrome.header (if present) above the page-block area.
 *   3. For each page block, look up registry[block.type].
 *   4. Validate block.props with the module's Zod schema.
 *   5. Recurse into any prop that is a BlockSpec[] (so container modules
 *      receive ready-to-render React children, not raw JSON).
 *   6. Render chrome.footer (if present) below the page-block area.
 *   7. Render an inline error placeholder on unknown types or invalid props
 *      — errors are visible, never silent.
 *
 * Chrome blocks (header/footer) are rendered outside SortableContext but inside
 * DndContext — they are site-wide and not user-reorderable. Each block (chrome
 * or page) receives a BlockTargetContext.Provider so that Plan 05
 * (EditModeContext) can distinguish between chrome-ops and page-block-ops.
 */
export default function Renderer({ spec }: { spec: SiteSpec }) {
    const themeStyle = themeToCssVars(spec.theme);
    const { reorderBlocks, removeBlock } = useEditModeActions();

    const paletteModuleType = useContext(PaletteModuleTypeContext);
    const dropIndicator = useContext(DropIndicatorContext);

    // Compute where to render the ghost block preview (null = not dragging from palette).
    let ghostIndex: number | null = null;
    if (paletteModuleType && dropIndicator) {
        ghostIndex = dropIndicator.position === 'before'
            ? dropIndicator.blockIndex
            : dropIndicator.blockIndex + 1;
    }

    const sortableIds = spec.blocks.map((b, i) => b.id ?? `idx_${i}`);
    const { setNodeRef: setCanvasRef } = useDroppable({ id: 'canvas-drop-zone' });

    return (
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            <div ref={setCanvasRef} className="vertical_layout" style={themeStyle}>
                {/* Chrome header — outside sortable items, site-wide, no move/delete */}
                {spec.chrome?.header && (
                    <BlockTargetContext.Provider value={{ kind: 'chrome', position: 'header' }}>
                        <ChromeActionsGuard>
                            <div data-chrome-section="header">
                                <SectionShell tone={spec.chrome.header.tone}>
                                    {renderBlock(spec.chrome.header, 'chrome.header')}
                                </SectionShell>
                            </div>
                        </ChromeActionsGuard>
                    </BlockTargetContext.Provider>
                )}

                {/* Page blocks — sortable via DnD */}
                {spec.blocks.flatMap((block, i) => {
                    const id = sortableIds[i];
                    const blockEl = (
                        <BlockTargetContext.Provider key={id} value={{ kind: 'page', index: i }}>
                            <BlockIndexContext.Provider value={i}>
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
                        </BlockTargetContext.Provider>
                    );

                    if (ghostIndex === i) {
                        return [
                            <GhostBlock key="__palette_ghost__" moduleType={paletteModuleType!} />,
                            blockEl,
                        ];
                    }
                    return [blockEl];
                })}

                {/* Ghost at the end when dropping after the last block */}
                {ghostIndex === spec.blocks.length && (
                    <GhostBlock key="__palette_ghost__" moduleType={paletteModuleType!} />
                )}

                {/* Chrome footer — outside sortable items, site-wide, no move/delete */}
                {spec.chrome?.footer && (
                    <BlockTargetContext.Provider value={{ kind: 'chrome', position: 'footer' }}>
                        <ChromeActionsGuard>
                            <div data-chrome-section="footer">
                                <SectionShell tone={spec.chrome.footer.tone}>
                                    {renderBlock(spec.chrome.footer, 'chrome.footer')}
                                </SectionShell>
                            </div>
                        </ChromeActionsGuard>
                    </BlockTargetContext.Provider>
                )}
            </div>
        </SortableContext>
    );
}

function GhostBlock({ moduleType }: { moduleType: string }) {
    const module = getModule(moduleType);
    if (!module) return null;
    return (
        // inert makes the entire subtree non-interactive (no clicks, focus, pointer events)
        <div className="renderer__ghost-block" aria-hidden="true" inert>
            {renderBlock({ type: moduleType, props: module.defaults as Record<string, unknown> }, '__ghost__')}
        </div>
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
