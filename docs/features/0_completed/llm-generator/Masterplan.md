# LLM Generator — Masterplan

## Status
- [x] Phase 1: Masterplan
- [x] Phase 1b: Impact-Analyse
- [x] Phase 2: Implementierungspläne
- [x] Phase 2b: Sub-Pläne (nicht nötig — alle Pläne unter Schwellwert)
- [x] Phase 2c: Kohärenz-Check
- [x] Implementierung gestartet
- [x] Cleanup-Validierung
- [x] Feature abgeschlossen

## 1. Ziel

**Was soll erreicht werden?**

Der Prototyp demonstriert end-to-end "Prompt → Website":

1. Nutzer öffnet die lokal laufende App.
2. Tippt eine kurze Beschreibung ("Eine Landing-Page für ein Café in Berlin, warm und gemütlich").
3. Klickt "Generate".
4. Die App ruft Anthropic Claude mit dem aus `getRegistryLLMSurface()`
   abgeleiteten System-Prompt an; Claude emittiert über Tool-Use eine
   komplette `SiteSpec`.
5. `validateSpecAgainstRegistry()` filtert die Ausgabe. Bei Erfolg
   rendert der bestehende `Renderer` die Seite. Bei Fehler wird die
   Fehler-Liste im UI angezeigt, die Seite bleibt leer.

Das ist eine **one-shot, read-only Demo**: keine Editierbarkeit, kein
Feedback-Loop, keine Persistenz. Wenn der Nutzer ein anderes Ergebnis
will, tippt er einen neuen Prompt und klickt erneut Generate.

**Anwendungsfall:**

- Demo-Pitch: "Gib mir eine Website-Idee, ich zeig dir in 10 Sekunden
  das Resultat."
- Interne Exploration: Wie gut kann Claude mit dem aktuellen Modul-Set
  arbeiten? Welche Module fehlen? Welche Theme-Overrides sind sinnvoll?

## 2. Ist-Zustand

**Aktuelle Implementierung:**

- [src/App.tsx](../../../src/App.tsx) rendert eine hart-kodierte Demo-Spec
  mit Edit-Mode-Toolbar. Kein LLM, kein Input.
- [src/builder/schemas.ts](../../../src/builder/schemas.ts) exportiert
  `SiteSpecSchema`, `BlockSpec`, `SiteSpec`.
- [src/builder/validateSpec.ts](../../../src/builder/validateSpec.ts)
  exportiert `validateSpecAgainstRegistry` mit `{ ok, spec } | { ok, errors }`.
- [src/builder/registry.ts](../../../src/builder/registry.ts) exportiert
  `getRegistryLLMSurface()` → `{ modules, siteSpecJSONSchema }`.
- Keine LLM-Integration, keine Anthropic-Dependency, keine `.env`-Infra,
  keine UI für Input.

**Probleme / Lücke:**

Das Fundament (Validierung + LLM-Surface) ist da, aber nichts nutzt es.
Der Renderer bekommt weiterhin die hart-kodierte Demo-Spec.

**Relevante Dateien:**

- `src/App.tsx` — wird ersetzt.
- `src/builder/registry.ts` — geliefert, wird konsumiert.
- `src/builder/schemas.ts` + `validateSpec.ts` — geliefert, werden konsumiert.
- `src/builder/Renderer.tsx` — unverändert, rendert die validierte Spec.
- `package.json` — neue Dependency `@anthropic-ai/sdk`.
- `vite.config.ts` — unverändert (Vite liest `VITE_*` env-vars automatisch).

## 3. Soll-Zustand

**Gewünschtes Verhalten:**

### Neue Dateien

```
src/llm/
├── client.ts                 # Singleton Anthropic-SDK-Instance (oder null bei fehlendem Key)
├── buildSystemPrompt.ts      # RegistryLLMSurface → formatted system prompt string
├── generateSpec.ts           # orchestrator: prompt + registry surface → validated SiteSpec
├── types.ts                  # GenerateResult union, GenerateError variants
├── buildSystemPrompt.test.ts # unit test, keine Netzwerk-Calls
└── generateSpec.test.ts      # unit test mit gemocktem SDK

src/pages/BuilderPage/
├── BuilderPage.tsx           # UI: textarea + generate-button + status + rendered spec
├── BuilderPage.css           # Tokens only, minimal styling
└── index.ts                  # re-exports

.env.example                  # Vorlage mit VITE_ANTHROPIC_API_KEY=
```

