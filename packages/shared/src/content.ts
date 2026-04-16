import type { ContentField, ContentFieldType } from './types';

/** One concrete content value extracted from a block's props. */
export interface ContentItem {
    /** Concrete path like "heading" or "cards[0].title" or "columns[1].links[2].label". */
    path: string;
    type: ContentFieldType;
    value: unknown;
}

export interface SplitResult {
    /** Props minus the extracted content fields — the structural JSON stored alongside the block. */
    struct: Record<string, unknown>;
    /** Flat list of extracted content values at concrete paths. */
    content: ContentItem[];
}

/**
 * Splits `props` into `struct` (layout/variant fields) and a flat list of
 * content items. `contentFields` uses wildcard paths like "cards[].title";
 * returned content items use concrete paths like "cards[0].title".
 *
 * `mergeProps(split.struct, split.content)` reproduces the original props
 * (aside from field order within objects).
 */
export function splitProps(
    contentFields: ContentField[],
    props: Record<string, unknown>,
): SplitResult {
    const struct = structuredClone(props);
    const content: ContentItem[] = [];

    for (const field of contentFields) {
        const segments = parseWildcardPath(field.path);
        extractRecursive(struct, segments, '', field.type, content);
    }

    return { struct, content };
}

/**
 * Merges `struct` and a list of content items (with concrete paths, as
 * produced by `splitProps`) back into a complete props object.
 */
export function mergeProps(
    struct: Record<string, unknown>,
    content: ContentItem[],
): Record<string, unknown> {
    const props = structuredClone(struct);
    for (const item of content) {
        setByConcretePath(props, parseConcretePath(item.path), item.value);
    }
    return props;
}

// --- path parsing -----------------------------------------------------------

interface WildcardSegment {
    key: string;
    fanOut: boolean; // true if followed by "[]"
}

function parseWildcardPath(path: string): WildcardSegment[] {
    const segments: WildcardSegment[] = [];
    const regex = /([A-Za-z_][A-Za-z0-9_]*)(\[\])?/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(path)) !== null) {
        segments.push({ key: m[1]!, fanOut: m[2] === '[]' });
    }
    return segments;
}

type ConcreteSegment = string | number;

function parseConcretePath(path: string): ConcreteSegment[] {
    const segments: ConcreteSegment[] = [];
    const regex = /([A-Za-z_][A-Za-z0-9_]*)|\[(\d+)\]/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(path)) !== null) {
        if (m[1] !== undefined) segments.push(m[1]);
        else if (m[2] !== undefined) segments.push(Number(m[2]));
    }
    return segments;
}

// --- split -----------------------------------------------------------------

function extractRecursive(
    obj: unknown,
    segments: WildcardSegment[],
    prefix: string,
    type: ContentFieldType,
    out: ContentItem[],
): void {
    if (segments.length === 0) return;
    if (obj === null || typeof obj !== 'object') return;

    const head = segments[0]!;
    const rest = segments.slice(1);
    const container = obj as Record<string, unknown>;
    const basePath = prefix ? `${prefix}.${head.key}` : head.key;

    if (head.fanOut) {
        const arr = container[head.key];
        if (!Array.isArray(arr)) return;
        for (let i = 0; i < arr.length; i++) {
            extractRecursive(arr[i], rest, `${basePath}[${i}]`, type, out);
        }
        return;
    }

    if (rest.length === 0) {
        if (head.key in container) {
            out.push({ path: basePath, type, value: container[head.key] });
            delete container[head.key];
        }
        return;
    }

    extractRecursive(container[head.key], rest, basePath, type, out);
}

// --- merge -----------------------------------------------------------------

function setByConcretePath(
    root: Record<string, unknown>,
    segments: ConcreteSegment[],
    value: unknown,
): void {
    if (segments.length === 0) return;
    let cur: Record<string, unknown> | unknown[] = root;
    for (let i = 0; i < segments.length - 1; i++) {
        const seg = segments[i]!;
        const next = segments[i + 1]!;
        const cursor = cur as Record<string | number, unknown>;
        const existing = cursor[seg];
        if (existing === undefined || existing === null || typeof existing !== 'object') {
            cursor[seg] = typeof next === 'number' ? [] : {};
        }
        cur = cursor[seg] as Record<string, unknown> | unknown[];
    }
    (cur as Record<string | number, unknown>)[segments[segments.length - 1]!] = value;
}
