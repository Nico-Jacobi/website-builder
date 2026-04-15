# Gemini Swap — Plan 01: Provider Swap

## Übersicht

| Aspekt | Details |
|--------|---------|
| **Ziel** | Kompletter Swap von Anthropic-Claude-Backend auf Google-Gemini-Backend. Ein einziger Plan, weil der Swap sinnvoll atomisch ist (zwischenliegende Zustände wären halb-kaputt). |
| **Abhängig von** | — (eigenständiger Plan) |
| **Betroffene Bereiche** | Frontend / LLM-Layer / Infra |
| **Geschätzte Komplexität** | Mittel |

### Größen-Check

| Metrik | Wert | Schwellwert | OK? |
|--------|------|-------------|-----|
| Implementierungsschritte | 7 (+ Validierung, zählt nicht) | >8 | ✓ |
| Neue Dateien | 0 | >5 | ✓ |
| Zu ändernde Dateien | 9 | >10 | ✓ |

## Schnittstellen (Kohärenz-Vertrag)

### Inputs

Keine (einziger Plan im Feature).

### Outputs

Keine (letzter Plan im Feature).

### Architektur-Entscheidungen

- **Atomarer Swap in einem Plan:** Zwischenzustände (z.B. Anthropic-Client raus, Gemini-Client rein, aber Tests noch mocken Anthropic-Shape) sind nicht build-grün. Einen Splitt in "Dep-Swap" + "Code-Swap" haben wir erwogen und verworfen — erzwingt kaputte Checkpoints.
- **Drift-Fixes im selben Plan:** Die drei vom Impact-Analyzer gefundenen Provider-Referenzen außerhalb der reinen Client/generateSpec-Files (Rule 1 in System-Prompt, JSDoc, BuilderPage-Texte) werden **in diesem Plan mitgefixt**, nicht später. Sonst bleiben Claude-Referenzen sichtbar im produktiven Pfad.
- **System-Prompt bleibt Rule-basiert, nur Wortlaut wechselt:** aus "Call the `emit_site_spec` tool **exactly once**" wird "Respond with a single JSON object matching the shape below. Output only JSON — no prose, no markdown fences." Gleiche Instruktion, neuer Mechanismus.

## Voraussetzungen

- [x] Node.js + npm verfügbar.
- [x] Feature `llm-generator` abgeschlossen (liefert die bestehende Anthropic-Implementierung als Ausgangsbasis).
- [ ] Google AI Studio API-Key vorhanden (für manuellen End-to-End-Test am Ende). **Nicht** für Build/Test-Pipeline erforderlich — Unit-Tests laufen mit Mock-Client.

## Betroffene Dateien

### Neue Dateien

Keine.

### Zu ändernde Dateien

| Datei | Art der Änderung |
|-------|------------------|
| `package.json` | `@anthropic-ai/sdk` raus, `@google/genai` rein (via npm) |
| `.env.example` | Env-Var-Name + Security-Caveat auf Gemini aktualisiert |
| `src/llm/client.ts` | Komplett-Rewrite: `GoogleGenAI` statt `Anthropic`, neue Env-Var |
| `src/llm/types.ts` | Union-Kind `no_tool_use` → `invalid_json` (mit optionalem `rawText`) |
| `src/llm/generateSpec.ts` | Komplett-Rewrite: `models.generateContent` + `responseMimeType: 'application/json'`, neues Error-Mapping |
| `src/llm/generateSpec.test.ts` | Mock-Shape + Kind-Assertion |
| `src/llm/buildSystemPrompt.ts` | JSDoc + Rule 1 neutralisiert (kein Tool-Use-Wording mehr) |
| `src/llm/buildSystemPrompt.test.ts` | String-Matcher an neuen Wortlaut angepasst |
| `src/pages/BuilderPage/BuilderPage.tsx` | Switch-Case `no_tool_use` → `invalid_json`, Env-Var-Referenz im `missing_key`-Panel, Loading-Hint-Text provider-neutral |

### Zu löschende Dateien/Code

Siehe Masterplan §9.2 — im Wesentlichen: alles Anthropic-spezifische in client.ts, generateSpec.ts, types.ts, tests, BuilderPage-Strings.

## Implementierung

### Schritt 1: Dependencies swappen

```bash
cd c:\Users\Nico\WebstormProjects\website_builder
npm uninstall @anthropic-ai/sdk
npm install @google/genai
```

Nach Abschluss verifizieren: `package.json` enthält **nicht** mehr `@anthropic-ai/sdk`, dafür `@google/genai`. Version pinnen mit `^`-Prefix, wie npm Default.