### Geänderte Dateien

- `src/App.tsx` — wird thin shell: `return <BuilderPage />`. Kein
  EditModeProvider, keine EditModeToolbar, keine hart-kodierte Spec.
- `package.json` — neue Dependency `@anthropic-ai/sdk`.
- `.gitignore` — `.env` hinzufügen (falls nicht schon drin).

### GenerateResult Shape

```ts
export type GenerateResult =
    | { kind: 'ok';                spec: SiteSpec }
    | { kind: 'validation_failed'; errors: SpecError[]; rawInput: unknown }
    | { kind: 'api_error';         message: string }
    | { kind: 'missing_key'; }
    | { kind: 'no_tool_use';       message: string };
```

Fünf Kinds decken alle erwarteten Ausgänge ab:
- `ok` — Spec ist valide, rendern.
- `validation_failed` — Claude hat Spec geliefert, aber Props passen
  nicht zu den Modul-Schemas oder Modul-Typ unbekannt. `rawInput` ist
  das unvalidierte JSON zum Debugging.
- `api_error` — Netzwerk, 401, Rate-Limit, etc.
- `missing_key` — `VITE_ANTHROPIC_API_KEY` ist leer oder fehlt.
- `no_tool_use` — Claude hat geantwortet, aber kein `tool_use`-Block
  in `response.content` gefunden (sollte bei `tool_choice` nie passieren,
  als Defense-in-Depth aber explizit).

### User-Flow

1. BuilderPage mountet. UI zeigt Textarea (placeholder "Beschreibe deine Website…") und Generate-Button.
2. Nutzer tippt, klickt Generate.
3. Button wird disabled, Status wechselt zu "generating…".
4. `generateSpec(prompt)` wird aufgerufen:
   - Liest Registry Surface via `getRegistryLLMSurface()`.
   - Baut System-Prompt via `buildSystemPrompt(surface)`.
   - Ruft `client.messages.create({ model, system, messages, tools, tool_choice })` auf.
   - Extrahiert `tool_use.input` aus Response.
   - Ruft `validateSpecAgainstRegistry(input)` auf.
   - Rückgabe: `GenerateResult`.
5. UI handelt die 5 Kinds ab:
   - `ok` → `<Renderer spec={…} />` unterhalb des Eingabefelds.
   - alle anderen → formatted Error-Panel mit Details.
6. Button wird wieder aktivierbar. Nutzer kann neuen Prompt geben und
   erneut generieren — neue Spec ersetzt die alte.

### Model-Entscheidung

**Default-Model:** `claude-sonnet-4-6` (per Systeminstruktion der
aktuellen Claude-Familie). Sonnet ist schnell, günstig, gut in
strukturiertem Output. Kein Fallback, keine Model-Auswahl-UI für MVP.

### Tool-Use-Vertrag

Ein einziges Tool:

```ts
{
  name: "emit_site_spec",
  description: "Emit the final site specification. Call this exactly once.",
  input_schema: surface.siteSpecJSONSchema
}
```

`tool_choice: { type: "tool", name: "emit_site_spec" }` erzwingt, dass
Claude genau dieses Tool aufruft. `tool_use.input` ist dann unser
`unknown`-Input für `validateSpecAgainstRegistry`.

**System-Prompt** ergänzt die Shape um semantischen Kontext:

- Rolle: "Du bist ein Webdesigner-Assistent, der aus einer
  Nutzer-Beschreibung eine strukturierte Website-Spec erzeugt."
- Constraint: "Verwende ausschließlich die folgenden Module" gefolgt
  von pro Modul `name`, `category`, `description`, `tags` (falls da),
  und `propsJSONSchema` (pretty-printed).
- Constraint: "Die Spec hat diese äußere Form:" + `siteSpecJSONSchema`
  (pretty-printed).
