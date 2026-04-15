# Gemini Swap — Masterplan

## Status
- [x] Phase 1: Masterplan
- [x] Phase 1b: Impact-Analyse
- [x] Phase 2: Implementierungspläne (ein Plan, unter allen Schwellwerten)
- [x] Phase 2b: Sub-Pläne (nicht nötig)
- [x] Phase 2c: Kohärenz-Check
- [x] Implementierung gestartet
- [x] Cleanup-Validierung
- [x] Feature abgeschlossen

## 1. Ziel

**Was soll erreicht werden?**

Der LLM-Provider wird komplett von Anthropic Claude auf Google Gemini
2.5 Flash umgestellt. Motivation: Geminis Free-Tier (15 req/min auf
Flash) ist für lokale Demos freundlicher als das Anthropic-$5-Credit.
Swap — kein paralleles Anbieten beider Provider, kein Abstract-Layer.

1. `@anthropic-ai/sdk` raus, `@google/genai` (neuer offizieller
   Google-SDK) rein.
2. `VITE_ANTHROPIC_API_KEY` wird `VITE_GOOGLE_API_KEY`.
3. `src/llm/client.ts` und `src/llm/generateSpec.ts` werden umgeschrieben.
4. `GenerateResult`-Union wird provider-neutral: `no_tool_use` →
   `invalid_json` (Gemini liefert JSON-Text statt Tool-Use-Block).
5. Minimale Folgeanpassung in `BuilderPage.tsx` (Switch-Case-Name).

**Anwendungsfall:**

- Nach diesem Feature: `.env` mit `VITE_GOOGLE_API_KEY=…` → `npm run dev`
  → UI funktioniert exakt wie vorher, nur mit Gemini als Backend.

## 2. Ist-Zustand

**Aktuelle Implementierung:**

- [src/llm/client.ts](../../../src/llm/client.ts) instanziiert `Anthropic`
  mit `dangerouslyAllowBrowser: true`, liest `VITE_ANTHROPIC_API_KEY`.
- [src/llm/generateSpec.ts](../../../src/llm/generateSpec.ts) baut
  `messages.create({ tools: [...], tool_choice: { type: 'tool', name } })`,
  extrahiert `content.find(b => b.type === 'tool_use')`, ruft
  `validateSpecAgainstRegistry(toolUse.input)`.
- [src/llm/types.ts](../../../src/llm/types.ts) hat `GenerateResult`
  mit Kind `no_tool_use`.
- [src/llm/generateSpec.test.ts](../../../src/llm/generateSpec.test.ts)
  mockt den Anthropic-Client mit `content: [{ type: 'tool_use', … }]`.
- [src/pages/BuilderPage/BuilderPage.tsx](../../../src/pages/BuilderPage/BuilderPage.tsx)
  hat einen `case 'no_tool_use'` im Result-Switch.
- [.env.example](../../../.env.example) dokumentiert `VITE_ANTHROPIC_API_KEY`.
- `package.json`: `@anthropic-ai/sdk: ^0.88.0` in `dependencies`.

**Probleme:**

- Anthropic-Free-Tier für eine Demo knapp (nur Initial-Credit).
- Nutzer hat expliziten Gemini-Wunsch.

**Relevante Dateien:**

- `src/llm/client.ts` — rewrite.
- `src/llm/generateSpec.ts` — rewrite.
- `src/llm/types.ts` — kleine Kind-Umbenennung.
- `src/llm/generateSpec.test.ts` — Mocks anpassen.
- `src/pages/BuilderPage/BuilderPage.tsx` — Switch-Case umbenennen.
- `.env.example` — Env-Var-Name tauschen.
- `package.json` — Dep-Swap.

## 3. Soll-Zustand

### Neue Dependency

- `@google/genai` (aktuelle stabile Version, typischerweise `^1.x`).

### Entfernte Dependency

- `@anthropic-ai/sdk` — per `npm uninstall` entfernen.

### `src/llm/client.ts` (rewrite)

```ts
import { GoogleGenAI } from '@google/genai';

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

export function __resetClientForTests(): void {
    cached = undefined;
}
```

Änderungen gegenüber der Anthropic-Version:
- Klasse `GoogleGenAI` statt `Anthropic`.
- Kein `dangerouslyAllowBrowser` — `@google/genai` läuft nativ im
  Browser, kein Zusatzflag.
- Env-Var heißt jetzt `VITE_GOOGLE_API_KEY`.

### `src/llm/generateSpec.ts` (rewrite)

