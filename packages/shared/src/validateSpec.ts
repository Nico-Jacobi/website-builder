import type { ZodIssue } from 'zod';
import { SiteSpecSchema, type BlockSpec, type SiteSpec } from './schemas';
import { getSharedModule } from './modules/index';

/** Single validation failure. `path` is a dotted/indexed JSON pointer. */
export interface SpecError {
    path: string;
    message: string;
    /** Full Zod issue list when the failure came from Zod. Optional. */
    raw?: ZodIssue[];
}

export type ValidateResult =
    | { ok: true;  spec: SiteSpec }
    | { ok: false; errors: SpecError[] };

/**
 * Full-spec validator used as the trust boundary between an unvalidated
 * source (LLM output, imported JSON) and the renderer.
 *
 * Runs in two passes:
 *   1. SiteSpecSchema.safeParse — shape only (blocks is array of
 *      BlockSpec, theme is Record<string,string>, etc.). No registry.
 *   2. For each block, look up registry[block.type] and run
 *      module.propsSchema.safeParse on its props. Recurses into any
 *      array prop whose items look like BlockSpecs.
 *
 * Returns all failures at once — does not stop at the first error —
 * so callers can show a complete report instead of a drip of fixes.
 */
export function validateSpecAgainstRegistry(input: unknown): ValidateResult {
    const shape = SiteSpecSchema.safeParse(input);
    if (!shape.success) {
        return { ok: false, errors: zodIssuesToSpecErrors('', shape.error.issues) };
    }

    const errors: SpecError[] = [];
    shape.data.blocks.forEach((block, i) => {
        validateBlock(block, `blocks[${i}]`, errors);
    });

    // Validate chrome blocks if present
    if (shape.data.chrome?.header) {
        validateBlock(shape.data.chrome.header, 'chrome.header', errors);
    }
    if (shape.data.chrome?.footer) {
        validateBlock(shape.data.chrome.footer, 'chrome.footer', errors);
    }

    if (errors.length > 0) return { ok: false, errors };
    return { ok: true, spec: shape.data };
}

function validateBlock(block: BlockSpec, path: string, errors: SpecError[]): void {
    const module = getSharedModule(block.type);
    if (!module) {
        errors.push({
            path,
            message: `Unknown module "${block.type}". Known modules are registered in packages/shared/src/modules/index.ts.`,
        });
        return;
    }

    const parsed = module.propsSchema.safeParse(block.props);
    if (!parsed.success) {
        errors.push(...zodIssuesToSpecErrors(`${path}.props`, parsed.error.issues, parsed.error.issues));
        return;
    }

    // Recurse into any array prop whose items are BlockSpecs.
    for (const [key, value] of Object.entries(block.props)) {
        if (Array.isArray(value)) {
            value.forEach((child, i) => {
                if (isBlockSpec(child)) {
                    validateBlock(child, `${path}.props.${key}[${i}]`, errors);
                }
            });
        }
    }
}

function zodIssuesToSpecErrors(
    basePath: string,
    issues: ZodIssue[],
    raw?: ZodIssue[],
): SpecError[] {
    return issues.map((issue) => ({
        path: joinPath(basePath, issue.path.map(String).join('.')),
        message: issue.message,
        ...(raw ? { raw } : {}),
    }));
}

function joinPath(a: string, b: string): string {
    if (!a) return b;
    if (!b) return a;
    return `${a}.${b}`;
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
