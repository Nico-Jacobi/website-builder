# Section Tone System - Plan 02: SectionShell Komponente

## Übersicht

| Aspekt | Details |
|--------|---------|
| **Ziel** | `SectionShell`-Komponente + CSS erstellen — nimmt `tone` und setzt Hintergrund/Textfarbe via `data-tone`-Attribut |
| **Abhängig von** | Plan 01 (`Tone`-Type muss exportiert sein) |
| **Betroffene Bereiche** | Shared (Builder-Core) |
| **Geschätzte Komplexität** | Niedrig |

### Größen-Check

| Metrik | Wert | Schwellwert |
|--------|------|-------------|
| Implementierungsschritte | 2 | >8 → Sub-Pläne |
| Neue Dateien | 2 | >5 → Sub-Pläne |
| Zu ändernde Dateien | 0 | >10 → Sub-Pläne |

## Schnittstellen

### Inputs
| Von Plan | Was wird erwartet | Konkret |
|----------|-------------------|---------|
| Plan 01 | `Tone` Union-Type | `import type { Tone } from './types'` |

### Outputs
| Für Plan | Was wird geliefert | Konkret |
|----------|--------------------|---------|
| Plan 03 | `SectionShell` Komponente importierbar | `src/builder/SectionShell.tsx` exportiert `SectionShell` |

### Architektur-Entscheidungen
- SectionShell setzt **kein Padding** — das bleibt bei den Modulen (`.section`-Klasse)
- Hintergrundfarbe via `data-tone` Attribut + CSS-Attributselektor — kein inline style, kein className-Mapping in JS
- Wenn `tone` undefined → kein `data-tone` Attribut → kein background, kein color (Shell ist vollständig transparent)
- SectionShell ist eine reine Layout-Komponente, keine `<section>`-Semantik — sie nutzt `<div>` um keine ungewollten HTML-Semantiken einzuführen

## Voraussetzungen
- [ ] Plan 01 abgeschlossen (`Tone` Type existiert in `src/builder/types.ts`)

## Betroffene Dateien

### Neue Dateien
| Datei | Beschreibung |
|-------|--------------|
| `src/builder/SectionShell.tsx` | React-Wrapper-Komponente |
| `src/builder/SectionShell.css` | `[data-tone="…"]`-Selektoren für Background + Color |

### Zu ändernde Dateien
Keine (in diesem Plan).

### Zu löschende Dateien/Code
Keine.

## Implementierung

### Schritt 1: `SectionShell.tsx` erstellen

**Datei:** `src/builder/SectionShell.tsx` (neue Datei)

```typescript
import './SectionShell.css';
import type { ReactNode } from 'react';
import type { Tone } from './types';

interface SectionShellProps {
    tone?: Tone;
    children: ReactNode;
}

/**
 * Thin layout wrapper that applies a visual background and text color
 * based on the block's `tone` field from the SiteSpec.
 *
 * When `tone` is undefined, the shell renders as a transparent pass-through
 * with no background or color override — the module manages its own styling.
 *
 * Padding is NOT set here — each module controls its own vertical spacing
 * via its CSS (typically through the shared .section class in App.css).
 */
export function SectionShell({ tone, children }: SectionShellProps) {
    return (
        <div data-tone={tone ?? undefined}>
            {children}
        </div>
    );
}
```

**Erklärung:**
- `data-tone={tone ?? undefined}`: Wenn `tone` undefined ist, rendert React **kein** `data-tone`-Attribut im DOM (React lässt `undefined`-Props weg). Das ist das gewollte Verhalten — keine Hintergrundfarbe.
- Kein `className`, kein inline-style — das CSS übernimmt alles via Attributselektoren.
- `<div>` statt `<section>` weil mehrere `<section>` hintereinander in einem `<div.vertical_layout>` semantisch korrekt sind, aber wir keine doppelten section-Semantiken erzeugen wollen.

---

### Schritt 2: `SectionShell.css` erstellen

**Datei:** `src/builder/SectionShell.css` (neue Datei)

```css
/* SectionShell — applies background and text color based on data-tone attribute.
   No padding — modules control their own spacing via .section or their own CSS.
   When data-tone is absent, no styles are applied (shell is transparent). */

[data-tone="surface"] {
    background-color: var(--surface);
    color: var(--text);
}

[data-tone="muted"] {
    background-color: var(--background);
    color: var(--text);
}

[data-tone="primary"] {
    background-color: var(--primary);
    color: var(--inverted_text);
}

[data-tone="dark"] {
    background-color: var(--secondary);
    color: var(--inverted_text);
}

[data-tone="accent"] {
    background-color: var(--accent);
    color: var(--inverted_text);
}
```

**Erklärung:**
- Attributselektoren (`[data-tone="…"]`) haben höhere Spezifität als Klassen-Selektoren — das stellt sicher, dass die Shell-Farbe über Modul-CSS dominiert.
- `color` wird auf dem Shell-div gesetzt → alle Kinder-Elemente erben die Textfarbe, sofern sie `color` nicht selbst hardcoden. Module die `color: var(--text)` nutzen, werden in inverted-tone-Shells korrekt überschrieben.
- Kein `!important` nötig — Spezifität reicht aus.

---

## Aufrufer umstellen

Keine — SectionShell wird in Plan 03 vom Renderer importiert.

---

## Validierung

### Manuelle Tests
- [ ] Im Browser: Block mit `tone: "primary"` → Hintergrund ist `var(--primary)`-Farbe
- [ ] Im Browser: Block mit `tone: "dark"` → Hintergrund ist `var(--secondary)`-Farbe
- [ ] Im Browser: Block ohne `tone` → kein sichtbarer Hintergrundunterschied zur Seite

### Automatisierte Tests

Neue Tests in `src/builder/Renderer.test.tsx` (werden in Plan 03 integriert, da SectionShell erst nach Plan 03 im Renderer genutzt wird):

```typescript
it('renders a block with tone="primary" inside a shell with data-tone="primary"', () => {
    // wird in Plan 03 hinzugefügt
});
```

### Erwartetes Verhalten
- `SectionShell` ist importierbar aus `src/builder/SectionShell`
- Kein TypeScript-Fehler
- CSS-Datei wird von Vite korrekt gebundelt (Import in TSX-Datei reicht)

## Rollback-Plan

1. `src/builder/SectionShell.tsx` löschen
2. `src/builder/SectionShell.css` löschen

---

*Status: Ausstehend*
*Erstellt am: 2026-04-16*