Kern-API-Wechsel:
- `client.models.generateContent({ model, contents, config })` statt
  `client.messages.create(...)`.
- `config.systemInstruction = systemPrompt`.
- `config.responseMimeType = 'application/json'`.
- **Kein `responseSchema`** in der ersten Version — Grund siehe §4.
- Response: `response.text` ist der JSON-String. `JSON.parse(...)` →
  `validateSpecAgainstRegistry(...)`.
- Kein Tool-Use, kein `tool_choice`.

Neue Fehlerpfade:
- `response.text` leer → `kind: 'invalid_json'` mit passender Meldung.
- `JSON.parse` wirft → `kind: 'invalid_json'` mit Parser-Message.
- Alles andere wie bisher.

### `src/llm/types.ts` — Union aktualisieren

```ts
export type GenerateResult =
    | { kind: 'ok';                spec: SiteSpec }
    | { kind: 'validation_failed'; errors: SpecError[]; rawInput: unknown }
    | { kind: 'api_error';         message: string }
    | { kind: 'missing_key' }
    | { kind: 'invalid_json';      message: string; rawText?: string };
```

`no_tool_use` → `invalid_json`. `rawText?` hängen wir optional dran:
wenn Gemini etwas geliefert hat, aber es nicht JSON-parse-bar war,
kann die UI den Raw-Text im `<details>` zeigen.

### `BuilderPage.tsx` — Switch-Case umbenennen

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

Statt bisher `case 'no_tool_use'`. Rest des Switches bleibt.

### `src/llm/generateSpec.test.ts` — Mocks anpassen

Mock-Client-Shape ändert sich:

```ts
const mockClient = {
    models: {
        generateContent: vi.fn().mockResolvedValue({
            text: JSON.stringify(validSpec),
        }),
    },
} as unknown as GoogleGenAI;
```

Test-Fälle bleiben semantisch gleich:
1. Happy path → `ok`
2. Missing key → `missing_key`
3. API-Error (SDK wirft) → `api_error`
4. Response ohne `.text` oder mit kaputtem JSON → `invalid_json` (ersetzt `no_tool_use`)
5. Validation-Failed via unbekanntes Modul → `validation_failed`
6. Validation-Failed via schlechte Props → `validation_failed`

### `.env.example`

```
# Google Gemini API key for the LLM generator.
# Create one at https://aistudio.google.com/apikey and paste it here.
# ⚠️ Security caveat — same as before: key is in the bundled client-side JS,
# only safe for local dev demos.

VITE_GOOGLE_API_KEY=
```

## 4. Architektur-Entscheidungen

### Warum kein `responseSchema` in V1

Gemini's `responseSchema` akzeptiert ein OpenAPI-3.0-ähnliches
Schema-Subset. Unser `siteSpecJSONSchema` aus `z.toJSONSchema` ist
Draft 2020-12 mit `$schema`, möglicherweise `$defs`, teilweise
`additionalProperties: false` — Felder, die Gemini entweder ignoriert
oder mit einem API-Fehler ablehnt.

Ein Sanitizer (`sanitizeSchemaForGemini`) wäre machbar, aber:
- Das System-Prompt enthält bereits alle Modul-JSON-Schemas.
- `validateSpecAgainstRegistry` ist die echte Trust-Boundary — ob
  Gemini schemagesteuert oder nur MIME-gesteuert JSON liefert, ändert
  das nicht.
- MIME-only ist **weniger Setup-Code, identische Safety**.

V1 startet mit `responseMimeType: 'application/json'` ohne Schema.
Wenn in der Praxis Output-Qualität schlecht ist, kann ein Follow-up
einen Sanitizer bauen — dokumentiert in §8 als Offene Frage.

### Warum complete swap, kein Abstract-Layer

Ein `Provider`-Interface mit `AnthropicProvider` und `GeminiProvider`
wäre eleganter, aber:
- Dieses Feature hat 8 Dateien Edit. Ein Provider-Abstract würde 2-3
  zusätzliche Files anlegen für etwas, das MVP nicht braucht.
- User wollte explizit swap, nicht Multi-Provider.
- Wenn später doch Multi-Provider gewünscht: eigenes Refactor, bessere
  Informationen aus echten Usage-Patterns.

### Model-Name

`gemini-2.5-flash` als Konstante oben in `generateSpec.ts`. Änderung
ist ein One-Liner. Alternative Pro-Modell nur als späteres Feature,
wenn Output-Qualität mit Flash nicht reicht.

### Sicherheit

