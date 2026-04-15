import { getModule } from './registry';
import { ensureBlockIds } from './blockIds';
import type { BlockSpec, SiteSpec } from './schemas';

/**
 * Builds a SiteSpec from a list of module type names. Each block gets that
 * module's `defaults` as starter props. Unknown types are skipped with a
 * console warning — they'd render as error placeholders anyway, and filtering
 * here keeps the demo tidy.
 *
 * Returned spec already has stable block IDs assigned.
 */
export function specFromTypes(types: string[], theme?: SiteSpec['theme']): SiteSpec {
    const blocks: BlockSpec[] = [];
    for (const type of types) {
        const module = getModule(type);
        if (!module) {
            console.warn(`specFromTypes: unknown module "${type}" — skipped`);
            continue;
        }
        blocks.push({ type, props: { ...(module.defaults as object) } });
    }
    return ensureBlockIds({ theme, blocks });
}
