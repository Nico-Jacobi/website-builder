# Preview Route — Masterplan

## Status
- [x] Phase 1: Masterplan
- [x] Phase 1b: Impact-Analyse
- [x] Phase 2: Implementierungspläne
- [x] Phase 2b: Sub-Pläne (nicht nötig)
- [x] Phase 2c: Kohärenz-Check
- [x] Implementierung gestartet
- [x] Cleanup-Validierung
- [x] Feature abgeschlossen

## 1. Ziel

**Was soll erreicht werden?**

Die generierte Website und der Prompt-Eingabe-Workflow leben ab sofort
auf **zwei echten URL-Pfaden**:

- **`/`** — BuilderPage (Prompt-Input, Main-Seite).
- **`/site`** — SitePreview (edge-to-edge gerenderte Spec, eigenständige
  Seite ohne Builder-Chrome).

Nach einer erfolgreichen Generation zeigt BuilderPage nicht mehr den
`<Renderer>` inline, sondern einen **"Website ansehen →"-Button** (Link
nach `/site`). Kein Auto-Redirect.

Die Spec und der zuletzt getippte Prompt **überleben Reloads und
Neu-Tabs** via `localStorage`. Öffnet der User `/site` in einem neuen
Tab, liest dort der SitePreview-Loader die Spec aus localStorage und
rendert. Prompt-Feld in `/` behält den letzten Eingabe-Stand.

**Anwendungsfall:**

- Nutzer tippt "Landing-Page für ein Café", klickt Generate, wartet.
- Sobald fertig: Button "Website ansehen →" erscheint im Result-Bereich.
- Klick → `/site`, volle Seite.
- Browser-Back → zurück auf `/`, Prompt und Button sind noch da.
- Nutzer kann `/site` auch via Cmd/Ctrl-Click in neuem Tab öffnen —
  funktioniert, weil Spec in localStorage liegt.

## 2. Ist-Zustand

**Aktuelle Implementierung:**

- [src/App.tsx](../../../src/App.tsx) ist Thin-Shell: `return <BuilderPage />`.
- [src/pages/BuilderPage/BuilderPage.tsx](../../../src/pages/BuilderPage/BuilderPage.tsx)
  rendert Prompt-UI + im `ok`-Case inline `<Renderer spec={...} />`.
- State ist React-State, **nicht persistent**. Refresh verliert alles.
- Kein Router. Nur eine Seite.
- Loading-Hint ist reiner Text "Gemini arbeitet …".

**Probleme:**

1. Prompt-Eingabe und gerenderte Seite teilen sich eine Fläche — die
   generierte Seite wirkt nicht wie "die echte Website".
2. Neu-Tab / Link-Teilen / Refresh geht nicht — State flüchtig.
3. User hat den Wunsch, Builder und Result strukturell zu trennen.

**Relevante Dateien:**

- `src/App.tsx` — muss Router-Shell werden.
- `src/pages/BuilderPage/BuilderPage.tsx` — `ok`-Case ändert sich;
  State wird persistiert; Loading bekommt Animation.
- `src/pages/BuilderPage/BuilderPage.css` — Loading-Animation + Button-Styling.
- `package.json` — neue Dep `react-router-dom`.

## 3. Soll-Zustand

### Neue Dateien

```
src/state/
├── specStore.ts            # localStorage-Wrapper (load/save/clear)
└── specStore.test.ts       # Unit-Tests (localStorage gemockt via jsdom)

src/pages/SitePreview/
├── SitePreview.tsx         # Edge-to-edge Renderer + "← Zurück"-Link
├── SitePreview.css         # Minimal: Back-Link Overlay
└── index.ts                # re-export
```

### Geänderte Dateien

- `package.json` — `react-router-dom` hinzufügen.
- `src/App.tsx` — BrowserRouter + zwei Routes (`/`, `/site`).
- `src/pages/BuilderPage/BuilderPage.tsx` — Prompt-State aus Store
  hydratieren; auf ok-Result Spec speichern + Button zeigen statt
  inline rendern.