- Theme-Leitfaden: "Überschreibe CSS-Variablen via `spec.theme`:
  `primary`, `secondary`, `accent`, `background`, `surface`, `text`,
  `muted_text`, `inverted_text`."
- Output-Konvention: "Rufe `emit_site_spec` **genau einmal** auf.
  Keine Prosa, keine Erklärung."

## 4. Architektur-Entscheidungen

### Warum SDK, nicht raw fetch, nicht Proxy

- `@anthropic-ai/sdk` mit `dangerouslyAllowBrowser: true` — gibt
  typisierte Message-Create-API, Retries, Error-Klassen umsonst.
- Sicherheits-Caveat: API-Key landet im Browser-Bundle, für jeden
  einsehbar, der DevTools öffnet. **Nur für lokale Dev-Demo akzeptabel.**
  Wird im README / `.env.example` dokumentiert. Für eine spätere
  Deployment-Version würde ein Vite-Middleware-Proxy (oder ein
  separates Backend) den Key server-seitig halten — explizit
  out-of-scope.

### Modul-Schemas im System-Prompt, nicht im Tool-Schema

Das Tool-`input_schema` beschreibt nur die äußere SiteSpec-Form:
`blocks` ist ein Array von `{ id?, type: string, props: Record<string, unknown> }`. Die propsJSONSchemas pro Modul landen als Markdown-Abschnitt
im System-Prompt.

Alternativen verworfen:
- `oneOf` auf Block-Ebene, diskriminiert nach `type`: müsste manuell
  zusammengestellt werden, `z.toJSONSchema` leistet das nicht automatisch.
  Komplex, fragil, für MVP nicht nötig.
- Ein Tool pro Modul: würde den LLM zwingen, Block-Folgen als
  Tool-Use-Kette zu senden. Mehr Roundtrips, mehr Code.

Die gewählte Lösung nutzt `validateSpecAgainstRegistry` als
Safety-Net: wenn Claude `props` falsch ausfüllt, kommt eine klare
Fehler-Liste zurück. Das ist die saubere Trennung, die wir bewusst
im vorherigen Feature gebaut haben.

### Edit-Mode: dead code, nicht gelöscht

- App.tsx mountet `EditModeProvider` und `EditModeToolbar` nicht mehr.
- Alle 13 Modul-Komponenten rufen weiter `useEditableText` /
  `<EditableImage>` auf. Diese Hooks geben ohne Provider `{}` zurück
  (Default-Context-Werte in `editModeStore.ts` setzen `isEditMode: false`).
  Kein Crash, keine Edit-UI, Modul rendert plain.
- Ein separates Cleanup-Feature kann den Edit-Mode später komplett
  entfernen; das würde 13 Modul-Dateien + Hooks + Toolbar + EditableImage
  betreffen und ist ein eigenes Refactoring.

### Keine Persistenz, kein Auto-Retry, kein Streaming

- Spec lebt nur in React-State. Page-Reload = neuer Start.
- Bei Validierungsfehler: Errors zeigen, Spec leer lassen, kein
  automatischer zweiter Call.
- Response non-streaming — simpler Code, MVP-Priorität. Bei einer
  5-sekündigen Wartezeit reicht ein Spinner.

### API-Key über Vite-Env

- `VITE_ANTHROPIC_API_KEY` in `.env` (lokal, nicht committed).
- Vite macht `VITE_*`-Variablen client-seitig via `import.meta.env.VITE_ANTHROPIC_API_KEY`
  verfügbar. Andere (nicht-VITE-prefixed) Variablen bleiben server-seitig.
- Wenn leer: `client.ts` exportiert einen Sentinel (z.B. `null`) statt
  eine Instanz; `generateSpec` reagiert mit `kind: 'missing_key'`.
- `.env.example` ist committed und dokumentiert den erwarteten Namen.

## 5. Beachtenswertes

### Sicherheit

- API-Key im Browser-Bundle ist **bewusst akzeptiert** für Dev-Demo.
  Dokumentieren in `.env.example` + README-Hinweis.
- Nicht committen: `.env` muss in `.gitignore`.
- Keine anderen Secrets — die LLM-Surface und User-Prompts sind
  harmlos.

### Kosten

