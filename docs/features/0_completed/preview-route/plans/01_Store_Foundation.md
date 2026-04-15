# Preview Route — Plan 01: Store Foundation

## Übersicht

| Aspekt | Details |
|--------|---------|
| **Ziel** | `react-router-dom` als Dep installieren + `src/state/specStore.ts` als localStorage-Wrapper anlegen + Unit-Tests. Rein additiv. |
| **Abhängig von** | — (erster Plan) |
| **Betroffene Bereiche** | Infra / Shared State |
| **Geschätzte Komplexität** | Niedrig |

### Größen-Check

| Metrik | Wert | Schwellwert | OK? |
|--------|------|-------------|-----|
| Implementierungsschritte | 3 | >8 | ✓ |
| Neue Dateien | 1 (Tests zählen nicht) | >5 | ✓ |
| Zu ändernde Dateien | 1 (package.json) | >10 | ✓ |

## Schnittstellen (Kohärenz-Vertrag)

### Inputs

Keine.

### Outputs

| Für Plan | Was wird geliefert |
|----------|---------------------|
| Plan 02 | `react-router-dom` als Dep installiert (BrowserRouter, Routes, Route, Link importierbar) |
| Plan 02 | `src/state/specStore.ts` mit `loadState()` für SitePreview-Mount |
| Plan 03 | `src/state/specStore.ts` mit `loadState()`, `savePrompt()`, `saveSpec()` für BuilderPage-Wiring |

### Architektur-Entscheidungen

- **Pure Functional API**: keine Klassen, keine Hooks. Fünf Funktionen + ein Typ. Tests trivial.
- **Ein Storage-Key, ein Blob**: `"website-builder:state"` hält `{ prompt, spec }` als JSON. Vermeidet Key-Sprawl.
- **Corrupt-Data = Default**: `loadState()` fängt `JSON.parse`-Errors und fehlende Felder ab, gibt `{ prompt: '', spec: null }` zurück. Schützt gegen alte/manuell manipulierte Storage-Inhalte.
- **Write-Errors silently swallowed**: `localStorage.setItem` kann bei Private-Mode / Quota-Exceeded werfen. V1 fängt das via try/catch + `console.warn` und continues. Für Dev-Demo akzeptabel.

## Voraussetzungen

- [x] Gemini-Swap ✓ abgeschlossen.
- [x] jsdom Test-Environment aktiv (bringt localStorage mit).

## Betroffene Dateien

### Neue Dateien

| Datei | Beschreibung |
|-------|--------------|
| `src/state/specStore.ts` | localStorage-Wrapper mit `loadState`, `saveState`, `savePrompt`, `saveSpec`, `clearState`. |
| `src/state/specStore.test.ts` | Unit-Tests: save/load roundtrip, corrupt-data fallback, partial updates, clearState. |

### Zu ändernde Dateien

| Datei | Art der Änderung |
|-------|------------------|
| `package.json` | `react-router-dom` unter `dependencies` hinzufügen (via `npm install`) |

### Zu löschende Dateien/Code

Keine.

## Implementierung

### Schritt 1: `react-router-dom` installieren

```bash
cd c:\Users\Nico\WebstormProjects\website_builder
npm install react-router-dom
```

Nach Abschluss: `package.json` enthält `react-router-dom` mit `^7.x` (oder aktueller stabiler Hauptversion). `@types/react-router-dom` ist nicht nötig — v7 bringt eigene Types mit.

### Schritt 2: `src/state/specStore.ts` anlegen

**Datei:** `src/state/specStore.ts` (neu)