- API-Key weiter im Bundle — akzeptiertes Dev-Caveat, identisch zur
  Anthropic-Version. `.env.example` aktualisiert den Security-Text
  nur bzgl. Provider-Namen.
- `.gitignore` ändert sich nicht — `.env` ist bereits ignoriert.

### Keine neuen Module, keine UI-Änderung

- `buildSystemPrompt.ts` bleibt 1:1. System-Prompt-Format ist
  provider-neutral (Markdown + JSON-Blocks).
- `BuilderPage.tsx` ändert nur den einen Switch-Case-Namen.
- `validateSpecAgainstRegistry`, Renderer, schemas.ts, alle Module:
  unberührt.

## 5. Beachtenswertes

### Kosten / Free-Tier

- Gemini 2.5 Flash: kostenloser Tier aktuell 15 requests/min, 1M
  TPM, 1.5k RPD (Stand: AI Studio-Dokumentation). Für eine Demo
  praktisch unlimited.

### Performance

- Flash ist schneller als Sonnet. Erwarteter End-to-End-Latenz: 1-4s
  statt 2-8s. Kein UI-Wechsel nötig, Spinner reicht.

### Fehlerbehandlung

- Gemini kann Outputs durch Safety-Filter blockieren (seltener bei
  Website-Generierung, aber möglich). Blockierter Call liefert meist
  eine leere `.text`-Property und/oder einen `promptFeedback`-Block.
  V1 handelt das unter `invalid_json` (leerer Text). Detailierte
  Blocked-Reason-Handhabung ist out-of-scope — kann später als
  weiteres Result-Kind eingeführt werden.

### Tests

- `generateSpec.test.ts` bleibt gleich strukturiert, nur Mock-Shape
  und ein Kind-Name ändern sich.
- `buildSystemPrompt.test.ts` ist provider-neutral — bleibt 1:1.

### Migration

- `.env`-Datei des Users muss aktualisiert werden: alter Key raus,
  `VITE_GOOGLE_API_KEY=…` rein. Dokumentiert in `.env.example` und
  Plan 01's manuellen Tests.

## 6. Abhängigkeiten

**Voraussetzungen:**

- Feature `llm-foundation` ✓ (abgeschlossen).
- Feature `llm-generator` ✓ (abgeschlossen).
- Google AI Studio Account + API-Key.

**Betroffene Features:**

- `llm-generator` — wird partiell umgeschrieben. Trust-Boundary
  (validateSpec) bleibt die Grenze.

**Externe Abhängigkeiten:**

- **Neu:** `@google/genai` (latest stable).
- **Entfernt:** `@anthropic-ai/sdk`.

## 7. Nicht-Ziele

**Explizit NICHT Teil dieses Features:**

- Kein Multi-Provider-Support, kein Provider-Abstract-Layer.
- Keine `responseSchema`-Nutzung (V2, falls Output-Qualität schlecht).
- Kein Pro-Modell-Fallback.
- Kein Safety-Feedback-Handling als eigener Kind.
- Keine Streaming-Response.
- Keine UI-Änderungen außer der einen Switch-Case-Umbenennung.

**Spätere Erweiterungen (out of scope):**

- Sanitizer `sanitizeSchemaForGemini(schema)` + `responseSchema`-Nutzung.
- Model-Switch-UI (Flash/Pro-Toggle).
- Abstraktes `Provider`-Interface für zukünftigen Multi-Provider.

## 8. Offene Fragen

- [ ] **@google/genai Version:** zum Implementierungszeitpunkt latest
  stable pinnen. SDK ist in aktiver Entwicklung; minor Drifts in der
  API-Shape möglich. Wenn die im Plan dokumentierte
  `client.models.generateContent({ model, contents, config })`-API
  nicht exakt stimmt, im Plan entsprechend justieren.
- [ ] **Gemini Output-Qualität ohne responseSchema:** wird sich in
  ersten Smoke-Tests zeigen. Falls Claude-Level-Reliability nicht
  erreicht wird, Follow-up-Feature für Schema-Sanitizer.

---

## 9. Was muss weg (Impact-Analyse)

> Wird vom `impact-analyzer` in Phase 1b befüllt.

### 9.1 Zu löschende Dateien

| Datei | Grund für Löschung |
|-------|-------------------|
| — (keine) | Feature ist ein In-Place-Rewrite. Alle Dateien bleiben bestehen, nur Inhalt wechselt. Kein Modul, kein Test-File wird komplett entfernt. |

### 9.2 Zu löschender Code

