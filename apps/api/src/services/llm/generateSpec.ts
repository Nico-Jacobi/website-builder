/**
 * @deprecated generateSpec has been replaced by startGenerationJob (generationJob.ts)
 * and generateLandingAndSitemap (llm/generateLandingAndSitemap.ts).
 *
 * This stub is kept to avoid breaking the llm route import until Plan 03.2
 * replaces the route with the SSE-based generation endpoint.
 */
import type { GenerateCoreResult } from './types';

/** @deprecated Use startGenerationJob instead. Will be removed in Plan 03.2. */
export async function generateSpec(
    _userPrompt: string,
): Promise<GenerateCoreResult> {
    return {
        kind: 'api_error',
        message: 'generateSpec is deprecated — use startGenerationJob',
        log: [],
        trace: null,
    };
}