- `src/pages/BuilderPage/BuilderPage.css` — Loading-Dots-Animation,
  Styling für den View-Button.

### `specStore` API

```ts
export interface StoredState {
    prompt: string;      // zuletzt getippter Prompt, '' falls nichts
    spec: SiteSpec | null;  // zuletzt generierte valide Spec, null falls keine
}

/** Liest den kompletten State. Bei Parse-Fehler oder fehlenden Keys → Default. */
export function loadState(): StoredState;

/** Speichert den kompletten State (überschreibt). */
export function saveState(state: StoredState): void;

/** Convenience: nur Prompt überschreiben, Rest bleibt. */
export function savePrompt(prompt: string): void;

/** Convenience: nur Spec überschreiben, Rest bleibt. */
export function saveSpec(spec: SiteSpec): void;

/** Löscht alles. */
export function clearState(): void;
```

Storage-Key: `"website-builder:state"`. Ein Blob, JSON-serialisiert.
Bei Quota-Exceeded oder anderen Write-Errors: log + silently ignore —
für eine Dev-Demo akzeptabel. Bei Read-Errors: Default-State zurückgeben.

### Routing

```tsx
// App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
<BrowserRouter>
    <Routes>
        <Route path="/" element={<BuilderPage />} />
        <Route path="/site" element={<SitePreview />} />
    </Routes>
</BrowserRouter>
```

**BrowserRouter**, nicht HashRouter — saubere URLs. Vite's Dev-Server
und `vite preview` liefern bei unbekannten Pfaden per Default
`index.html` aus (SPA-Fallback), sodass `/site`-Direktaufruf oder
-Reload funktioniert. Kein Vite-Config-Change nötig.

Kein Catch-all-Route nötig für MVP — unbekannte URLs zeigen nichts,
aber das kommt in der Praxis nicht vor (nur `/` und `/site` werden
verlinkt).

### BuilderPage-Verhalten nach Refactor

**Beim Mount:**
- Lese `loadState()`. Setze `prompt`-State auf gespeicherten Prompt-Text.
  Spec wird in BuilderPage nicht gebraucht — SitePreview liest direkt.
  
**Beim Prompt-Input:**
- `onChange` → `setPrompt` + `savePrompt(newValue)`. Auf jedem Keystroke
  persistieren; localStorage-Writes sind im Sub-ms-Bereich, kein
  Debounce nötig für MVP.

**Beim Generate:**
- Wie bisher: `generateSpec(prompt)` → `GenerateResult`.
- Bei `result.kind === 'ok'`: `saveSpec(result.spec)`. UI zeigt
  **Button** "Website ansehen →" statt inline `<Renderer>`.
- Bei anderen Kinds: wie bisher (ErrorPanel, alter gespeicherter Spec
  bleibt unberührt in localStorage).

**Success-View-Layout:**
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

**Loading-Animation:**
- CSS-Dots: der Hint-Text "Gemini arbeitet" bekommt drei animierte
  Punkte via `::after` + `@keyframes`. 3 Punkte erscheinen nacheinander,
  Zyklus ~1.5s. Bewusst low-tech, passt zu "nicht so professionell".

### SitePreview-Verhalten

**Beim Mount:**
- `loadState().spec` lesen.
- Wenn `null`: Empty-State mit Text "Noch keine Website generiert." +
  `<Link to="/">Zurück zum Prompt</Link>`.
- Sonst: `<Renderer spec={spec} />` + Overlay-Link "← Zurück" top-left
  fixed.

**Edge-Case Cross-Tab:**
- Tab 1 generiert neu → localStorage aktualisiert.
- Tab 2 hat die alte Spec im Speicher → zeigt noch die alte, bis
  Reload/Revisit.
- V1 ignoriert das. Kein BroadcastChannel, kein `storage`-Event-Listener.
- Wenn Cross-Tab-Sync später gewünscht: One-Liner (`useEffect` mit
  `window.addEventListener('storage', ...)`).

