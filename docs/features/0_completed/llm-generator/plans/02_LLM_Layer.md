# LLM Generator — Plan 02: LLM Layer

## Übersicht

| Aspekt | Details |
|--------|---------|
| **Ziel** | `src/llm/` anlegen: Anthropic-Client (lazy init), System-Prompt-Builder, `generateSpec()`-Orchestrator, `GenerateResult`-Typen. Plus Unit-Tests mit gemocktem SDK. Rein additiv, keine Existenzänderungen. |
| **Abhängig von** | Plan 01 (SDK installiert, Env-Infra steht) |
| **Betroffene Bereiche** | Shared (`src/llm/`) |
| **Geschätzte Komplexität** | Mittel |

### Größen-Check

| Metrik | Wert | Schwellwert | OK? |
|--------|------|-------------|-----|
| Implementierungsschritte | 6 | >8 | ✓ |
| Neue Dateien | 4 (Tests zählen nicht) | >5 | ✓ |
| Zu ändernde Dateien | 0 | >10 | ✓ |

## Schnittstellen (Kohärenz-Vertrag)

### Inputs

| Von Plan | Was wird erwartet | Konkret |
|----------|-------------------|---------|
| Plan 01 | SDK installiert, Env-Var-Infra | `import Anthropic from '@anthropic-ai/sdk'` funktioniert; `import.meta.env.VITE_ANTHROPIC_API_KEY` auslesbar |
| (llm-foundation) | Registry LLM Surface + Validator | `getRegistryLLMSurface()` aus `src/builder/registry.ts`; `validateSpecAgainstRegistry` aus `src/builder/validateSpec.ts`; `SiteSpec`/`SpecError`-Typen |

### Outputs

| Für Plan | Was wird geliefert |
|----------|---------------------|
| Plan 03 | `generateSpec(prompt: string): Promise<GenerateResult>` aus `src/llm/generateSpec.ts` — einziger Entry-Point für die UI |
| Plan 03 | `GenerateResult` als diskriminierte Union mit 5 Kinds — UI muss alle fünf handlen |

### Architektur-Entscheidungen

- **Client lazy, einmal, als Modul-Singleton:** `getClient()` in `client.ts` merkt sich die Instance, prüft `import.meta.env.VITE_ANTHROPIC_API_KEY` genau einmal, gibt `Anthropic | null` zurück. Spart Re-Instanzierung, liefert klaren `null`-Pfad bei fehlendem Key.
- **`generateSpec` kennt keine UI-Konzepte:** nimmt `prompt: string`, gibt `Promise<GenerateResult>`. Keine React-Hooks, keine Toasts, kein `console.log`. UI (Plan 03) übernimmt das Rendering.
- **`buildSystemPrompt` ist pur:** nimmt `RegistryLLMSurface`, gibt `string`. Einfach testbar.
- **Tool-Use-Forcing:** `tool_choice: { type: 'tool', name: 'emit_site_spec' }`. Garantiert, dass der Response einen `tool_use`-Block enthält. `no_tool_use`-Kind ist Defense-in-Depth.
- **Keine Retries:** wenn Claude Unsinn liefert, bekommt der User die Fehler und kann erneut tippen. One-shot.
- **Tests mocken den Client über Dependency-Injection:** `generateSpec(prompt, options?)` akzeptiert ein optionales `{ client?, surface? }`-Overload. Produktion nutzt Defaults, Tests injizieren Mocks. Keine Module-Level-Mocking-Gymnastik.

## Voraussetzungen

- [ ] Plan 01 abgeschlossen.
- [ ] `getRegistryLLMSurface()` funktioniert (aus `llm-foundation`).
- [ ] `validateSpecAgainstRegistry()` funktioniert (aus `llm-foundation`).

## Betroffene Dateien

### Neue Dateien

| Datei | Beschreibung |
|-------|--------------|
| `src/llm/client.ts` | `getClient(): Anthropic \| null` — lazy Singleton. Prüft `VITE_ANTHROPIC_API_KEY`, returnt `null` bei Abwesenheit. |
| `src/llm/types.ts` | `GenerateResult` diskriminierte Union; evtl. Helper-Types. |
| `src/llm/buildSystemPrompt.ts` | `buildSystemPrompt(surface: RegistryLLMSurface): string`. |
| `src/llm/generateSpec.ts` | `generateSpec(prompt: string, opts?): Promise<GenerateResult>` — Orchestrator. |
| `src/llm/buildSystemPrompt.test.ts` | Reine String-Tests. |
| `src/llm/generateSpec.test.ts` | Unit-Tests mit Mock-Client, deckt alle 5 Result-Kinds ab. |

### Zu ändernde Dateien

Keine.

### Zu löschende Dateien/Code

Keine.

## Implementierung

### Schritt 1: `src/llm/client.ts`

**Datei:** `src/llm/client.ts` (neu)