```ts
import type { SiteSpec } from '../builder/schemas';

/**
 * Persisted state shape. Everything that should survive reloads and
 * new tabs lives here.
 */
export interface StoredState {
    /** Last entered prompt text. Empty string if nothing has been typed. */
    prompt: string;
    /** Last successfully generated spec. Null if none yet. */
    spec: SiteSpec | null;
}

const STORAGE_KEY = 'website-builder:state';
const DEFAULT: StoredState = { prompt: '', spec: null };

/**
 * Reads the full persisted state from localStorage.
 *
 * Returns DEFAULT on:
 *   - localStorage unavailable (private mode, quota errors)
 *   - missing key
 *   - invalid JSON
 *   - shape mismatch (missing fields)
 *
 * This makes the store robust against manually-edited storage or
 * schema evolution — bad data never crashes the app, it just resets.
 */
export function loadState(): StoredState {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return DEFAULT;
        return {
            prompt: typeof parsed.prompt === 'string' ? parsed.prompt : '',
            spec: isSpecShape(parsed.spec) ? (parsed.spec as SiteSpec) : null,
        };
    } catch {
        return DEFAULT;
    }
}

/** Overwrites the full persisted state. Silently no-ops on write errors. */
export function saveState(state: StoredState): void {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
        console.warn('specStore.saveState failed', err);
    }
}

/** Convenience: update only the prompt field, leave spec intact. */
export function savePrompt(prompt: string): void {
    const current = loadState();
    saveState({ ...current, prompt });
}

/** Convenience: update only the spec field, leave prompt intact. */
export function saveSpec(spec: SiteSpec): void {
    const current = loadState();
    saveState({ ...current, spec });
}

/** Clears everything. For DevTools/test use. */
export function clearState(): void {
    try {
        window.localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
        console.warn('specStore.clearState failed', err);
    }
}

function isSpecShape(v: unknown): v is SiteSpec {
    return (
        !!v &&
        typeof v === 'object' &&
        Array.isArray((v as SiteSpec).blocks)
    );
}
```

**Erklärung:**
- `isSpecShape` ist eine Mini-Gate: prüft nur, dass `blocks` ein Array ist. Tiefe Validierung passiert beim echten Render durch `validateSpecAgainstRegistry`. Hier reicht die Shape-Smoke.
- `savePrompt`/`saveSpec` lesen erst den aktuellen State, merge'n dann — trivial, aber vermeidet Verlust vom jeweils anderen Feld.
- Kein Debounce in V1. localStorage-Writes sind sub-ms, bei jedem Keystroke aufgerufen kein Problem.

### Schritt 3: `src/state/specStore.test.ts` schreiben

**Datei:** `src/state/specStore.test.ts` (neu)

Test-Cases:

1. **Default bei leerem Storage:** `clearState()` → `loadState()` liefert `{ prompt: '', spec: null }`.
2. **Save/Load Roundtrip:** `saveState({ prompt: 'hi', spec: someValidSpec })` → `loadState()` liefert denselben Wert.
3. **savePrompt bewahrt Spec:** Nach `saveSpec(s)` + `savePrompt('x')` liefert `loadState().spec` weiterhin `s`.
4. **saveSpec bewahrt Prompt:** Umgekehrt.
5. **Corrupt JSON → Default:** Manuell `localStorage.setItem(STORAGE_KEY, '{{{ not json')` → `loadState()` liefert Default, kein Throw.
6. **Shape-Mismatch → Default-Pfad:** Manuell `localStorage.setItem(STORAGE_KEY, JSON.stringify({ prompt: 42, spec: 'hello' }))` → `loadState()` liefert `{ prompt: '', spec: null }` (gezielter Fallback bei falschem Typ).
7. **clearState räumt wirklich:** Nach `saveState(...)` + `clearState()` → `loadState()` liefert Default.

**Framework:** Vitest. `beforeEach`: `window.localStorage.clear()` um Tests zu isolieren. jsdom hat localStorage im Test-Environment verfügbar.

**Valider Spec für Tests:** eine minimale, handgebaute Spec, z.B.:
```ts
const validSpec: SiteSpec = {
    blocks: [{ type: 'TextBlock', props: { body: 'hi' } }],
};
```

### Validierung

```bash
cd c:\Users\Nico\WebstormProjects\website_builder
npx vitest run src/state
npx tsc --noEmit
npx eslint src/state
npm run test
npm run build
```

Erwartet:
- specStore.test: 7 Tests grün
- Full suite: 330 + 7 = 337 Tests grün
- tsc, eslint, build grün

---

## Aufrufer umstellen

Keine — rein additiv.

---

## Validierung

### Manuelle Tests

- [ ] Nach `npm install` zeigt `package.json` `react-router-dom` unter `dependencies`.
- [ ] `npm run dev` startet weiter (noch keine Nutzung der neuen Dep, aber Install sollte App nicht brechen).

### Automatisierte Tests

Siehe oben.

### Erwartetes Verhalten

Nach Plan 01 existieren `specStore.ts` + Tests. Keine andere Datei benutzt sie noch. App-Verhalten unverändert.

## Rollback-Plan

1. `npm uninstall react-router-dom`
2. `src/state/` löschen.

---

*Status: Ausstehend*
*Erstellt am: 2026-04-15*