## 4. Architektur-Entscheidungen

### React Router (BrowserRouter)

- `react-router-dom` v7.x (aktuell stabil).
- BrowserRouter: echte URLs (`/site`), Browser-Back/-Forward nativ.
- Vite handled SPA-Fallback Out-of-the-Box (dev + preview).

### localStorage vs. React Context

Alternative wäre ein App-Level-Context, der Spec hält. Aber:
- Context überlebt keine Reload.
- Context teilt sich nicht zwischen Tabs (ohne zusätzlichen Mechanismus).
- localStorage löst beides gratis.
- Einziger Trade-off: Schreibe-Operation synchron + persistent. Für
  eine Spec-JSON (~5-20 KB) unproblematisch.

### Keine Zustandsbibliothek

Zustand wird auf drei Stellen verteilt:
- BuilderPage: Prompt-Text + aktueller GenerateResult (lokaler
  React-State, via Store hydratiert/persistiert).
- SitePreview: Spec aus Store beim Mount gelesen, lokaler Cache.
- localStorage: die persistente Wahrheit.

Kein Redux, Zustand, Jotai. Die Menge an geteiltem State rechtfertigt
keine Library.

### Spec wird nur bei `ok` persistiert

Bei Errors (validation_failed, api_error, invalid_json, missing_key)
bleibt die alte Spec erhalten. Das ist die richtige UX: wenn das letzte
Ergebnis gut war und der neue Versuch schiefgeht, soll die funktionierende
Spec nicht verloren gehen.

### BuilderPage rendert die Seite nicht mehr inline

Der inline `<Renderer>` im ok-Case verschwindet komplett. SitePreview
ist die **einzige** Stelle im Projekt, die `<Renderer>` aufruft.
Saubere Trennung.

### Loading-Animation als CSS-Dots

Drei animierte Punkte, CSS-only, `<p>` mit einem `::after` pseudo-element.
Alternativen (SVG-Spinner, externe Lib) wären overkill. Der User wünschte
"nicht so professionell" — das passt.

## 5. Beachtenswertes

### SSR / Hydration

Vite in diesem Projekt rendert keine SSR. BrowserRouter braucht keine
besondere Hydration-Logik. Kein Problem.

### TypeScript-Import von react-router-dom

v7 exportiert `BrowserRouter`, `Routes`, `Route`, `Link`. Alle typed.

### localStorage-Quota

5-10 MB pro Origin. Unsere Specs sind Klein-KBs. Null Risiko.

### Tests

- `specStore.test.ts`: jsdom hat `localStorage` eingebaut. Happy-Path
  (save/load roundtrip), Corrupt-Data (manuell kaputten String rein
  legen → loadState gibt Default), clearState, partielle Updates
  (savePrompt lässt Spec intakt).
- Keine neuen Unit-Tests für SitePreview oder Routing — Integration
  wäre's wert, aber out-of-scope für MVP (Projekt-Pattern: UI-Glue
  kein Test, wie BuilderPage).
- Bestehende Tests dürfen nicht brechen. Edit-Mode-Tests nutzen
  `EditModeProvider` direkt und sind router-unabhängig — erwartet: 0
  Anpassungen.

### Accessibility

- Back-Link in SitePreview ist ein echter `<Link>`, nicht Button.
  Tastatur- und Screenreader-zugänglich.
- Button in BuilderPage Success-Case ist ein `<Link>` styled wie
  Button — `role="button"` nicht nötig, Link-Semantic passt zur
  Aktion (Navigation).

### Migration

Altes BuilderPage-Verhalten (inline-Rendering) wird **gelöscht**,
nicht parallel gehalten. Wer's vermisst, Git-Blame.

## 6. Abhängigkeiten

**Voraussetzungen:**

- Features `llm-foundation`, `llm-generator`, `gemini-swap` ✓ (alle
  abgeschlossen).

**Betroffene Features:**

- `llm-generator` — BuilderPage wird angepasst, Trust-Boundary
  (validateSpec) unverändert.
