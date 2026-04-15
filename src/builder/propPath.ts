/**
 * Immutable nested prop updates by string path.
 *
 * Path grammar (matches what editor hooks emit):
 *   'heading'
 *   'cards[0].title'
 *   'columns[1].links[0].label'
 *
 * Used by EditModeContext.updateBlock to patch a single field inside a
 * block's props without mutating the spec.
 */

export function setNestedProp(
    obj: Record<string, unknown>,
    path: string,
    value: unknown,
): Record<string, unknown> {
    const keys = parsePath(path);
    return setIn(obj, keys, value) as Record<string, unknown>;
}

export function parsePath(path: string): (string | number)[] {
    return path
        .split(/\.|\[(\d+)\]/)
        .filter(Boolean)
        .map((k) => (/^\d+$/.test(k) ? parseInt(k, 10) : k));
}

function setIn(obj: unknown, keys: (string | number)[], value: unknown): unknown {
    if (keys.length === 0) return value;
    const [head, ...tail] = keys;
    if (Array.isArray(obj)) {
        const copy = obj.slice();
        copy[head as number] = setIn(copy[head as number], tail, value);
        return copy;
    }
    const src = (obj ?? {}) as Record<string, unknown>;
    return { ...src, [head]: setIn(src[head], tail, value) };
}