### Schritt 2: `.env.example` aktualisieren

**Datei:** `.env.example`

**Inhalt (neu):**

```
# Google Gemini API key for the LLM generator.
# Create one at https://aistudio.google.com/apikey and paste it here.
# Copy this file to .env and fill in the value.
#
# ⚠️  Security note: This key is bundled into the client-side build (prefixed
# with VITE_ so Vite exposes it to the browser). Only safe for local dev demos —
# anyone with access to the built bundle can read the key. Do not deploy this
# setup publicly.

VITE_GOOGLE_API_KEY=
```

**User-Hinweis (nicht Teil des Code-Edits):** Der Nutzer muss seine lokale `.env` manuell aktualisieren. Im Final-Output der Validierung darauf hinweisen.

### Schritt 3: `src/llm/client.ts` rewrite

**Vorher:** Anthropic-Instanziierung mit `dangerouslyAllowBrowser: true` und `VITE_ANTHROPIC_API_KEY`.

**Nachher:**

```ts
import { GoogleGenAI } from '@google/genai';

/**
 * Lazy-initialised Google GenAI SDK instance.
 *
 * Reads VITE_GOOGLE_API_KEY from Vite env. If empty/missing, returns null
 * — callers then short-circuit with a user-visible "missing key" message
 * instead of attempting a doomed network call.
 *
 * Security note: The API key is bundled into the client-side build (Vite
 * exposes any VITE_*-prefixed env var to the browser). For this local dev
 * demo, that's intentional and acceptable. See .env.example for the caveat.
 */
let cached: GoogleGenAI | null | undefined;

export function getClient(): GoogleGenAI | null {
    if (cached !== undefined) return cached;

    const key = import.meta.env.VITE_GOOGLE_API_KEY;
    if (!key || typeof key !== 'string' || key.trim() === '') {
        cached = null;
        return null;
    }

    cached = new GoogleGenAI({ apiKey: key });
    return cached;
}

/** For tests only — clears the memoised client so env changes take effect. */
export function __resetClientForTests(): void {
    cached = undefined;
}
```

**Erklärung:**
- `dangerouslyAllowBrowser` entfällt — `@google/genai` läuft nativ im Browser.
- Gesamte Struktur (lazy-Singleton, Sentinel-Cache, Test-Reset) bleibt identisch.

### Schritt 4: `src/llm/types.ts` aktualisieren

**Vorher:** Union-Kind `no_tool_use`.

**Nachher:**

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
    | { kind: 'invalid_json';      message: string; rawText?: string };
```

Einzige Änderung: `no_tool_use` → `invalid_json` mit `rawText?`-Feld.

### Schritt 5: `src/llm/generateSpec.ts` rewrite

**Nachher:**

```ts
import type { GoogleGenAI } from '@google/genai';
import { getClient } from './client';
import { getRegistryLLMSurface } from '../builder/registry';
import { validateSpecAgainstRegistry } from '../builder/validateSpec';
import { buildSystemPrompt } from './buildSystemPrompt';
import type { GenerateResult } from './types';
import type { RegistryLLMSurface } from '../builder/types';

const MODEL = 'gemini-2.5-flash';

export interface GenerateSpecOptions {
    client?: GoogleGenAI | null;
    surface?: RegistryLLMSurface;
}