- `gemini-swap` — komplett unberührt.

**Externe Abhängigkeiten:**

- **Neu:** `react-router-dom` (v7 oder aktuelle stabile).

## 7. Nicht-Ziele

**Explizit NICHT Teil dieses Features:**

- Kein BroadcastChannel / keine Cross-Tab-Spec-Sync.
- Kein `storage`-Event-Listener für Auto-Update in Tab 2.
- Keine "Reset/Clear-History"-UI (localStorage manuell löschbar via
  DevTools).
- Kein Spec-Export (JSON-Download).
- Kein Share-Link mit Spec in URL.
- Keine Route-Transitions-Animation.
- Keine UI-Tests für BuilderPage/SitePreview-Integration (Units reichen).
- Keine Catch-All-Route (404).
- Keine Auth, kein Multi-User.

**Spätere Erweiterungen:**

- Cross-Tab-Sync via `storage`-Event.
- History von mehreren generierten Sites (Liste + Wechsel).
- Share-Link via URL-Hash mit Base64-Spec.

## 8. Offene Fragen

- [ ] **react-router-dom Version:** zur Implementation latest stable
  pinnen. API-Änderungen zwischen v6 und v7 sind minimal (v7 hat
  `Routes` + `Route`-Nested-Pattern, was wir nicht brauchen).
- [ ] **Soll der Success-Button die Prompt-Form ausblenden oder
  unterhalb lassen?** Vorschlag: unterhalb lassen — der User kann
  sofort einen neuen Prompt tippen und erneut generieren. Success-Box
  erscheint darunter.

---

## 9. Was muss weg (Impact-Analyse)

> Wird vom `impact-analyzer` in Phase 1b befüllt.

### 9.1 Zu löschende Dateien

| Datei | Grund |
|-------|-------|
| — (keine) | Dieses Feature fügt Dateien hinzu und ändert bestehende; keine Datei wird komplett entfernt. |

### 9.2 Zu löschender Code

| Datei | Element | Grund |
|-------|---------|-------|
| `src/App.tsx` | Body `return <BuilderPage />;` (Zeile 5) | Wird durch `<BrowserRouter>` + `<Routes>` mit den zwei Routen (`/`, `/site`) ersetzt. Import `./App.css` und `BuilderPage`-Import bleiben. |
| `src/pages/BuilderPage/BuilderPage.tsx` | `import Renderer from '../../builder/Renderer';` (Zeile 3) | BuilderPage ruft `<Renderer>` nicht mehr auf; Import fliegt raus. |
| `src/pages/BuilderPage/BuilderPage.tsx` | `case 'ok': return <Renderer spec={result.spec} />;` (Zeile 60–61) | Wird durch Success-Block (`<div className="builder_page__success">` + `<Link to="/site">`) ersetzt. |
| `src/pages/BuilderPage/BuilderPage.tsx` | Statischer Loading-Text `<p className="builder_page__hint">Gemini arbeitet …</p>` (Zeile 49–51) | Text bleibt konzeptionell, bekommt aber eine eigene BEM-Klasse (`builder_page__loading` o.ä.) damit die CSS-Dots-Animation `::after` daran hängen kann. Der statische Ellipsis-Zeichen `…` entfällt — Dots kommen via Pseudo-Element. |

### 9.3 Veraltete Patterns

| Altes Pattern | Neues Pattern | Betroffene Stellen |
|---------------|---------------|-------------------|
| BuilderPage rendert Ergebnis inline via `<Renderer>` | BuilderPage zeigt `<Link to="/site">`-Button; SitePreview rendert `<Renderer>` | `src/pages/BuilderPage/BuilderPage.tsx` (ok-Case) |
| Ephemerer React-State für Prompt + Result | Prompt + Spec werden via `specStore` in `localStorage` persistiert | `src/pages/BuilderPage/BuilderPage.tsx`, neu: `src/state/specStore.ts` |
| Single-Page-App ohne Router (`App` = thin shell über `BuilderPage`) | SPA mit `BrowserRouter` + zwei Routen | `src/App.tsx` |
| Statischer Loading-Text „Gemini arbeitet …" | CSS-Dots-Animation via `::after` + `@keyframes` | `src/pages/BuilderPage/BuilderPage.tsx` + `.css` |

