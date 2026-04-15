# LLM Generator — Plan 03: BuilderPage + App.tsx Replacement

## Übersicht

| Aspekt | Details |
|--------|---------|
| **Ziel** | `BuilderPage` erstellen (Textarea + Generate-Button + Status-Anzeige + Renderer-Bereich). `src/App.tsx` ersetzen: ohne EditModeProvider/Toolbar/DEMO_SPEC, nur `<BuilderPage />`. `App.css`-Import bleibt (kritisch für Shared-Primitives). |
| **Abhängig von** | Plan 02 (`generateSpec`, `GenerateResult` verfügbar) |
| **Betroffene Bereiche** | Frontend (Pages + App-Shell) |
| **Geschätzte Komplexität** | Mittel |

### Größen-Check

| Metrik | Wert | Schwellwert | OK? |
|--------|------|-------------|-----|
| Implementierungsschritte | 4 | >8 | ✓ |
| Neue Dateien | 2 (Index-Re-Export zählt nicht) | >5 | ✓ |
| Zu ändernde Dateien | 1 (App.tsx) | >10 | ✓ |

## Schnittstellen (Kohärenz-Vertrag)

### Inputs

| Von Plan | Was wird erwartet | Konkret |
|----------|-------------------|---------|
| Plan 02 | `generateSpec(prompt): Promise<GenerateResult>` | `src/llm/generateSpec.ts` |
| Plan 02 | `GenerateResult` als diskriminierte Union mit 5 Kinds | `src/llm/types.ts` |
| (llm-foundation) | `<Renderer spec={…} />`-Komponente | `src/builder/Renderer.tsx` |
| (Impact-Analyse) | `App.css` bleibt als global-Import in `App.tsx` erhalten | Pflicht: sonst brechen `.vertical_layout`, `.section`, `.card*` |

### Outputs

Keine (finaler Plan).

### Architektur-Entscheidungen

- **BuilderPage hält den State:** `prompt`, `status` (Union: idle / loading / GenerateResult-Kind), `result` (letztes `GenerateResult`). Kein Context, kein externes Store — Single-Page-State reicht.
- **Exhaustives Match auf `GenerateResult.kind`:** switch/case über alle fünf Kinds, TypeScript erzwingt Vollständigkeit über `never`-Default.
- **Error-Darstellung:** eigenes `<ErrorPanel>`-Subkomponent mit zwei Varianten (einfache Message vs. SpecError-Liste mit Raw-Output als `<details>`). Minimal gestylt, Tokens-only.
- **Keine Tests für BuilderPage:** bewusst out-of-scope. Units (generateSpec + Renderer) sind separat getestet. UI-Glue ist klein genug, dass Integration per Auge+Smoke-Test ausreicht.
- **App.css stays:** der `import './App.css';` bleibt in `App.tsx` (Zeile 2 heute) — siehe Impact-Analyse 10.2. Diese Datei liefert `.vertical_layout` für den Renderer und `.section`/`.card`-Primitives für alle Module.

## Voraussetzungen

- [ ] Plan 02 abgeschlossen, `generateSpec` importierbar.
- [ ] `editModeStore.ts` Default-Context-Werte (isEditMode: false) verifiziert — ohne Provider dürfen Module-Hooks kein Fehler werfen. (Smoke-Test im Schritt 4: App starten, `npm run dev`, sehen ob Module plain rendern.)

## Betroffene Dateien

### Neue Dateien

| Datei | Beschreibung |
|-------|--------------|
| `src/pages/BuilderPage/BuilderPage.tsx` | Haupt-Komponente: Textarea, Button, Status, Renderer. |
| `src/pages/BuilderPage/BuilderPage.css` | BEM-scoped Styles, Tokens only. |
| `src/pages/BuilderPage/index.ts` | `export { BuilderPage } from './BuilderPage';` — re-export. |

### Zu ändernde Dateien

| Datei | Art der Änderung |
|-------|------------------|
| `src/App.tsx` | Body wird ersetzt: alle EditMode/DEMO_SPEC-Referenzen raus, stattdessen `<BuilderPage />`. `App.css`-Import bleibt! |

### Zu löschende Dateien/Code

| Datei | Was wird gelöscht | Grund |
|-------|-------------------|-------|
| `src/App.tsx` Z. 1, 3-7, 9-17, 20, 22-27 | Siehe Masterplan 9.2 — alles außer `import './App.css';` und `export default App;` | Wird durch `<BuilderPage />`-Mount ersetzt. |

## Implementierung

### Schritt 1: `src/pages/BuilderPage/BuilderPage.tsx`

**Datei:** `src/pages/BuilderPage/BuilderPage.tsx` (neu)

