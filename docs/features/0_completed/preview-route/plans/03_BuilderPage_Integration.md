# Preview Route — Plan 03: BuilderPage Integration

## Übersicht

| Aspekt | Details |
|--------|---------|
| **Ziel** | BuilderPage aus Main-Page in die neue Architektur einpassen: Prompt-State aus Store hydratisieren + jeden Keystroke persistieren; auf success-Result Spec speichern + Button "Website ansehen →" zeigen statt inline `<Renderer>`; Loading-Dots-Animation statt statischer Text. |
| **Abhängig von** | Plan 01 (specStore), Plan 02 (Router-Context im App-Tree, `<Link>` funktioniert) |
| **Betroffene Bereiche** | Frontend (BuilderPage) |
| **Geschätzte Komplexität** | Niedrig-Mittel |

### Größen-Check

| Metrik | Wert | Schwellwert | OK? |
|--------|------|-------------|-----|
| Implementierungsschritte | 4 | >8 | ✓ |
| Neue Dateien | 0 | >5 | ✓ |
| Zu ändernde Dateien | 2 | >10 | ✓ |

## Schnittstellen (Kohärenz-Vertrag)

### Inputs

| Von Plan | Was wird erwartet | Konkret |
|----------|-------------------|---------|
| Plan 01 | specStore-API | `loadState`, `savePrompt`, `saveSpec` aus `src/state/specStore.ts` |
| Plan 02 | BrowserRouter-Context über BuilderPage | `<Link to="/site">` funktioniert ohne weitere Wrapper |

### Outputs

Keine — letzter Plan, Feature vollständig.

### Architektur-Entscheidungen

- **Prompt wird auf jedem Keystroke persistiert**. localStorage-Write ist sub-ms, kein Debounce.
- **Spec wird nur bei `result.kind === 'ok'` persistiert.** Fehlgeschlagene Gens lassen die letzte gute Spec im Storage.
- **Inline-Renderer raus**: der Success-Case zeigt **ausschließlich** den Link-Button + Bestätigungstext. Die Render-Last liegt jetzt vollständig in SitePreview.
- **Prompt-Form bleibt sichtbar über dem Success-Block** — User kann direkt einen neuen Prompt tippen, ohne erst etwas zu schließen. Per Masterplan §8 beantwortet.
- **Loading-Dots via CSS-`::after`**: drei Punkte, zyklisch einzeln erscheinend. Der statische `…`-Ellipsis im Hint-Text entfällt, die Dots kommen ausschließlich aus CSS — das separiert visuelles Verhalten vom Markup.

## Voraussetzungen

- [ ] Plan 01 + 02 abgeschlossen.
- [ ] Full-Test-Suite grün.

## Betroffene Dateien

### Neue Dateien

Keine.

### Zu ändernde Dateien

| Datei | Art der Änderung |
|-------|------------------|
| `src/pages/BuilderPage/BuilderPage.tsx` | Renderer-Import raus; Link + specStore-Imports rein; useState-Initializer für Prompt; Prompt-Persistenz; Spec-Save bei ok; ok-Case als Button; Loading-Markup mit Animation-Klasse |
| `src/pages/BuilderPage/BuilderPage.css` | Loading-Dots-`@keyframes` + `::after`-Regel; View-Button-Styling |

### Zu löschende Dateien/Code

| Datei | Was wird gelöscht | Grund |
|-------|-------------------|-------|
| `src/pages/BuilderPage/BuilderPage.tsx` | `import Renderer from '../../builder/Renderer';` | BuilderPage rendert nicht mehr inline |
| `src/pages/BuilderPage/BuilderPage.tsx` | `case 'ok': return <Renderer spec={result.spec} />;` (Body) | Ersetzt durch Success-Block mit Link |

## Implementierung

### Schritt 1: BuilderPage Imports + State-Hydration

**Datei:** `src/pages/BuilderPage/BuilderPage.tsx`

**Import-Block umstellen:**