export async function generateSpec(
    userPrompt: string,
    options: GenerateSpecOptions = {},
): Promise<GenerateResult> {
    const client = options.client ?? getClient();
    if (!client) return { kind: 'missing_key' };

    const surface = options.surface ?? getRegistryLLMSurface();
    const systemInstruction = buildSystemPrompt(surface);

    let response;
    try {
        response = await client.models.generateContent({
            model: MODEL,
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
            },
        });
    } catch (err) {
        return { kind: 'api_error', message: extractErrorMessage(err) };
    }

    const text = response.text;
    if (typeof text !== 'string' || text.trim() === '') {
        return {
            kind: 'invalid_json',
            message: 'Gemini response contained no text (possibly blocked by safety filter).',
        };
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(text);
    } catch (err) {
        return {
            kind: 'invalid_json',
            message: `Response was not valid JSON: ${extractErrorMessage(err)}`,
            rawText: text,
        };
    }

    const validated = validateSpecAgainstRegistry(parsed);
    if (!validated.ok) {
        return {
            kind: 'validation_failed',
            errors: validated.errors,
            rawInput: parsed,
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
- `models.generateContent` mit `contents: userPrompt` (String). Im @google/genai-SDK ist der einfache String direkt als User-Prompt akzeptiert.
- `config.systemInstruction` = unser System-Prompt-String.
- `config.responseMimeType = 'application/json'` zwingt Gemini zu JSON-Output (ohne Schema — siehe Masterplan §4).
- `response.text` ist ein Getter bzw. ein String-Feld; bei gesperrten/leeren Antworten fällt dies als `invalid_json` durch.
- `JSON.parse` separat abgefangen, `rawText` wird zur UI durchgereicht.
- Kein Tool-Use, kein `tool_choice`, kein Block-Suchen.

**Hinweis falls SDK-API abweicht:** @google/genai ist in aktiver Entwicklung. Falls `response.text` tatsächlich ein Getter ist (`response.text()` als Call) oder der Call-Shape anders aussieht, passe direkt an und dokumentiere in den NOTES des Execute-Outputs. Offizielle Doku zur Implementationszeit konsultieren.

### Schritt 6: `src/llm/buildSystemPrompt.ts` neutralisieren

Zwei lokale Stellen ändern:

**a) JSDoc am Top-Level-Export:** Ersetze alle "Claude"- und "tool"-Referenzen durch neutrales Wording.

Vorher (Essenz):
```
* Assembles the system prompt sent to Claude.
* ...
* The tool's input_schema is the site-spec outer shape; ...
* If Claude still produces bad props, validateSpecAgainstRegistry catches it
```

Nachher:
```
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
```

**b) Rule 1 im Prompt-Body:** ersetzen.

Vorher:
```
1. Call the `emit_site_spec` tool **exactly once**. No prose, no explanation.
```

Nachher:
```
1. Respond with a single JSON object that matches the outer shape below. Output only the JSON — no prose, no markdown fences, no commentary.
```

Rest des Prompts (Rules 2-7, Theme-Section, Available-modules-Section) bleibt **unverändert** — die sind provider-neutral.

### Schritt 7: `src/llm/buildSystemPrompt.test.ts` anpassen

Einziger betroffener Test ist derjenige, der auf den String `"exactly once"` oder `"emit_site_spec"` prüft. Aktuell heißt der Test etwa "prompt enthält Rule 'exactly once'".

**Anpassung:** Der Matcher soll weiterhin prüfen, dass die Rule-1-Instruktion im Prompt vorkommt, aber mit neuem Wortlaut. Ersetze:
- `.toContain('exactly once')` → `.toContain('single JSON object')`
- Falls ein Test auf `.toContain('emit_site_spec')` prüft: **entfernen** (der String existiert nicht mehr).

Alle anderen Tests (Modul-Namen vorhanden, Theme-Keys gelistet, Reinheit, SiteSpec-JSON-Schema eingebettet) bleiben unverändert.

### Schritt 8: `src/llm/generateSpec.test.ts` anpassen

**a) Mock-Client-Shape:**

Vorher (Anthropic):
```ts
const mockClient = {
    messages: {
        create: vi.fn().mockResolvedValue({
            content: [{ type: 'tool_use', id: 'x', name: 'emit_site_spec', input: validSpec }],
        }),
    },
} as unknown as Anthropic;
```

Nachher (Gemini):
```ts
const mockClient = {
    models: {
        generateContent: vi.fn().mockResolvedValue({
            text: JSON.stringify(validSpec),
        }),
    },
} as unknown as GoogleGenAI;
```

Import: `import type { GoogleGenAI } from '@google/genai';`.

**b) Test-Cases:**

Die 6 Test-Fälle bleiben semantisch gleich, aber:
- **Fall 4 ("no_tool_use" → "invalid_json"):** Mock liefert `{ text: '' }` (leerer Text) statt Plain-Text-Block. Erwartung: `result.kind === 'invalid_json'`.
- **Neuer Fall 4b (optional, nice-to-have):** Mock liefert `{ text: 'not valid json {' }`. Erwartung: `invalid_json` mit `rawText` gefüllt. Falls dieser Fall die Gesamtzahl der Tests über 7 treibt und das Feature "Test-Count bleibt bei 329" kompromittiert, Fall 4b weglassen. Default: mitmachen, Test-Count steigt um 1.
- **Fall 3 (API-Error):** Mock: `models.generateContent` wirft `new Error('429 rate limit')`. Erwartung unverändert.
- **Fall 5+6 (Validation-Failed):** Mock liefert `{ text: JSON.stringify(specWithBadProps) }`. Erwartung unverändert.