```tsx
import { useState } from 'react';
import './BuilderPage.css';
import Renderer from '../../builder/Renderer';
import { generateSpec } from '../../llm/generateSpec';
import type { GenerateResult } from '../../llm/types';

type UIStatus = 'idle' | 'loading' | 'done';

export function BuilderPage() {
    const [prompt, setPrompt] = useState('');
    const [status, setStatus] = useState<UIStatus>('idle');
    const [result, setResult] = useState<GenerateResult | null>(null);

    async function onGenerate() {
        const trimmed = prompt.trim();
        if (!trimmed || status === 'loading') return;

        setStatus('loading');
        setResult(null);
        const next = await generateSpec(trimmed);
        setResult(next);
        setStatus('done');
    }

    return (
        <div className="builder_page">
            <section className="builder_page__input">
                <h1 className="builder_page__title">Prompt → Website</h1>
                <textarea
                    className="builder_page__textarea"
                    placeholder="Beschreibe deine Website, z. B. 'Landing-Page für ein Café in Berlin, warm und gemütlich'."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                />
                <button
                    className="builder_page__button"
                    onClick={onGenerate}
                    disabled={status === 'loading' || prompt.trim() === ''}
                >
                    {status === 'loading' ? 'Generating…' : 'Generate'}
                </button>
            </section>

            <section className="builder_page__output">
                {status === 'idle' && (
                    <p className="builder_page__hint">Gib einen Prompt ein und klicke Generate.</p>
                )}
                {status === 'loading' && (
                    <p className="builder_page__hint">Claude arbeitet …</p>
                )}
                {status === 'done' && result && <ResultView result={result} />}
            </section>
        </div>
    );
}

function ResultView({ result }: { result: GenerateResult }) {
    switch (result.kind) {
        case 'ok':
            return <Renderer spec={result.spec} />;
        case 'missing_key':
            return (
                <ErrorPanel
                    title="Kein API-Key konfiguriert"
                    detail="Trage VITE_ANTHROPIC_API_KEY in deiner .env ein und starte den Dev-Server neu."
                />
            );
        case 'api_error':
            return <ErrorPanel title="API-Fehler" detail={result.message} />;
        case 'no_tool_use':
            return <ErrorPanel title="Unerwartete LLM-Antwort" detail={result.message} />;
        case 'validation_failed':
            return (
                <ErrorPanel
                    title="Generierte Spec ist ungültig"
                    detail={formatSpecErrors(result.errors)}
                    rawInput={result.rawInput}
                />
            );
        default: {
            const _exhaustive: never = result;
            return null;
        }
    }
}

function ErrorPanel({
    title,
    detail,
    rawInput,
}: {
    title: string;
    detail: string;
    rawInput?: unknown;
}) {
    return (
        <div className="builder_page__error">
            <strong>{title}</strong>
            <pre className="builder_page__error-detail">{detail}</pre>
            {rawInput !== undefined && (
                <details className="builder_page__error-raw">
                    <summary>Raw LLM output</summary>
                    <pre>{JSON.stringify(rawInput, null, 2)}</pre>
                </details>
            )}
        </div>
    );
}

function formatSpecErrors(errors: Array<{ path: string; message: string }>): string {
    return errors.map((e) => `• ${e.path || '(root)'}: ${e.message}`).join('\n');
}
```

**Erklärung:**
- `UIStatus` ist eine kleine Zustandsmaschine — idle → loading → done. Reicht für one-shot.
- Der `default`-Zweig in `ResultView` macht ein `_exhaustive: never`-Cast. Wenn jemand später einen sechsten Kind hinzufügt, bricht der Build genau hier — gewollt.
- `ErrorPanel` mit optionalem `rawInput` deckt alle Error-Kinds ab.

### Schritt 2: `src/pages/BuilderPage/BuilderPage.css`

**Datei:** `src/pages/BuilderPage/BuilderPage.css` (neu)

```css
.builder_page {
    display: flex;
    flex-direction: column;
    gap: var(--space_lg);
    padding: var(--space_lg);
    background: var(--background);
    color: var(--text);
    min-height: 100vh;
}

.builder_page__input {
    display: flex;
    flex-direction: column;
    gap: var(--space_sm);
    max-width: 720px;
    width: 100%;
    align-self: center;
}

.builder_page__title {
    margin: 0;
    font-size: 1.4rem;
}

.builder_page__textarea {
    width: 100%;
    padding: var(--space_sm);
    border: 1px solid var(--muted_text);
    border-radius: var(--radius_sm);
    background: var(--surface);
    color: var(--text);
    resize: vertical;
}

.builder_page__button {
    align-self: flex-start;
    padding: var(--space_sm) var(--space_md);
    border: none;
    border-radius: var(--radius_sm);
    background: var(--primary);
    color: var(--inverted_text);
    cursor: pointer;
}

.builder_page__button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.builder_page__output {
    width: 100%;
}

.builder_page__hint {
    color: var(--muted_text);
    text-align: center;
}

.builder_page__error {
    max-width: 720px;
    margin: 0 auto;
    padding: var(--space_md);
    border: 1px solid var(--muted_text);
    border-radius: var(--radius_sm);
    background: var(--surface);
}

.builder_page__error-detail {
    white-space: pre-wrap;
    font-family: inherit;
    margin: var(--space_sm) 0 0;
}

.builder_page__error-raw pre {
    max-height: 300px;
    overflow: auto;
    background: var(--background);
    padding: var(--space_sm);
    border-radius: var(--radius_sm);
    font-size: 0.85rem;
}
```