| Datei | Element | Grund |
|-------|---------|-------|
| `src/llm/client.ts` (Zeile 1) | `import Anthropic from '@anthropic-ai/sdk';` | Ersetzt durch `import { GoogleGenAI } from '@google/genai';`. |
| `src/llm/client.ts` (Zeilen 4–14) | JSDoc-Block `Lazy-initialised Anthropic SDK instance` inkl. `Security note: dangerouslyAllowBrowser` | Referenziert Anthropic + SDK-Browser-Flag. Neuer JSDoc bezieht sich auf `GoogleGenAI`; `dangerouslyAllowBrowser` entfällt ganz. |
| `src/llm/client.ts` (Zeile 15) | `let cached: Anthropic | null | undefined;` | Typ wird `GoogleGenAI | null | undefined`. |
| `src/llm/client.ts` (Zeile 17) | Rückgabetyp von `getClient(): Anthropic | null` | Wird `GoogleGenAI | null`. |
| `src/llm/client.ts` (Zeile 20) | `import.meta.env.VITE_ANTHROPIC_API_KEY` | Wird `import.meta.env.VITE_GOOGLE_API_KEY`. |
| `src/llm/client.ts` (Zeile 26) | `new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true })` | Wird `new GoogleGenAI({ apiKey: key })` — kein Browser-Flag. |
| `src/llm/generateSpec.ts` (Zeile 1) | `import type Anthropic from '@anthropic-ai/sdk';` | Ersetzt durch `import type { GoogleGenAI } from '@google/genai';` (oder ganz raus, wenn nur im Options-Typ benötigt). |
| `src/llm/generateSpec.ts` (Zeile 9) | `const MODEL = 'claude-sonnet-4-6';` | Wird `const MODEL = 'gemini-2.5-flash';`. |
| `src/llm/generateSpec.ts` (Zeile 11) | `const TOOL_NAME = 'emit_site_spec';` | Entfällt — Gemini-Pfad hat keinen Tool-Namen. |
| `src/llm/generateSpec.ts` (Zeile 18) | `client?: Anthropic | null;` in `GenerateSpecOptions` | Wird `client?: GoogleGenAI | null;`. |
| `src/llm/generateSpec.ts` (Zeilen 23–28) | JSDoc erwähnt „calls Claude …", „tool_use input" | Neutralisieren auf Gemini / `generateContent`. |
| `src/llm/generateSpec.ts` (Zeilen 41–54) | `client.messages.create({ tools, tool_choice, … })` mit Anthropic-spezifischem Cast auf `Anthropic.Messages.Tool.InputSchema` | Wird `client.models.generateContent({ model, contents, config: { systemInstruction, responseMimeType: 'application/json' } })`. |
| `src/llm/generateSpec.ts` (Zeilen 59–62) | `response.content.find(b => b.type === 'tool_use' && b.name === TOOL_NAME)` | Entfällt komplett — stattdessen `response.text` + `JSON.parse`. |
| `src/llm/generateSpec.ts` (Zeilen 64–69) | `if (!toolUse) return { kind: 'no_tool_use', message: 'Claude response did not include a tool_use block for ' + TOOL_NAME };` | Wird zwei Guard-Pfade für `'invalid_json'`: leerer `response.text` + geworfene `JSON.parse`-Exception (inkl. `rawText`). |
| `src/llm/generateSpec.ts` (Zeile 71) | `validateSpecAgainstRegistry(toolUse.input)` | Wird `validateSpecAgainstRegistry(parsed)` (parsed = `JSON.parse(response.text)`). |
| `src/llm/generateSpec.ts` (Zeile 76) | `rawInput: toolUse.input` | Wird `rawInput: parsed`. |
| `src/llm/types.ts` (Zeile 13) | `| { kind: 'no_tool_use'; message: string };` | Wird `| { kind: 'invalid_json'; message: string; rawText?: string };`. |
| `src/llm/generateSpec.test.ts` (Zeile 2) | `import type Anthropic from '@anthropic-ai/sdk';` | Wird `import type { GoogleGenAI } from '@google/genai';`. |
| `src/llm/generateSpec.test.ts` (Zeilen 7–21) | Mock-Factory-Shape mit `{ messages: { create } } as unknown as Anthropic` | Wird `{ models: { generateContent } } as unknown as GoogleGenAI`; `resolve`-Payload `{ content: [...] }` → `{ text: '...' }`. |
| `src/llm/generateSpec.test.ts` (Zeile 38) | Test-Name „returns { kind: 'ok' } on happy-path tool_use" | Neutralisieren („happy path with valid JSON response" o.ä.). |
| `src/llm/generateSpec.test.ts` (Zeilen 40–49) | Resolve-Payload `{ content: [{ type: 'tool_use', id, name: 'emit_site_spec', input: VALID_SPEC }] }` | Wird `{ text: JSON.stringify(VALID_SPEC) }`. |
| `src/llm/generateSpec.test.ts` (Zeile 66) | Test-Name „when messages.create throws" | Wird „when generateContent throws". |
| `src/llm/generateSpec.test.ts` (Zeilen 77–90) | Kompletter Test-Case `no_tool_use` (Setup, Assertion, Regex `/tool_use block/`) | Wird Test-Case `invalid_json` — z.B. leerer `text` oder `text: 'not json'` → `kind === 'invalid_json'`, `rawText` verfügbar. |
| `src/llm/generateSpec.test.ts` (Zeilen 96–106, 124–135) | Resolve-Payloads für beide `validation_failed`-Cases mit `content: [{ type: 'tool_use', ... input: badInput }]` | Beide werden zu `{ text: JSON.stringify(badInput) }`. |
| `src/pages/BuilderPage/BuilderPage.tsx` (Zeile 50) | `<p className="builder_page__hint">Claude arbeitet …</p>` | **NICHT im Masterplan erwähnt** — Text enthält „Claude". Empfehlung: auf neutrales „LLM arbeitet …" oder „Gemini arbeitet …" ändern (Plan sagt „keine UI-Änderung außer der einen Case-Umbenennung", diese Stelle widerspricht dem aber textuell — sollte bewusst entschieden werden). |
| `src/pages/BuilderPage/BuilderPage.tsx` (Zeile 66) | `detail="Trage VITE_ANTHROPIC_API_KEY in deiner .env ein und starte den Dev-Server neu."` | Env-Var-Name im User-sichtbaren Text: muss zu `VITE_GOOGLE_API_KEY`. **Im Masterplan nicht explizit als Edit gelistet**, aber notwendig (sonst widerspricht UI der neuen `.env`). |
| `src/pages/BuilderPage/BuilderPage.tsx` (Zeilen 71–72) | `case 'no_tool_use': return <ErrorPanel title="Unerwartete LLM-Antwort" detail={result.message} />;` | Wird `case 'invalid_json':` — optional zusätzlich `rawInput={result.rawText}` reichen (wie im Masterplan §3 skizziert). |
| `.env.example` (Zeilen 1–10) | Gesamter Kommentar-Header + `VITE_ANTHROPIC_API_KEY=` | Wird Gemini-Variante (siehe Masterplan §3). |
| `.env` (Zeilen 1, 10) | `VITE_ANTHROPIC_API_KEY=` + Header-Kommentar | **Lokal, nicht committed**, aber User muss die eigene `.env`-Datei ebenfalls migrieren (in manuellen Smoke-Test-Schritten dokumentieren). |
| `package.json` (Zeile 15) | `"@anthropic-ai/sdk": "^0.88.0"` | Wird `"@google/genai": "^<latest-stable>"` — via `npm uninstall @anthropic-ai/sdk && npm install @google/genai`. `package-lock.json` aktualisiert sich automatisch. |