Vorher:
```tsx
import { useState } from 'react';
import './BuilderPage.css';
import Renderer from '../../builder/Renderer';
import { generateSpec } from '../../llm/generateSpec';
import type { GenerateResult } from '../../llm/types';
```

Nachher:
```tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import './BuilderPage.css';
import { generateSpec } from '../../llm/generateSpec';
import { loadState, savePrompt, saveSpec } from '../../state/specStore';
import type { GenerateResult } from '../../llm/types';
```

(`Renderer`-Import weg. `Link`, `loadState`, `savePrompt`, `saveSpec` neu.)

**State-Hydration in der Komponente:**

Vorher:
```tsx
const [prompt, setPrompt] = useState('');
```

Nachher:
```tsx
const [prompt, setPrompt] = useState(() => loadState().prompt);
```

Der Lazy-Initializer liest genau beim ersten Mount aus localStorage.

### Schritt 2: Prompt-Persistenz + Spec-Save bei Success

**Textarea-onChange anpassen:**

Vorher:
```tsx
onChange={(e) => setPrompt(e.target.value)}
```

Nachher:
```tsx
onChange={(e) => {
    const next = e.target.value;
    setPrompt(next);
    savePrompt(next);
}}
```

**`onGenerate`-Handler erweitern:**

Vorher:
```tsx
setStatus('loading');
setResult(null);
const next = await generateSpec(trimmed);
setResult(next);
setStatus('done');
```

Nachher:
```tsx
setStatus('loading');
setResult(null);
const next = await generateSpec(trimmed);
if (next.kind === 'ok') {
    saveSpec(next.spec);
}
setResult(next);
setStatus('done');
```

Die restlichen Kinds (missing_key, api_error, invalid_json, validation_failed) brauchen nichts — die letzte erfolgreiche Spec bleibt im Storage.

### Schritt 3: `ok`-Case im Result-Switch umbauen + Loading-Markup

**`ok`-Case:**

Vorher:
```tsx
case 'ok':
    return <Renderer spec={result.spec} />;
```

Nachher:
```tsx
case 'ok':
    return (
        <div className="builder_page__success">
            <p>Website generiert!</p>
            <Link to="/site" className="builder_page__view-button">
                Website ansehen →
            </Link>
        </div>
    );
```

**Loading-Markup:**

Vorher:
```tsx
{status === 'loading' && (
    <p className="builder_page__hint">Gemini arbeitet …</p>
)}
```

Nachher:
```tsx
{status === 'loading' && (
    <p className="builder_page__loading">Gemini arbeitet</p>
)}
```

(Eigene Klasse `builder_page__loading`; das `…` entfällt, wird via `::after` aus CSS gesetzt.)

### Schritt 4: CSS — Loading-Dots + View-Button

**Datei:** `src/pages/BuilderPage/BuilderPage.css`

Am Ende der Datei ergänzen:

```css
/* Loading-Dots-Animation — drei Punkte erscheinen zyklisch nacheinander */
.builder_page__loading {
    color: var(--muted_text);
    text-align: center;
}

.builder_page__loading::after {
    content: '';
    display: inline-block;
    width: 1.5em;
    text-align: left;
    animation: builder_page_loading_dots 1.4s steps(4, end) infinite;
}

@keyframes builder_page_loading_dots {
    0%   { content: ''; }
    25%  { content: '.'; }
    50%  { content: '..'; }
    75%  { content: '...'; }
    100% { content: ''; }
}

/* Success-Box + View-Button */
.builder_page__success {
    display: flex;
    flex-direction: column;
    gap: var(--space_sm);
    align-items: center;
    padding: var(--space_md);
    max-width: 720px;
    margin: 0 auto;
    border: 1px solid var(--muted_text);
    border-radius: var(--radius_sm);
    background: var(--surface);
}

.builder_page__view-button {
    display: inline-block;
    padding: var(--space_sm) var(--space_md);
    border-radius: var(--radius_sm);
    background: var(--primary);
    color: var(--inverted_text);
    text-decoration: none;
}

.builder_page__view-button:hover {
    opacity: 0.9;
}
```