**Erklärung:**
- Tokens only, kein Hex, kein Pixel — passt zum Projekt-Styling-Contract (siehe CLAUDE.md).
- Keine `font-family` / `box-sizing` (global im Reset).
- `.builder_page__output` lässt Platz für den Renderer, der selbst `.vertical_layout` und Module-Sektionen füllt.

### Schritt 3: `src/pages/BuilderPage/index.ts`

**Datei:** `src/pages/BuilderPage/index.ts` (neu)

```ts
export { BuilderPage } from './BuilderPage';
```

### Schritt 4: `src/App.tsx` ersetzen

**Datei:** `src/App.tsx`

**Vorher (30 Zeilen):**

```tsx
import { useState } from 'react';
import './App.css';
import Renderer from './builder/Renderer';
import { EditModeProvider } from './builder/EditModeContext';
import { EditModeToolbar } from './builder/EditModeToolbar';
import { specFromTypes } from './builder/specHelpers';
import type { SiteSpec } from './builder/schemas';

const DEMO_SPEC: SiteSpec = specFromTypes([
    'Header',
    'HeroBanner',
    'TextBlock',
    'MediaText',
    'CardRow',
    'ImageBlock',
    'FooterSimple',
]);

function App() {
    const [spec, setSpec] = useState<SiteSpec>(DEMO_SPEC);

    return (
        <EditModeProvider spec={spec} onSpecChange={setSpec}>
            <Renderer spec={spec} />
            <EditModeToolbar />
        </EditModeProvider>
    );
}

export default App;
```

**Nachher:**

```tsx
import './App.css';
import { BuilderPage } from './pages/BuilderPage';

function App() {
    return <BuilderPage />;
}

export default App;
```

**Erklärung:**
- `App.css`-Import bleibt Zeile 1 — **nicht entfernen**, sonst brechen `.vertical_layout`, `.section`, `.card` global (Impact-Analyse 10.2).
- Alle anderen Imports und State verschwinden.
- `main.tsx` braucht keine Änderung — `App` ist weiterhin Default-Export ohne Props.

---

## Aufrufer umstellen

| Datei | Zeile | Alt | Neu |
|-------|-------|-----|-----|
| `src/main.tsx` | (aktuell importiert `App` aus `./App.tsx`) | unverändert | unverändert |

Keine weiteren Konsumenten — App.tsx wird nicht importiert außer von main.tsx.

---

## Validierung

### Manuelle Tests

- [ ] `.env` mit gültigem Key anlegen (copy von `.env.example`, Key einsetzen).
- [ ] `npm run dev` starten.
- [ ] Browser öffnet BuilderPage: Textarea + Generate-Button sichtbar, keine Edit-Mode-Toolbar, keine hart-kodierte Demo-Seite.
- [ ] Prompt eintippen: "Eine einfache Landing-Page für einen Blog." Generate drücken.
- [ ] Loading-State zeigt "Claude arbeitet …".
- [ ] Nach 2-8s: Seite wird gerendert. Module sind plain (keine contentEditable-Outlines, keine Toolbar). Theme ggf. anders als Default.
- [ ] Zweiter Prompt: komplett andere Seite kommt — State ersetzt sich sauber.
- [ ] `.env` ohne Key / leerer Wert → Generate → UI zeigt "Kein API-Key konfiguriert" (kein Crash).
- [ ] Optional: absichtlich einen ungültigen Key setzen → UI zeigt "API-Fehler" mit Message.

### Automatisierte Tests

```bash
cd c:\Users\Nico\WebstormProjects\website_builder
npm run lint
npm run test
npm run build
```

Alle grün. Test-Count sollte auf ca. 330 bleiben (keine neuen Tests in Plan 03, aber auch keine gebrochenen).

### Erwartetes Verhalten

- Frische App-Shell mit Prompt-Input und Render-Bereich.
- Edit-Mode-Code unverändert, aber nicht mehr gemountet.
- Renderer rendert Module wie gewohnt, nur ohne Edit-Überlagerung.

## Rollback-Plan

1. `src/App.tsx` auf den vorherigen Body rückgängig machen.
2. `src/pages/BuilderPage/` löschen.
3. `.env` bleibt unberührt (war lokal, nicht committed).

---

*Status: Ausstehend*
*Erstellt am: 2026-04-14*