```ts
import Anthropic from '@anthropic-ai/sdk';

/**
 * Lazy-initialised Anthropic SDK instance.
 *
 * Reads VITE_ANTHROPIC_API_KEY from Vite env. If empty/missing, returns null
 * — callers then short-circuit with a user-visible "missing key" message
 * instead of attempting a doomed network call.
 *
 * Security note: `dangerouslyAllowBrowser: true` is required because the
 * SDK normally refuses to run client-side (the API key is in the bundle).
 * For this local dev demo, that's intentional and acceptable. See
 * .env.example for the caveat.
 */
let cached: Anthropic | null | undefined;

export function getClient(): Anthropic | null {
    if (cached !== undefined) return cached;

    const key = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!key || typeof key !== 'string' || key.trim() === '') {
        cached = null;
        return null;
    }

    cached = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
    return cached;
}

/** For tests only — clears the memoised client so env changes take effect. */
export function __resetClientForTests(): void {
    cached = undefined;
}
```

**Erklärung:**
- `undefined` vs `null` im Cache trennt "noch nicht geprüft" von "geprüft, kein Key". Ohne diese Trennung würde jeder Aufruf die Env-Variable neu lesen.
- `__resetClientForTests` ist eine bewusst benannte Test-Only-Hilfe. In Produktion nie aufgerufen. Kein Runtime-Overhead.

### Schritt 2: `src/llm/types.ts`

**Datei:** `src/llm/types.ts` (neu)

```ts
import type { SiteSpec } from '../builder/schemas';
import type { SpecError } from '../builder/validateSpec';

/**
 * Outcome of a single generateSpec() call. Discriminated by `kind` so
 * callers can exhaustively handle each case at compile time.
 */
export type GenerateResult =
    | { kind: 'ok';                spec: SiteSpec }
    | { kind: 'validation_failed'; errors: SpecError[]; rawInput: unknown }
    | { kind: 'api_error';         message: string }
    | { kind: 'missing_key' }
    | { kind: 'no_tool_use';       message: string };
```

### Schritt 3: `src/llm/buildSystemPrompt.ts`

**Datei:** `src/llm/buildSystemPrompt.ts` (neu)

```ts
import type { RegistryLLMSurface } from '../builder/types';

/**
 * Assembles the system prompt sent to Claude.
 *
 * The prompt has three sections:
 *   1. Role + task ("you are a web-design assistant…").
 *   2. Constraint list + theme-token guidance.
 *   3. Module reference: each registered module's meta + its full
 *      propsJSONSchema, pretty-printed.
 *
 * The tool's input_schema is the site-spec outer shape; the inner
 * per-module props shapes live in this prompt as reference material.
 * If Claude still produces bad props, validateSpecAgainstRegistry
 * catches it — this prompt is the optimistic side of that contract.
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
        '1. Call the `emit_site_spec` tool **exactly once**. No prose, no explanation.',
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
```

**Erklärung:**
- Markdown-Formatierung hilft Claude, Abschnitte zu unterscheiden.
- Das SiteSpec-JSON-Schema ist redundant mit dem Tool-`input_schema`, aber im System-Prompt verstärkt es die Shape-Awareness. Kostet wenige Tokens.
- Module-Section wird dynamisch gebaut — wenn jemand ein Modul hinzufügt, bekommt der LLM es ohne Code-Änderung hier.

### Schritt 4: `src/llm/buildSystemPrompt.test.ts`

**Datei:** `src/llm/buildSystemPrompt.test.ts` (neu)

Test-Cases:
1. Prompt enthält alle 13 registrierten Modul-Namen (z.B. "Header", "Container", "Gallery").
2. Prompt enthält den `siteSpecJSONSchema` serialisiert (z.B. "blocks" als Property).
3. Prompt enthält die Theme-Keys-Liste (`primary`, `secondary`, `text`, etc.).
4. Prompt enthält die Regel "exactly once".
5. Prompt ist Pure (zwei Aufrufe mit identischer Surface → identischer String).

Framework: Vitest + `expect(...).toContain(...)`.

### Schritt 5: `src/llm/generateSpec.ts`

**Datei:** `src/llm/generateSpec.ts` (neu)

```ts
import type Anthropic from '@anthropic-ai/sdk';
import { getClient } from './client';
import { getRegistryLLMSurface } from '../builder/registry';
import { validateSpecAgainstRegistry } from '../builder/validateSpec';
import { buildSystemPrompt } from './buildSystemPrompt';
import type { GenerateResult } from './types';
import type { RegistryLLMSurface } from '../builder/types';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 8192;
const TOOL_NAME = 'emit_site_spec';

/**
 * Options allow injecting a mock client and/or surface in tests.
 * Production callers omit them entirely.
 */
export interface GenerateSpecOptions {
    client?: Anthropic | null;
    surface?: RegistryLLMSurface;
}

export async function generateSpec(
    userPrompt: string,
    options: GenerateSpecOptions = {},
): Promise<GenerateResult> {
    const client = options.client ?? getClient();
    if (!client) return { kind: 'missing_key' };

    const surface = options.surface ?? getRegistryLLMSurface();
    const system = buildSystemPrompt(surface);

    let response;
    try {
        response = await client.messages.create({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            system,
            messages: [{ role: 'user', content: userPrompt }],
            tools: [
                {
                    name: TOOL_NAME,
                    description: 'Emit the final site specification. Call this exactly once.',
                    input_schema: surface.siteSpecJSONSchema as Anthropic.Messages.Tool.InputSchema,
                },
            ],
            tool_choice: { type: 'tool', name: TOOL_NAME },
        });
    } catch (err) {
        return { kind: 'api_error', message: extractErrorMessage(err) };
    }

    const toolUse = response.content.find(
        (block): block is Extract<typeof block, { type: 'tool_use' }> =>
            block.type === 'tool_use' && block.name === TOOL_NAME,
    );

    if (!toolUse) {
        return {
            kind: 'no_tool_use',
            message: 'Claude response did not include a tool_use block for ' + TOOL_NAME,
        };
    }

    const validated = validateSpecAgainstRegistry(toolUse.input);
    if (!validated.ok) {
        return {
            kind: 'validation_failed',
            errors: validated.errors,
            rawInput: toolUse.input,
        };
    }

    return { kind: 'ok', spec: validated.spec };
}

function extractErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    return String(err);
}
```