- Claude Sonnet 4.6: grob $3/Mio Input-Tokens, $15/Mio Output.
- Eine Site-Generation: ca. 4-6k Input (System-Prompt inkl. aller
  Modul-JSON-Schemas) + 1-2k Output (Spec-JSON).
- Pro Call: ~1-3 Cent. Anthropic-Neuaccount-Credits (~$5) reichen für
  100+ Calls.

### Performance

- End-to-End latency: Netzwerk + Claude-TTFT + Generation ≈ 2-8s.
- Für MVP: einfacher Spinner. Keine Stream-Optimierung.

### Fehlerbehandlung

- Alle fünf `GenerateResult`-Kinds haben dedizierte UI-Darstellung.
- Raw LLM-Output bei `validation_failed` als collapsible `<details>`
  sichtbar → Nutzer/Dev kann sehen, was Claude produziert hat.

### Tests

- `buildSystemPrompt.test.ts`: reine String-Tests. Prüft, dass alle
  13 Modul-Namen im Prompt vorkommen, dass Theme-Keys gelistet sind,
  dass das SiteSpec-JSON-Schema eingebettet ist.
- `generateSpec.test.ts`: mockt `client.messages.create`, prüft:
  - Happy-Path (mock response → validierte Spec → `kind: 'ok'`).
  - Missing-Key (mock: Client ist null) → `kind: 'missing_key'`.
  - SDK wirft APIError → `kind: 'api_error'`.
  - Response hat kein tool_use → `kind: 'no_tool_use'`.
  - Claude liefert Spec mit unbekanntem Modul → `kind: 'validation_failed'`.
- UI-Tests für BuilderPage: optional im MVP. Renderer + Komponenten
  sind bereits getestet; der BuilderPage ist Glue-Code um
  `generateSpec` + `Renderer`, und die Einheiten sind beide separat
  getestet.

### Migration

Keine — Edit-Mode-Code bleibt kompilierfähig, aber wird nicht mehr
gemountet. Wer die alte Demo-Seite sehen will, kann `App.tsx` lokal
rückgängig machen oder auf einen früheren Commit gehen.

## 6. Abhängigkeiten

**Voraussetzungen:**

- Feature `llm-foundation` abgeschlossen (✓ unter
  `docs/features/0_completed/llm-foundation/`). Liefert:
  `SiteSpecSchema`, `validateSpecAgainstRegistry`,
  `getRegistryLLMSurface`.
- Anthropic-Account + API-Key (wird im .env eingetragen).

**Betroffene Features:**

- `edit-mode` (bereits geliefert) — wird nicht mehr gemountet. Kein
  Codewechsel in Edit-Mode-Dateien.
- `llm-foundation` — reine Konsumption, keine Änderung.

**Externe Abhängigkeiten:**

- **Neu:** `@anthropic-ai/sdk` (aktuelle Version, empfohlen `^0.50.x`
  oder höher, weil Tool-Use, typed messages stable sind).

## 7. Nicht-Ziele

**Explizit NICHT Teil dieses Features:**

- Kein Feedback-Loop, keine Iteration über die generierte Spec.
- Keine Editierbarkeit der generierten Website.
- Kein kompletter Edit-Mode-Cleanup.
- Keine Persistenz (localStorage / Datei-Export).
- Kein Streaming, kein Auto-Retry.
- Kein Multi-Turn-Chat.
- Keine Deployment-Story, kein Proxy, kein Backend.
- Keine neuen Module.
- Keine UI-Tests für BuilderPage (Unit-Tests der Einheiten reichen).

**Spätere Erweiterungen (out of scope):**

- Streaming-Response mit Progressive Render.
- Follow-up-Prompt "make it more X" der die aktuelle Spec als Kontext mitgibt.
- Snapshot-Export als JSON-Datei.
- Theme-Picker als manuelle UI-Override.
- Vite-Middleware-Proxy zur sicheren API-Key-Handhabung.
- Kompletter Edit-Mode-Abbau.

## 8. Offene Fragen