**Erklärung:**
- Die `content`-Property-Animation ist ein bekannter CSS-Trick: jeder Keyframe setzt `content` auf einen anderen String. `steps(4, end)` rastet hart in 4 Stufen, keine sanfte Interpolation. Passt zu "nicht so professionell" — bewusst choppy.
- Alternative wäre `@keyframes` mit `opacity` auf drei `<span>`-Children — das ist mehr Markup und braucht JS-unbeteiligtes DOM. Der Pseudo-Element-Ansatz ist kürzer.
- View-Button-Styling analog zum bestehenden Generate-Button (`--primary` / `--inverted_text`). Hover ist leichtes `opacity: 0.9` — billig.

**Bestehender Hint-Style:** Die alte Regel `.builder_page__hint` bleibt unberührt — sie styled den idle-State ("Gib einen Prompt ein …"). Der loading-Pfad nutzt jetzt die neue `.builder_page__loading`-Klasse.

---

## Aufrufer umstellen

Keine weiteren — das Feature ist selbstkonsumiert.

---

## Validierung

### Manuelle Tests (End-to-End)

- [ ] `.env` mit validem `VITE_GOOGLE_API_KEY`.
- [ ] `npm run dev`.
- [ ] `/` öffnen: Textarea leer, Prompt-Feld ist leer.
- [ ] Prompt eingeben: "Landing-Page für Kaffee-Blog".
- [ ] Seite aktualisieren (F5) auf `/`: Prompt-Text ist noch da (specStore-Persistenz).
- [ ] Generate klicken: Text "Gemini arbeitet" mit animierten Punkten sichtbar.
- [ ] Nach Completion: Success-Box erscheint mit Link "Website ansehen →". Kein Auto-Redirect.
- [ ] Klick auf Link: Navigation zu `/site`, Seite wird edge-to-edge gerendert.
- [ ] `/site` refresh: Seite ist noch da.
- [ ] `/site` in neuem Tab via Cmd/Ctrl+Click öffnen: lädt aus localStorage, rendert.
- [ ] Browser-Back auf `/`: Prompt + Success-Box wieder da.
- [ ] Error-Pfad: ungültigen Key setzen, Generate → `api_error`-Panel; alter Spec im Storage bleibt (prüfbar durch erneuten Klick nach Key-Fix).

### Automatisierte Tests

```bash
cd c:\Users\Nico\WebstormProjects\website_builder
npx tsc --noEmit
npx eslint src
npm run test
npm run build
```

Erwartet:
- 337 Tests grün (unverändert zu Plan 02 — keine neuen Tests hier, keine bestehenden betroffen)
- tsc, eslint, build grün

### Grep-Verifikation

```bash
# <Renderer exakt einmal im src/ (in SitePreview.tsx), null in BuilderPage
grep -rn "<Renderer" src/

# Kein direkter localStorage-Aufruf außerhalb specStore
grep -rn "localStorage\." src/ --include="*.ts" --include="*.tsx" | grep -v "specStore"
```

Erwartet:
- `<Renderer` findet Treffer in `SitePreview.tsx`. (Die Renderer-eigene Datei `src/builder/Renderer.tsx` definiert ihn, nutzt ihn aber nicht als JSX-Tag — dort kein `<Renderer>`-Match.) Tests (`Renderer.test.tsx`, `components.test.tsx`, `editMode.test.tsx`) nutzen ihn auch — das ist OK, sind keine Production-Usages.
- `localStorage.` nur in `specStore.ts`.

## Rollback-Plan

1. BuilderPage.tsx-Änderungen revertieren (Renderer-Import zurück, ok-Case zurück, onChange zurück).
2. BuilderPage.css-Additions entfernen.
3. Plan 01 + 02 bleiben gültig, aber die Persistenz-Brücke fehlt, d.h. Prompt wird nicht persistiert und SitePreview zeigt den Empty-State.

---

*Status: Ausstehend*
*Erstellt am: 2026-04-15*