**Erklärung:**
- Dependency-Injection via Options-Objekt — produktiv wie ein Zero-Arg-Call, testbar ohne Monkeypatching.
- `response.content.find((b) => b.type === 'tool_use')` ist der offizielle Weg; TypeScript braucht den Predicate-Cast, damit die resultierende Variable den tool_use-Subtyp hat.
- Model + MaxTokens sind Konstanten oben. Änderungen sind ein One-Liner.
- Kein `console.log` — Fehler gehen in den Result zurück, UI rendert sie.

### Schritt 6: `src/llm/generateSpec.test.ts`

**Datei:** `src/llm/generateSpec.test.ts` (neu)

Test-Cases, jeweils mit handgebautem Mock-Client:

1. **Happy-Path:** Mock-Client liefert `content: [{ type: 'tool_use', name: 'emit_site_spec', input: validSpec }]` → `result.kind === 'ok'`, `result.spec` ist die validierte Spec.

2. **Missing-Key:** `generateSpec('x', { client: null })` → `{ kind: 'missing_key' }`. Kein Netzwerk-Call gemacht.

3. **API-Error:** Mock-Client wirft `new Error('401 unauthorized')` in `messages.create` → `{ kind: 'api_error', message: '401 unauthorized' }`.

4. **No-Tool-Use:** Mock-Client liefert `content: [{ type: 'text', text: 'hi' }]` → `{ kind: 'no_tool_use', message: /tool_use block/ }`.

5. **Validation-Failed (unbekanntes Modul):** Mock-Client liefert `input: { blocks: [{ type: 'DoesNotExist', props: {} }] }` → `{ kind: 'validation_failed', errors: [{ path: 'blocks[0]', … }], rawInput: {...} }`.

6. **Validation-Failed (schlechte Props):** Mock-Client liefert `input: { blocks: [{ type: 'Header', props: {} }] }` (Header braucht title) → `{ kind: 'validation_failed', errors: [...] }`.

**Mock-Client-Shape:** minimaler Objekt-Literal:
```ts
const mockClient = {
    messages: {
        create: vi.fn().mockResolvedValue({
            content: [
                { type: 'tool_use', name: 'emit_site_spec', input: {...} },
            ],
        }),
    },
} as unknown as Anthropic;
```

Der Cast-zu-`unknown as Anthropic` ist bewusst — wir brauchen nicht den vollen SDK-Mock, nur das eine Feld.

### Schritt 7: Validierung

```bash
cd c:\Users\Nico\WebstormProjects\website_builder
npx vitest run src/llm
npx tsc --noEmit
npx eslint src/llm
npm run test
npm run build
```

Alles muss grün sein. `src/llm` sollte 6 neue Tests haben (buildSystemPrompt) + 6 (generateSpec) = 12 neue Tests. Gesamt-Testzahl: 318 + 12 = 330.

---

## Aufrufer umstellen

Keine — dieser Plan ist additiv. Plan 03 wird der erste Konsument sein.

---

## Validierung

### Manuelle Tests

- [ ] Quick REPL-Check: in Node (Import-Map wahrscheinlich kompliziert) — alternativ in einem Scratch-Test einen echten Call machen, wenn ein Key gesetzt ist. Nicht Pflicht; primärer Smoke-Test kommt in Plan 03.

### Automatisierte Tests

```bash
npx vitest run
```

Mind. 330 Tests grün, alle neuen Tests in `src/llm/*.test.ts` passen.

### Erwartetes Verhalten

- `getClient()` ohne Key → `null`.
- `getClient()` mit Key → Instanz, die in weiteren Aufrufen stabil wiederkehrt.
- `buildSystemPrompt` ist deterministisch, enthält alle Modul-Infos.
- `generateSpec` ist rein funktional erreichbar mit injiziertem Client, UI-unabhängig.

## Rollback-Plan

1. `src/llm/` komplett löschen.
2. Plan 03 kann noch nicht starten, also kein weiterer Aufräumaufwand.

---

*Status: Ausstehend*
*Erstellt am: 2026-04-14*