- [ ] **`@anthropic-ai/sdk` Version:** Neueste stabile. Ich prüfe zur
  Implementierungszeit und pinne auf `^<latest>.0`. Falls das Tool-Use-API
  dort eine andere Shape hat als erwartet (Anthropic hat's stabilisiert,
  aber minor Drifts passieren), justieren in Plan 02.
- [ ] **Prompt-Tuning:** Der initiale System-Prompt ist ein Best-Guess.
  Erste Tests werden zeigen, ob Claude Theme-Tokens vernünftig setzt und
  ob Containers sinnvoll genutzt werden. Iteration happens post-MVP,
  nicht in diesem Feature.
- [ ] **Modell-Name-Drift:** Dokumentiere, dass `claude-sonnet-4-6`
  der aktuell empfohlene Name ist. Falls sich das in 6 Monaten ändert,
  ist es nur eine Zeile in `generateSpec.ts`.

---

## 9. Was muss weg (Impact-Analyse)

> Wird vom `impact-analyzer` in Phase 1b befüllt.

### 9.1 Zu löschende Dateien

| Datei | Grund für Löschung |
|-------|-------------------|
| — (keine) | Kein komplettes File wird gelöscht. `src/App.tsx` wird ersetzt (siehe 9.2), nicht entfernt. `src/App.css` bleibt erhalten, weil die Shared-Primitives (`.vertical_layout`, `.section`, `.card`, `.card__*`) weiterhin von `src/builder/Renderer.tsx:25` und allen Modul-CSS-Dateien verwendet werden. Edit-Mode-Dateien bleiben laut Masterplan §4 bewusst als dead code erhalten. |

### 9.2 Zu löschender Code

| Datei | Element | Grund |
|-------|---------|-------|
| `src/App.tsx` | Z. 1 `import { useState } from 'react';` | Kein lokaler Spec-State mehr in App — Spec-State zieht in `BuilderPage`. |
| `src/App.tsx` | Z. 3 `import Renderer from './builder/Renderer';` | Renderer wird nicht mehr direkt von App gemountet, sondern von `BuilderPage`. |
| `src/App.tsx` | Z. 4 `import { EditModeProvider } from './builder/EditModeContext';` | App.tsx mountet den Provider nicht mehr (Edit-Mode bleibt als dead code bestehen). |
| `src/App.tsx` | Z. 5 `import { EditModeToolbar } from './builder/EditModeToolbar';` | Toolbar wird nicht mehr gemountet. |
| `src/App.tsx` | Z. 6 `import { specFromTypes } from './builder/specHelpers';` | `DEMO_SPEC` entfällt; `specFromTypes` wird nicht mehr in App benötigt (bleibt Export, weil Tests es nutzen — siehe 10.2). |
| `src/App.tsx` | Z. 7 `import type { SiteSpec } from './builder/schemas';` | Kein `SiteSpec`-State mehr in App. |
| `src/App.tsx` | Z. 9–17 `const DEMO_SPEC: SiteSpec = specFromTypes([...])` | Hart-kodierte Demo-Spec wird durch LLM-generierte Spec in `BuilderPage` ersetzt. |
| `src/App.tsx` | Z. 20 `const [spec, setSpec] = useState<SiteSpec>(DEMO_SPEC);` | State-Besitz wandert nach `BuilderPage`. |
| `src/App.tsx` | Z. 22–27 JSX `<EditModeProvider>…<Renderer/>…<EditModeToolbar/></EditModeProvider>` | Wird durch `<BuilderPage />` ersetzt. |

**Erhalten bleibt in `src/App.tsx`:** `import './App.css';` (Z. 2) und `export default App;` (Z. 30). App.css muss weiter importiert werden (entweder in App.tsx oder BuilderPage/main.tsx), damit `.vertical_layout`, `.section`, `.card` global verfügbar bleiben — sonst bricht Renderer + alle Sections optisch.

### 9.3 Veraltete Patterns