### 9.3 Veraltete Patterns

| Altes Pattern | Neues Pattern | Betroffene Stellen |
|---------------|---------------|-------------------|
| Anthropic Tool-Use (`tools: [{ name, input_schema }]` + `tool_choice: { type: 'tool', name }`) zur erzwungenen Strukturausgabe | Gemini `config.responseMimeType: 'application/json'` + `JSON.parse(response.text)` ohne `responseSchema` | `src/llm/generateSpec.ts` (Zeilen 41–54, 59–69) |
| Result-Kind `no_tool_use` (provider-spezifisch) | Result-Kind `invalid_json` (provider-neutral, mit optionalem `rawText`) | `src/llm/types.ts` Zeile 13; `src/llm/generateSpec.ts` Zeilen 64–69; `src/pages/BuilderPage/BuilderPage.tsx` Zeilen 71–72; `src/llm/generateSpec.test.ts` Zeilen 77–90 |
| Env-Var `VITE_ANTHROPIC_API_KEY` | Env-Var `VITE_GOOGLE_API_KEY` | `.env.example` Zeile 10; `.env` Zeile 10 (lokal); `src/llm/client.ts` Zeile 20; `src/pages/BuilderPage/BuilderPage.tsx` Zeile 66 (User-Hinweis-Text); sowie JSDoc in `src/llm/client.ts` Zeile 6 |
| SDK-Flag `dangerouslyAllowBrowser: true` | Entfällt — `@google/genai` ist nativ browser-fähig | `src/llm/client.ts` Zeile 26; JSDoc Zeilen 10–13 |
| Modell-ID `claude-sonnet-4-6` | Modell-ID `gemini-2.5-flash` | `src/llm/generateSpec.ts` Zeile 9 |
| Prosa-Referenz „Claude" in Code/JSDoc | Neutral „LLM" bzw. „Gemini" | `src/llm/generateSpec.ts` Zeilen 23, 67 (Error-Message); `src/llm/buildSystemPrompt.ts` Zeilen 4, 14 (JSDoc); `src/pages/BuilderPage/BuilderPage.tsx` Zeile 50 (UI-Hint). **Nur Zeilen in Code-Dateien, die überhaupt angefasst werden — `buildSystemPrompt.ts` bleibt laut Masterplan §3/§4 ungeändert; JSDoc dort enthält aber „Claude" und wäre sonst stehengebliebener Drift.** |

