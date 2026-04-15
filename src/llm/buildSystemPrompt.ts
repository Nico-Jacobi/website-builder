import type { RegistryLLMSurface } from '../builder/types';

/**
 * Assembles the system instruction sent to the LLM.
 *
 * The prompt has three sections:
 *   1. Role + task ("you are a web-design assistant…").
 *   2. Constraint list + theme-token guidance.
 *   3. Module reference: each registered module's meta + its full
 *      propsJSONSchema, pretty-printed.
 *
 * The per-module props schemas live here as reference material so the
 * model can fill block.props correctly. If the model still produces bad
 * props, validateSpecAgainstRegistry catches it downstream — this prompt
 * is the optimistic side of that contract.
 */
export function buildSystemPrompt(surface: RegistryLLMSurface): string {
    const modulesSection = surface.modules
        .map((m) => {
            const tagsLine = m.tags ? `\n**Tags:** ${m.tags.join(', ')}` : '';
            return [
                `### \`${m.name}\` (category: ${m.category})`,
                m.description + tagsLine,
                '',
                '**Props JSON Schema:**',
                '```json',
                JSON.stringify(m.propsJSONSchema, null, 2),
                '```',
            ].join('\n');
        })
        .join('\n\n');

    const siteSpecSchemaBlock = [
        '```json',
        JSON.stringify(surface.siteSpecJSONSchema, null, 2),
        '```',
    ].join('\n');

    return [
        'You are a web-design assistant that turns a short user brief',
        'into a structured JSON spec for a website. The spec is rendered',
        'verbatim by a data-driven site builder, so every field must be',
        'valid per the schemas below.',
        '',
        '## Rules',
        '',
        '1. Respond with a single JSON object that matches the outer shape below. Output only the JSON — no prose, no markdown fences, no commentary.',
        '2. Use ONLY the modules listed below. Unknown module names are rejected.',
        '3. The outer spec shape is:',
        '',
        siteSpecSchemaBlock,
        '',
        '4. Fill `props` per block according to that module\'s Props JSON Schema (see module reference).',
        '5. The first block is typically `Header` and the last is typically `Footer` or `FooterSimple`. Between them, build a coherent landing-page narrative.',
        '6. Use `Container` for grouping only when a section clearly needs a distinct background or max-width. Max ONE level of nesting — do not put Containers inside Containers.',
        '7. Header `links` may point to other pages that do not yet exist — dead hrefs like `"#about"` are fine.',
        '',
        '## Theme',
        '',
        'Optionally set `spec.theme` to override CSS variables. Recognised keys:',
        '`primary`, `secondary`, `accent`, `alt_primary`, `alt_secondary`,',
        '`background`, `surface`, `text`, `muted_text`, `inverted_text`.',
        'Values must be valid CSS colours (`#hex`, `rgb(…)`, `hsl(…)`).',
        'Pick a palette that matches the user\'s brief — warm, cool, minimal, etc.',
        '',
        '## Available modules',
        '',
        modulesSection,
    ].join('\n');
}