---

## 10. Betroffene Aufrufer (Impact-Analyse)

> Wird vom `impact-analyzer` in Phase 1b befüllt.

### 10.1 Direkte Aufrufer

| Datei | Zeile | Aktuell | Neu |
|-------|-------|---------|-----|
| `src/App.tsx` | 2 | `import { BuilderPage } from './pages/BuilderPage';` | Bleibt + zusätzlich `import { SitePreview } from './pages/SitePreview';` und `import { BrowserRouter, Routes, Route } from 'react-router-dom';` |
| `src/App.tsx` | 1 | `import './App.css';` | Bleibt unverändert (shared primitives, per llm-generator-Feature festgehalten). |
| `src/App.tsx` | 4–6 | `function App() { return <BuilderPage />; }` | Ersetzt durch `<BrowserRouter><Routes><Route path="/" element={<BuilderPage />} /><Route path="/site" element={<SitePreview />} /></Routes></BrowserRouter>`. |
| `src/pages/BuilderPage/BuilderPage.tsx` | 3 | `import Renderer from '../../builder/Renderer';` | **Entfernt.** Zusätzlich neu: `import { Link } from 'react-router-dom';` und `import { loadState, savePrompt, saveSpec } from '../../state/specStore';`. |
| `src/pages/BuilderPage/BuilderPage.tsx` | 10 | `const [prompt, setPrompt] = useState('');` | `const [prompt, setPrompt] = useState(() => loadState().prompt);` |
| `src/pages/BuilderPage/BuilderPage.tsx` | 33 | `onChange={(e) => setPrompt(e.target.value)}` | Schreibt zusätzlich `savePrompt(e.target.value)`. |
| `src/pages/BuilderPage/BuilderPage.tsx` | 20–22 | `const next = await generateSpec(trimmed); setResult(next); setStatus('done');` | Zusätzlich: bei `next.kind === 'ok'` → `saveSpec(next.spec)`. |
| `src/pages/BuilderPage/BuilderPage.tsx` | 60–61 | `case 'ok': return <Renderer spec={result.spec} />;` | Liefert Success-Block mit `<Link to="/site" className="builder_page__view-button">Website ansehen →</Link>`. |
| `src/pages/SitePreview/SitePreview.tsx` | neu | — | `import Renderer from '../../builder/Renderer';` + `import { Link } from 'react-router-dom';` + `import { loadState } from '../../state/specStore';` |
| `src/state/specStore.ts` | neu | — | Wrapper um `window.localStorage` (Key `"website-builder:state"`): `loadState`, `saveState`, `savePrompt`, `saveSpec`, `clearState`. |
| `package.json` | dependencies | — | Neue Dep `react-router-dom` (v7.x stable). |

### 10.2 Transitive Aufrufer

| Datei | Kette | Änderung nötig? |
|-------|-------|-----------------|
| `src/main.tsx` | `main → App` | Nein. `<App />` bleibt Entry-Point; Router lebt innerhalb von `App`. |
| `src/pages/BuilderPage/index.ts` | Re-Export `BuilderPage` | Nein. Öffentliche API unverändert. |
| Alle Komponenten unterhalb `BuilderPage` / `SitePreview` | Router-Context via `BrowserRouter` | Nein. Keine darunter liegende Komponente nutzt aktuell `<Link>` oder `useNavigate`; der Context wird nur von BuilderPage- und SitePreview-TSX direkt konsumiert. |
| `src/builder/Renderer.tsx` | Aufrufer wechselt: BuilderPage → SitePreview | Nein. Renderer-API (`spec` Prop) unverändert. |
| `src/builder/editModeStore.ts`, `src/builder/EditModeContext.tsx` | Von Modulen konsumiert, nicht von BuilderPage/SitePreview-Glue | Nein. Edit-Mode ist router-unabhängig. |
| `src/llm/generateSpec.ts` | Weiter aus BuilderPage aufgerufen | Nein. Signatur unverändert. |