---

## 10. Betroffene Aufrufer (Impact-Analyse)

> Wird vom `impact-analyzer` in Phase 1b befüllt.

### 10.1 Direkte Aufrufer

**Aufrufer von `src/llm/client.ts` (`getClient`, `__resetClientForTests`):**

| Datei | Zeile | Aktuell | Neu |
|-------|-------|---------|-----|
| `src/llm/generateSpec.ts` | 2 | `import { getClient } from './client';` | Import bleibt; `getClient()`-Rückgabetyp ist jetzt `GoogleGenAI \| null`, wird aber nur lokal als `client` weiterverwendet — kein Aufruferseitiger Renaming-Bedarf. |
| `src/llm/generateSpec.ts` | 33 | `const client = options.client ?? getClient();` | Unverändert (Nullability-Semantik identisch). |
| `src/llm/generateSpec.test.ts` | 4 | `import { __resetClientForTests } from './client';` | Unverändert — Reset-API ist identisch. |
| `src/llm/generateSpec.test.ts` | 35 | `__resetClientForTests();` in `beforeEach` | Unverändert. |

**Aufrufer von `src/llm/generateSpec.ts` (`generateSpec`, `GenerateSpecOptions`):**

| Datei | Zeile | Aktuell | Neu |
|-------|-------|---------|-----|
| `src/pages/BuilderPage/BuilderPage.tsx` | 4 | `import { generateSpec } from '../../llm/generateSpec';` | Unverändert — öffentliche Signatur `generateSpec(prompt: string, options?: GenerateSpecOptions): Promise<GenerateResult>` bleibt 1:1. |
| `src/pages/BuilderPage/BuilderPage.tsx` | 20 | `const next = await generateSpec(trimmed);` | Unverändert. |
| `src/llm/generateSpec.test.ts` | 3 | `import { generateSpec } from './generateSpec';` | Unverändert. |
| `src/llm/generateSpec.test.ts` | 52, 62, 69, 84, 109, 138 | `await generateSpec('…', { client })` | Unverändert an der Aufrufstelle — die Mock-Client-Shape wechselt (siehe §9.2/§10.3), aber der Aufrufer-Code ist identisch. |

`GenerateSpecOptions` wird direkt nur innerhalb `generateSpec.ts` (Zeile 31) und in `generateSpec.test.ts` (implizit durch Options-Objekt-Literale) konsumiert. Kein externer Aufrufer importiert den Typ namentlich — Grep nach `GenerateSpecOptions` liefert nur die Definition und die `options: GenerateSpecOptions = {}`-Parameter-Signatur. Der Feld-Typ-Wechsel `client: Anthropic | null` → `client: GoogleGenAI | null` ist damit inhouse-beschränkt.

**Aufrufer von `src/llm/types.ts` (`GenerateResult`):**

| Datei | Zeile | Aktuell | Neu |
|-------|-------|---------|-----|
| `src/llm/generateSpec.ts` | 6 | `import type { GenerateResult } from './types';` | Unverändert; Rückgabekonstruktion `{ kind: 'no_tool_use', … }` → `{ kind: 'invalid_json', message, rawText }`. |
| `src/pages/BuilderPage/BuilderPage.tsx` | 5 | `import type { GenerateResult } from '../../llm/types';` | Unverändert; Switch-Case `'no_tool_use'` → `'invalid_json'` (siehe §10.2). |
| `src/pages/BuilderPage/BuilderPage.tsx` | 12 | `useState<GenerateResult \| null>(null)` | Unverändert. |
| `src/pages/BuilderPage/BuilderPage.tsx` | 58 | `function ResultView({ result }: { result: GenerateResult })` | Unverändert. |
| `src/llm/generateSpec.test.ts` | — | Kein expliziter `GenerateResult`-Import (Tests verlassen sich auf Literal-Kind-Checks) | Unverändert — Tests nutzen weiterhin `result.kind`-Narrowing. |

