# Preview Route — Plan 02: Routing & SitePreview

## Übersicht

| Aspekt | Details |
|--------|---------|
| **Ziel** | `App.tsx` zum BrowserRouter-Shell umbauen (zwei Routes: `/`, `/site`). Neue Page `SitePreview` anlegen: edge-to-edge `<Renderer>` + Back-Link + Empty-State. |
| **Abhängig von** | Plan 01 (react-router-dom installiert, specStore exportiert) |
| **Betroffene Bereiche** | Frontend (App-Shell + neue Page) |
| **Geschätzte Komplexität** | Niedrig-Mittel |

### Größen-Check

| Metrik | Wert | Schwellwert | OK? |
|--------|------|-------------|-----|
| Implementierungsschritte | 4 | >8 | ✓ |
| Neue Dateien | 2 (index.ts-Re-Export zählt nicht) | >5 | ✓ |
| Zu ändernde Dateien | 1 (App.tsx) | >10 | ✓ |

## Schnittstellen (Kohärenz-Vertrag)

### Inputs

| Von Plan | Was wird erwartet | Konkret |
|----------|-------------------|---------|
| Plan 01 | `react-router-dom` installiert | `BrowserRouter`, `Routes`, `Route`, `Link` importierbar |
| Plan 01 | `loadState()` aus specStore | `src/state/specStore.ts` → `{ spec }` lesbar |

### Outputs

| Für Plan | Was wird geliefert |
|----------|---------------------|
| Plan 03 | Router-Context per `BrowserRouter` im App-Tree — `<Link>` funktioniert in BuilderPage |
| Plan 03 | SitePreview-Route lebt unter `/site`, BuilderPage kann dorthin verlinken |

### Architektur-Entscheidungen

- **BrowserRouter am `App`-Root**, nicht in `main.tsx`. Hält Router-Setup zusammen mit Routen-Definition. Konsistent mit react-router-dom v7 Empfehlung.
- **Kein Catch-all-Route:** unbekannte URLs (z.B. `/foo`) zeigen die leere `<Routes>`. MVP-Vereinfachung. 404-Page eigenes Folge-Feature, falls je gewünscht.
- **SitePreview lädt Spec beim Mount via useState-Initializer**, nicht via useEffect. Vermeidet ein Render mit leerer Spec gefolgt von Re-Render mit Spec.
- **Back-Link als Overlay:** `position: fixed` top-left, z-index über dem Renderer-Content. Vermeidet, dass er im Render-Flow den Seiten-Layout stört.

## Voraussetzungen

- [ ] Plan 01 abgeschlossen.
- [ ] Full-Test-Suite grün (337 Tests).

## Betroffene Dateien

### Neue Dateien

| Datei | Beschreibung |
|-------|--------------|
| `src/pages/SitePreview/SitePreview.tsx` | Page-Komponente: Renderer + Back-Link (bzw. Empty-State falls kein Spec) |
| `src/pages/SitePreview/SitePreview.css` | BEM-Styles, Tokens only |
| `src/pages/SitePreview/index.ts` | `export { SitePreview } from './SitePreview';` |

### Zu ändernde Dateien

| Datei | Art der Änderung |
|-------|------------------|
| `src/App.tsx` | Thin-Shell wird zu BrowserRouter + Routes-Wrapper |

### Zu löschende Dateien/Code

| Datei | Was wird gelöscht | Grund |
|-------|-------------------|-------|
| `src/App.tsx` | Body `return <BuilderPage />;` (Zeile 5) | Ersetzt durch Router-Struktur |

## Implementierung

### Schritt 1: `src/App.tsx` umbauen

**Vorher:**

```tsx
import './App.css';
import { BuilderPage } from './pages/BuilderPage';

function App() {
    return <BuilderPage />;
}

export default App;
```

**Nachher:**

```tsx
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BuilderPage } from './pages/BuilderPage';
import { SitePreview } from './pages/SitePreview';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<BuilderPage />} />
                <Route path="/site" element={<SitePreview />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
```

`import './App.css';` BLEIBT an Position 1 (shared primitives via llm-generator-Feature festgelegt).

### Schritt 2: `src/pages/SitePreview/SitePreview.tsx`

**Datei:** `src/pages/SitePreview/SitePreview.tsx` (neu)

```tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import './SitePreview.css';
import Renderer from '../../builder/Renderer';
import { loadState } from '../../state/specStore';

export function SitePreview() {
    const [spec] = useState(() => loadState().spec);

    if (!spec) {
        return (
            <div className="site_preview__empty">
                <p>Noch keine Website generiert.</p>
                <Link to="/" className="site_preview__back-link">
                    ← Zurück zum Prompt
                </Link>
            </div>
        );
    }

    return (
        <>
            <Link to="/" className="site_preview__back-overlay">
                ← Zurück
            </Link>
            <Renderer spec={spec} />
        </>
    );
}
```

**Erklärung:**
- `useState(() => loadState().spec)` liest genau einmal, beim ersten Render. Kein Re-Render-Zyklus.
- Render-Root ist bewusst **kein** Wrapper-Div — der Renderer selbst bringt `.vertical_layout` mit und soll die volle Viewport-Breite bekommen.
- Der Overlay-Link liegt via `position: fixed` vor dem Content; kein Layout-Shift.
- Empty-State ist ein eigener Zweig mit eigenem Wrapper, da hier Zentrierung + normaler Text-Flow erwünscht ist.

### Schritt 3: `src/pages/SitePreview/SitePreview.css`

**Datei:** `src/pages/SitePreview/SitePreview.css` (neu)

```css
/* Back-Link als Overlay wenn eine Spec gerendert wird */
.site_preview__back-overlay {
    position: fixed;
    top: var(--space_sm);
    left: var(--space_sm);
    z-index: 10;
    padding: var(--space_xs) var(--space_sm);
    border-radius: var(--radius_sm);
    background: var(--surface);
    color: var(--text);
    text-decoration: none;
    border: 1px solid var(--muted_text);
    font-size: 0.9rem;
}

.site_preview__back-overlay:hover {
    background: var(--background);
}

/* Empty-State (kein Spec im Storage) */
.site_preview__empty {
    display: flex;
    flex-direction: column;
    gap: var(--space_md);
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: var(--space_lg);
    text-align: center;
    background: var(--background);
    color: var(--text);
}

.site_preview__back-link {
    color: var(--primary);
    text-decoration: underline;
}
```

**Erklärung:**
- Tokens-only (CLAUDE.md-Contract).
- Keine `box-sizing`, keine `font-family` (global).
- Overlay z-index `10` reicht — keine anderen fixed-Elemente konkurrieren.

### Schritt 4: `src/pages/SitePreview/index.ts`

**Datei:** `src/pages/SitePreview/index.ts` (neu)

```ts
export { SitePreview } from './SitePreview';
```

---

## Aufrufer umstellen

| Datei | Zeile | Alt | Neu |
|-------|-------|-----|-----|
| `src/main.tsx` | — | `import App from './App.tsx'` | unverändert |

Keine weiteren Konsumenten — App.tsx hat keine Tests.

---

## Validierung

### Manuelle Tests

- [ ] `npm run dev` startet. `/` zeigt BuilderPage (noch ohne Persistenz, das kommt in Plan 03).
- [ ] Manuell in Browser-DevTools: `localStorage.setItem('website-builder:state', JSON.stringify({ prompt: '', spec: { blocks: [{ type: 'TextBlock', props: { body: 'hi' } }] } }))`, dann `/site` öffnen → TextBlock wird gerendert, Back-Link sichtbar top-left.
- [ ] `localStorage.clear()` → `/site` zeigt Empty-State mit Link zurück zu `/`.
- [ ] Back-Link klicken → landet auf `/`.

### Automatisierte Tests

```bash
cd c:\Users\Nico\WebstormProjects\website_builder
npx tsc --noEmit
npx eslint src
npm run test
npm run build
```

Erwartet:
- 337 Tests grün (keine neuen Tests in Plan 02; BuilderPage/SitePreview sind Glue-Code per Masterplan §5)
- tsc, eslint, build grün

### Erwartetes Verhalten

- `/` → BuilderPage (unverändertes Verhalten, `<Renderer>`-inline noch da bis Plan 03).
- `/site` → SitePreview, rendert via localStorage-Spec oder Empty-State.
- Routing funktioniert, Back-Link navigiert, Refresh auf `/site` lädt erneut aus Storage.

## Rollback-Plan

1. `src/App.tsx` auf Thin-Shell zurückrollen.
2. `src/pages/SitePreview/` löschen.
3. Plan 01 bleibt gültig (specStore ist noch nicht integriert in BuilderPage).

---

*Status: Ausstehend*
*Erstellt am: 2026-04-15*
