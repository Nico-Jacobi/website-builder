/**
 * Run `worker` over every item in `items`, keeping at most `max` calls in-flight
 * at any time. Failures are captured per-item — one failed item never blocks the others.
 */
export async function withLimit<T, R>(
    max: number,
    items: T[],
    worker: (item: T, index: number) => Promise<R>,
): Promise<Array<{ ok: true; value: R } | { ok: false; error: unknown }>> {
    const results: Array<{ ok: true; value: R } | { ok: false; error: unknown }> = new Array(
        items.length,
    );
    let nextIndex = 0;

    async function loop(): Promise<void> {
        while (true) {
            const i = nextIndex++;
            if (i >= items.length) return;
            try {
                results[i] = { ok: true, value: await worker(items[i]!, i) };
            } catch (error) {
                results[i] = { ok: false, error };
            }
        }
    }

    await Promise.all(Array.from({ length: Math.min(max, items.length) }, loop));
    return results;
}