| Altes Pattern | Neues Pattern | Betroffene Stellen |
|---------------|---------------|-------------------|
| Hart-kodierte `DEMO_SPEC` via `specFromTypes([...])` in App.tsx | LLM-generierte Spec via `generateSpec(prompt)`, gehalten als State in `BuilderPage` | `src/App.tsx:9–17` |
| Root-Mount von `EditModeProvider` + `EditModeToolbar` um den Renderer | Kein Provider, kein Toolbar-Mount; Hooks (`useEditableText`, `EditableImage`) liefern via Default-Context no-op-Werte | `src/App.tsx:22–27` |
| Spec-State direkt in `App` | Spec-State in `BuilderPage` (inkl. Prompt-Input, Loading-Status, `GenerateResult`-Handling) | `src/App.tsx:20` → neuer Ort: `src/pages/BuilderPage/BuilderPage.tsx` |

---

## 10. Betroffene Aufrufer (Impact-Analyse)

> Wird vom `impact-analyzer` in Phase 1b befüllt.

### 10.1 Direkte Aufrufer

| Datei | Zeile | Aktuell | Neu |
|-------|-------|---------|-----|
| `src/main.tsx` | 4 `import App from './App.tsx'` | Rendert `<App />`, erwartet ein Default-Export-Component ohne Props | Unverändert. `App` bleibt Default-Export, nur der Body wird zu `return <BuilderPage />`. Kein Eingriff in main.tsx nötig. |
| `src/App.tsx` | gesamter Body | Siehe 9.2 — hart-kodierte Demo + EditMode-Provider-Mount | `return <BuilderPage />;` + Import `import { BuilderPage } from './pages/BuilderPage';` (oder `./pages/BuilderPage/BuilderPage`). `import './App.css';` bleibt erhalten. |

### 10.2 Transitive Aufrufer