### 10.2 Transitive Aufrufer

| Datei | Kette | Änderung nötig? |
|-------|-------|-----------------|
| `src/pages/BuilderPage/BuilderPage.tsx` (Zeile 59 `switch (result.kind)`, Zeile 71 `case 'no_tool_use':`) | `GenerateResult` → konsumiert in `ResultView`-Switch; Discriminator `kind` | **Ja.** Genau eine Case-Umbenennung: `case 'no_tool_use':` → `case 'invalid_json':`. Der Exhaustiveness-Check (`const _exhaustive: never = result;`) zwingt TypeScript, jede Nicht-Umbenennung als Compile-Fehler zu melden — Safety-Net ist intakt. |
| `src/pages/BuilderPage/BuilderPage.tsx` (Zeile 66, User-Text) | `missing_key`-Case zeigt Env-Var-Namen direkt im UI | **Ja.** `VITE_ANTHROPIC_API_KEY` im User-Hinweis muss zu `VITE_GOOGLE_API_KEY`. Nicht explizit im Masterplan-Body (§3 beschreibt nur den `invalid_json`-Case), aber funktional erforderlich. |
| `src/pages/BuilderPage/BuilderPage.tsx` (Zeile 50, Loading-Hint) | Text „Claude arbeitet …" | **Empfehlung.** Provider-neutral machen („LLM arbeitet …") oder auf „Gemini arbeitet …" — Masterplan §7 sagt explizit „Keine UI-Änderungen außer der einen Switch-Case-Umbenennung", d.h. diese Stelle ist aktuell außerhalb des Scope; Inkonsistenz zum neuen Backend sollte im Plan-01 bewusst entschieden werden. |
| `src/llm/buildSystemPrompt.ts` (Zeilen 4, 14 JSDoc; Zeile 47 `emit_site_spec`-Regel im Prompt) | `buildSystemPrompt` → wird nur von `generateSpec.ts` (Zeile 37) und Test-File konsumiert | **Teilweise.** Masterplan §4 sagt `buildSystemPrompt.ts` bleibt „1:1 provider-neutral". Der Prompt-Body ist formal provider-neutral (Markdown + JSON-Schema); allerdings: JSDoc-Kommentar „sent to Claude" / „If Claude still produces bad props" enthält Provider-Namen, und Rule 1 (Zeile 47) sagt „Call the `emit_site_spec` tool exactly once" — das ist Anthropic-Tool-Use-Sprech. Gemini bekommt aber keine Tools, sondern nur `responseMimeType`. Rule 1 müsste inhaltlich anders formuliert sein (z.B. „Return a single JSON object matching the schema below"), sonst schickt Gemini möglicherweise trotzdem Code-Fence-Text statt pures JSON. **Empfehlung:** Plan-01 sollte hier nachschärfen, auch wenn der Masterplan das nicht vorsieht — sonst ist Akzeptanzkriterium „Output-Qualität" gefährdet. `buildSystemPrompt.test.ts` Zeile 56 `expect(prompt).toContain('emit_site_spec')` müsste dann mit-angepasst werden. |
| `validateSpecAgainstRegistry` (`src/builder/validateSpec`) | `generateSpec.ts` (Zeile 71) ruft weiter auf | **Nein.** Trust-Boundary bleibt — Input ist bloß `unknown`, egal ob aus `toolUse.input` oder `JSON.parse(response.text)`. |
| `Renderer` (`src/builder/Renderer`), `getRegistryLLMSurface` (`src/builder/registry`) | indirekt über `ok`-Pfad bzw. Systemprompt-Build | **Nein.** Keine Änderung. |
| `dist/assets/index-*.js` | Built-Artefakt mit altem Anthropic-SDK inline | **Nein** (keine manuelle Änderung); nach dem Swap muss `npm run build` neu ausgeführt werden, sonst bleibt das alte Bundle liegen. Wird durch `npm run build` im Akzeptanzkriterium (§11) abgedeckt. |

### 10.3 Betroffene Tests

| Test-Datei | Anpassung |
|------------|-----------|
| `src/llm/generateSpec.test.ts` | **Umfangreich.** (a) Import `Anthropic` → `GoogleGenAI`. (b) `mockClient`-Factory liefert `{ models: { generateContent } }` statt `{ messages: { create } }`; `resolve`-Payload-Shape wechselt von `{ content: [{ type: 'tool_use', id, name, input }] }` zu `{ text: string }`. (c) Test 1 (Happy-Path, Zeilen 38–59): Mock liefert `{ text: JSON.stringify(VALID_SPEC) }`; Test-Name entfernt „tool_use". (d) Test 3 (API-Error, Zeile 66): Text-Update „messages.create throws" → „generateContent throws". (e) Test 4 (Zeilen 77–90): Kind-Literal `'no_tool_use'` → `'invalid_json'`; Setup liefert `{ text: '' }` oder `{ text: 'not-json' }`; Regex `/tool_use block/` entfällt; optional neue Assertion auf `result.rawText`. (f) Tests 5 & 6 (Zeilen 92–146): Mock-Payloads auf `{ text: JSON.stringify(badInput) }` umstellen; `rawInput`-Assertion bleibt semantisch gleich, da nun `JSON.parse(text)` die Quelle ist. **Gesamt-Test-Count bleibt 6 in dieser Datei** — Feature-Akzeptanz „329 Tests gesamt" (§11) ist erfüllbar. |
| `src/llm/buildSystemPrompt.test.ts` | **Unberührt per Masterplan §4/§5.** Grep nach `Anthropic` liefert 0 Treffer; `emit_site_spec`-Assertion (Zeile 56) bleibt, weil der Prompt-Body nach Plan nicht angefasst wird. **Achtung (Überraschung):** Wenn der Prompt-Body doch provider-neutral formuliert werden sollte (siehe §10.2, `buildSystemPrompt.ts`), müsste hier die Zeile-56-Assertion mit-angepasst werden. Plan-01 sollte das bewusst entscheiden. |
| `e2e/*` (Playwright) | Grep nach `Anthropic`, `claude`, `VITE_ANTHROPIC_API_KEY`, `no_tool_use`, `tool_use`, `messages.create` im `e2e/`-Verzeichnis liefert **0 Treffer**. E2E-Tests sind provider-agnostisch. Keine Anpassung nötig. |
| Sonstige `*.test.ts` / `*.test.tsx` im `src/` | Grep über gesamten `src/`-Baum: keine weitere Datei außer den zwei oben genannten enthält Anthropic-/Claude-/`no_tool_use`-Referenzen. Kein weiterer Test-Impact. |

---

## 11. Akzeptanzkriterien

### Funktionale Kriterien

- [ ] `.env` mit `VITE_GOOGLE_API_KEY=…` → `npm run dev` → Prompt
  eingeben → Generate → Seite wird gerendert (Smoke-Test end-to-end).
- [ ] Leeres `.env` → UI zeigt "Kein API-Key konfiguriert".
- [ ] Ungültiges JSON von Mock-Gemini → UI zeigt "invalid_json"-Panel
  mit `rawText` sichtbar.
- [ ] Validation-Fail (unbekanntes Modul in Gemini-Output) → UI zeigt
  SpecError-Liste.

### Technische Kriterien

- [ ] `@anthropic-ai/sdk` **nicht mehr** in `package.json`.
- [ ] `@google/genai` in `package.json`.
- [ ] Kein `VITE_ANTHROPIC_API_KEY` mehr im Projekt (grep-clean).
- [ ] Kein `Anthropic`-Import im Code (grep-clean).
- [ ] Kein `no_tool_use`-Literal mehr im Code (grep-clean).
- [ ] `npm run build`, `npm run test`, `npm run lint` grün.
- [ ] Test-Count bleibt bei 329 (gleiche Anzahl, nur Inhalte
  angepasst).
- [ ] Keine `// TODO`, keine auskommentierten Code-Blöcke.

### Qualitätskriterien

- [ ] `GenerateResult`-Union weiter diskriminiert, alle 5 Kinds
  exhaustiv in BuilderPage-Switch.
- [ ] `client.ts` lazy + Singleton-Pattern erhalten.
- [ ] JSDoc auf Top-Level-Exporten aktualisiert (keine
  Anthropic-Referenzen mehr).

---

## 12. Nächste Schritte

Nach Freigabe:
1. `impact-analyzer` → Sektion 9 + 10 befüllen.
2. Einen einzigen Implementierungsplan erstellen: `01_Provider_Swap.md`.
3. Größen-Check.
4. Kohärenz-Check (trivial bei einem Plan).
5. `/execute`.

---

*Erstellt am: 2026-04-15*
*Letzte Aktualisierung: 2026-04-15*