**c) Cleanup:** `__resetClientForTests()` in `beforeEach` bleibt.

### Schritt 9: `src/pages/BuilderPage/BuilderPage.tsx` anpassen

Drei lokale Edits, **keine** strukturellen Änderungen.

**a) Loading-Hint (Z. 50):**

Vorher:
```tsx
<p className="builder_page__hint">Claude arbeitet …</p>
```

Nachher:
```tsx
<p className="builder_page__hint">Gemini arbeitet …</p>
```

(Provider-neutrales "LLM arbeitet …" wäre technisch sauberer, aber für die Demo-UX ist der Provider-Name sprechender.)

**b) `missing_key`-Panel (Z. ~66):**

Vorher:
```tsx
detail="Trage VITE_ANTHROPIC_API_KEY in deiner .env ein und starte den Dev-Server neu."
```

Nachher:
```tsx
detail="Trage VITE_GOOGLE_API_KEY in deiner .env ein und starte den Dev-Server neu."
```

**c) Switch-Case umbenennen:**

Vorher:
```tsx
case 'no_tool_use':
    return <ErrorPanel title="Unerwartete LLM-Antwort" detail={result.message} />;
```

Nachher:
```tsx
case 'invalid_json':
    return (
        <ErrorPanel
            title="Unerwartete LLM-Antwort"
            detail={result.message}
            rawInput={result.rawText}
        />
    );
```

Anmerkung: `rawInput` im ErrorPanel akzeptiert `unknown` — das passt zum `rawText?: string`-Feld direkt.

Der exhaustive-`never`-Check im `default`-Zweig sollte jetzt mit `invalid_json` zufrieden sein. Falls TypeScript meckert, ist irgendwo ein Kind vergessen.

---

## Aufrufer umstellen

Keine über die oben gelisteten Dateien hinaus. Laut Impact-Analyse gibt es keine transitiven Konsumenten von `GenerateResult.kind === 'no_tool_use'` außerhalb von BuilderPage.

---

## Validierung

### Manuelle Tests

- [ ] `.env`: alten `VITE_ANTHROPIC_API_KEY=…` entfernen, `VITE_GOOGLE_API_KEY=…` einsetzen.
- [ ] `npm run dev` starten.
- [ ] Prompt eingeben, Generate. Erwartet: nach 1-4s wird eine Seite gerendert.
- [ ] Leeres `.env`: UI zeigt "Kein API-Key konfiguriert" mit Verweis auf `VITE_GOOGLE_API_KEY`.
- [ ] Absichtlich ungültiger Key: UI zeigt "API-Fehler" mit Gemini-Message.
- [ ] Loading-Hint zeigt "Gemini arbeitet …", nicht mehr "Claude arbeitet …".

### Automatisierte Tests

```bash
cd c:\Users\Nico\WebstormProjects\website_builder
npx tsc --noEmit
npx eslint src
npm run test
npm run build
```

Erwartet:
- tsc: keine Fehler
- eslint: keine neuen Fehler
- vitest: 329 Tests grün (oder 330, wenn der optionale `invalid_json`-mit-kaputtem-JSON-Fall aus Schritt 8b mitgemacht wurde)
- build: dist gebaut, Bundle enthält `@google/genai` statt `@anthropic-ai/sdk`

### Grep-Verifikation

Am Ende absichtlich grep durchlaufen lassen und Ergebnis in den NOTES reporten:

```bash
# Erwartet: 0 Treffer
grep -rn "@anthropic-ai/sdk" src/ package.json
grep -rn "VITE_ANTHROPIC_API_KEY" src/ .env.example
grep -rn "dangerouslyAllowBrowser" src/
grep -rn "no_tool_use" src/
grep -rn "emit_site_spec" src/
```

Alle 5 Greps müssen leer sein. `docs/`-Hits sind OK — das sind historische Pläne.

### Erwartetes Verhalten

Die App funktioniert für den User exakt wie vorher, nur mit Gemini als Backend. UI rendert die generierte Site, Error-Pfade zeigen neue Env-Var + invalid_json-Kind.

## Rollback-Plan

Falls der Swap fehlschlägt:

1. `npm uninstall @google/genai`
2. `npm install @anthropic-ai/sdk`
3. Git-Revert auf den letzten grünen Commit vor Plan-Start (Feature `llm-generator` im `0_completed`-Archiv dient als Referenz für die Anthropic-Implementierung).
4. `.env` zurück auf `VITE_ANTHROPIC_API_KEY`.

---

*Status: Ausstehend*
*Erstellt am: 2026-04-15*