### 10.3 Betroffene Tests

| Test-Datei | Anpassung |
|------------|-----------|
| `src/builder/Renderer.test.tsx` | Keine. Rendert `<Renderer>` direkt mit `renderWithProviders` — router-unabhängig. |
| `src/builder/editMode.test.tsx` | Keine. Nutzt `<Renderer>` + `EditModeProvider` ohne Router. |
| `src/builder/registry.test.ts` | Keine. |
| `src/builder/schemas.test.ts` | Keine. |
| `src/builder/validateSpec.test.ts` | Keine. |
| `src/builder/blockIds.test.ts` | Keine. |
| `src/builder/propPath.test.ts` | Keine. |
| `src/elements/components.test.tsx` | Keine. Testet Module isoliert, keine Router-Komponenten involviert. |
| `src/elements/schemas.test.ts` | Keine. |
| `src/llm/buildSystemPrompt.test.ts` | Keine. |
| `src/llm/generateSpec.test.ts` | Keine. |
| `src/test/renderWithProviders.tsx` | Keine. Nur `EditModeProvider`-Wrapper; neue Tests für BuilderPage/SitePreview sind laut Plan out-of-scope. |
| `src/state/specStore.test.ts` (neu in Plan 01) | Wird in Plan 01 geschrieben; nicht Teil dieser Analyse. |
| Bestehende BuilderPage-/App-Tests | — (keine existieren) |

---

## 11. Akzeptanzkriterien

### Funktionale

- [ ] `/` zeigt BuilderPage mit Prompt-Textarea, Generate-Button.
- [ ] Nach Generate + Success: Button "Website ansehen →" erscheint.
  Kein Auto-Redirect.
- [ ] Klick auf Button → Navigation zu `/site`. Seite wird
  edge-to-edge gerendert.
- [ ] "← Zurück zum Prompt"-Link auf SitePreview führt zurück zu `/`
  mit allen Eingaben erhalten.
- [ ] Refresh auf `/`: Prompt-Text ist noch da.
- [ ] Refresh auf `/site`: Spec ist noch da und wird gerendert.
- [ ] Frisches Browser-Profil / clearedStorage auf `/site`: Empty-State
  mit Link zurück zu `/`.
- [ ] Loading-Hint zeigt animierte Dots (nicht statisch).

### Technische

- [ ] `react-router-dom` in `package.json`.
- [ ] `npm run build` grün.
- [ ] `npm run test` grün (bestehende 330 Tests + neue specStore-Tests).
- [ ] `npm run lint` grün.
- [ ] Keine `// TODO` im neuen Code.
- [ ] Renderer wird nur noch in SitePreview aufgerufen
  (grep: `<Renderer` exakt einmal im Source außerhalb Renderer.tsx
  selbst).
- [ ] localStorage-Key konstant `website-builder:state`, zentral in
  specStore.ts.

### Qualität

- [ ] specStore ist pure Functional API (Funktionen, kein Class).
- [ ] JSDoc auf Store-Exporten.
- [ ] SitePreview.css + BuilderPage.css nur Tokens.
- [ ] Keine direkten `localStorage.*`-Aufrufe außerhalb specStore.ts.

---

## 12. Nächste Schritte

Nach Freigabe:
1. Impact-Analyse.
2. Pläne:
   - `01_Store_Foundation.md` (Dep-Install + specStore + Tests)
   - `02_Routing_And_Preview.md` (App-Router + SitePreview-Page)
   - `03_BuilderPage_Integration.md` (Persistenz + Button + Loading)
3. Größen-Check.
4. Kohärenz-Check.
5. `/execute`.

---

*Erstellt am: 2026-04-15*
*Letzte Aktualisierung: 2026-04-15*