| Datei | Kette | Änderung nötig? |
|-------|-------|-----------------|
| `src/builder/specHelpers.ts` (`specFromTypes`) | App.tsx → specHelpers | Nein. `specFromTypes` verliert den App.tsx-Konsumenten, wird aber weiter genutzt von `src/builder/Renderer.test.tsx:6,319,331,346,356,370,376,383,392` und `src/builder/validateSpec.test.ts:3,7`. Datei bleibt. |
| `src/builder/EditModeContext.tsx` (`EditModeProvider`) | App.tsx → EditModeContext | Nein. Provider wird nicht mehr von App gemountet, aber weiter von Tests konsumiert: `src/test/renderWithProviders.tsx:3,27–29`, `src/elements/components.test.tsx:3,31–33`, `src/builder/Renderer.test.tsx:4,14–16`, `src/builder/editMode.test.tsx:5,68–70,252–257,346–354,382–390,411–426,452–467,549–552`. Edit-Mode-Code bleibt dead-but-compilable. |
| `src/builder/EditModeToolbar.tsx` | App.tsx → EditModeToolbar | Nein. Wird nicht mehr gemountet, aber weiter getestet in `src/builder/editMode.test.tsx:6,485–552`. Datei bleibt. |
| `src/App.css` (`.vertical_layout`, `.section`, `.card*`) | App.tsx → App.css; Renderer.tsx → `.vertical_layout` (`src/builder/Renderer.tsx:25`); Modul-CSS → `.section`/`.card*` | **Ja — kritisch:** Der `import './App.css';` muss irgendwo im Live-Bundle erhalten bleiben. Empfehlung: `App.tsx` behält Z. 2 (`import './App.css';`). Würde er entfernt, würden `.vertical_layout` (Renderer), `.section`/`.card*` (alle Content-Module) und die horizontale Layout-Klasse fehlen — **visueller Breaker für alle Module**. Impact-blind erkennbar nur hier. |
| `src/builder/Renderer.tsx` | wird von neuer `BuilderPage` importiert statt App | Nein. Schnittstelle `<Renderer spec={…} />` unverändert. |
| `src/builder/schemas.ts` (`SiteSpec`) | bisher App.tsx → schemas; neu BuilderPage → schemas | Nein. Nur Import-Ort wandert. |
| Edit-Mode-Default-Context (`editModeStore.ts`) | Modul-Komponenten → `useEditableText`/`EditableImage` ohne mounted Provider → liefert no-op-Werte | Nein. Entscheidung in Masterplan §4 („Edit-Mode: dead code") bestätigt: Default-Context muss bereits `isEditMode: false` + harmlose No-Ops liefern (stimmt mit Feature-Vorgabe überein). Kein Codewechsel, aber **Prä-Condition: beim Implementieren smoke-testen, dass ein Modul ohne Provider nicht crasht.** |

### 10.3 Betroffene Tests

| Test-Datei | Anpassung |
|------------|-----------|
| `src/builder/validateSpec.test.ts` | Keine. Importiert `specFromTypes` direkt aus `./specHelpers` (Z. 3), nicht aus App.tsx. Bleibt grün. |
| `src/builder/Renderer.test.tsx` | Keine. Nutzt eigenen `EditModeProvider`-Wrapper (Z. 4, 10–16) und `specFromTypes` (Z. 6) direkt. Unabhängig von App.tsx. |
| `src/builder/editMode.test.tsx` | Keine. Testet `EditModeProvider` + `EditModeToolbar` + Hooks direkt (Z. 5–6). Da Edit-Mode-Dateien laut Feature-Vorgabe erhalten bleiben, bleibt dieser Test grün. |
| `src/elements/components.test.tsx` | Keine. Rendert Module in einem eigenen `EditModeProvider` (Z. 3, 31–33). |
| `src/test/renderWithProviders.tsx` | Keine. Test-Helper bleibt unverändert (Z. 3, 14, 27–29). |
| `src/builder/blockIds.test.ts`, `src/builder/propPath.test.ts` | Keine. Rein logikbasiert, keine App.tsx-Abhängigkeit. |
| Neue Tests: `src/llm/buildSystemPrompt.test.ts`, `src/llm/generateSpec.test.ts` | **Neu anzulegen** in Plan 02_LLM_Layer. Siehe Masterplan §5 „Tests" für erwartete Cases. |
| **Kein Test importiert aus `src/App.tsx`** — App-Replacement bricht keinen bestehenden Test. |

---

## 11. Akzeptanzkriterien

### Funktionale Kriterien

- [ ] `.env` mit `VITE_ANTHROPIC_API_KEY=sk-…` → `npm run dev` → Prompt
  eingeben → Generate → Seite wird sichtbar gerendert.
- [ ] Leeres `.env` → UI zeigt klare Nachricht "Kein API-Key konfiguriert"
  (kein Crash, kein Netzwerk-Call).
- [ ] LLM liefert ungültige Spec (manuell provoziert oder via Mocks) →
  UI zeigt SpecError-Liste mit Pfaden.
- [ ] Neuer Prompt ersetzt bestehende Spec, kein State-Leak.
- [ ] Beim Rendern der generierten Spec sind keine Edit-UI-Artefakte
  sichtbar (keine contentEditable-Outlines, keine Toolbar).

### Technische Kriterien

- [ ] `npm run build` grün.
- [ ] `npm run test` grün, inkl. der neuen `buildSystemPrompt`- und
  `generateSpec`-Unit-Tests.
- [ ] `npm run lint` ohne neue Fehler.
- [ ] Keine `// TODO` im neuen Code.
- [ ] Keine auskommentierten Code-Blöcke.
- [ ] `.env` ist in `.gitignore`.

### Qualitätskriterien

- [ ] `src/llm/` Dateien haben JSDoc auf Top-Level-Exporten.
- [ ] `BuilderPage.css` nutzt nur Tokens, keine hardcoded Farben/Maße.
- [ ] `GenerateResult` ist diskriminiert; alle fünf Kinds werden im UI
  explizit gematcht.
- [ ] `client.ts` erzeugt den SDK-Client lazy und nur einmal.

---

## 12. Nächste Schritte

Nach Freigabe:
1. `impact-analyzer` ausführen → Sektion 9 + 10 befüllen.
2. Erstellung der Implementierungspläne:
   - `01_Dependency_And_Env.md` — SDK installieren, .env/.gitignore
   - `02_LLM_Layer.md` — `src/llm/` (client, buildSystemPrompt, generateSpec, types) + Unit-Tests
   - `03_BuilderPage.md` — UI + App.tsx-Replacement
3. Größen-Check.
4. Kohärenz-Check.
5. Bereit für `/execute`.

---

*Erstellt am: 2026-04-14*
*Letzte Aktualisierung: 2026-04-14*
