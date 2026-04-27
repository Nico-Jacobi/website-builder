import type { BlockSpec, SiteSpec } from './schemas';

/**
 * Walks a spec and assigns a stable `id` to every block (and every nested
 * BlockSpec inside child arrays) that doesn't already have one. Pure: returns
 * a new spec, leaves the input untouched.
 *
 * Also walks `spec.chrome.header` and `spec.chrome.footer` so that chrome
 * blocks get stable IDs too — required for Edit-Mode selection (Plan 05).
 *
 * Stable IDs are what keep edit-mode state (focus, local form values) intact
 * when blocks are reordered, inserted, or deleted. Without them, React keys
 * collapse to array indices and component state shifts with position.
 */
export function ensureBlockIds(spec: SiteSpec): SiteSpec {
    return {
        ...spec,
        chrome: spec.chrome
            ? {
                  header: spec.chrome.header
                      ? ensureBlockIdsDeep(spec.chrome.header)
                      : undefined,
                  footer: spec.chrome.footer
                      ? ensureBlockIdsDeep(spec.chrome.footer)
                      : undefined,
              }
            : undefined,
        blocks: spec.blocks.map(ensureBlockIdsDeep),
    };
}

function ensureBlockIdsDeep(block: BlockSpec): BlockSpec {
    const id = block.id ?? newId();
    const props = walkProps(block.props) as Record<string, unknown>;
    return { ...block, id, props };
}

function walkProps(value: unknown): unknown {
    if (Array.isArray(value)) {
        if (value.length > 0 && value.every(isBlockSpec)) {
            return value.map(ensureBlockIdsDeep);
        }
        return value.map(walkProps);
    }
    if (value && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
            out[k] = walkProps(v);
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

let counter = 0;
function newId(): string {
    counter += 1;
    return `b_${Date.now().toString(36)}_${counter.toString(36)}`;
}
