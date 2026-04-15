# Edit Mode - Plan 02: Edit Primitives

## Übersicht

| Aspekt | Details |
|--------|---------|
| **Ziel** | `useEditableText`, `useEditableImage` Hooks + zentrales `EditMode.css` erstellen |
| **Abhängig von** | Plan 01 |
| **Betroffene Bereiche** | Frontend / Shared |
| **Geschätzte Komplexität** | Mittel |

### Größen-Check
| Metrik | Wert | Schwellwert |
|--------|------|-------------|
| Implementierungsschritte | 4 | >8 → Sub-Pläne |
| Neue Dateien | 4 | >5 → Sub-Pläne |
| Zu ändernde Dateien | 0 | >10 → Sub-Pläne |

## Schnittstellen (Kohärenz-Vertrag)

### Inputs (was dieser Plan von Plan 01 erwartet)
| Von Plan | Was wird erwartet | Konkret |
|----------|-------------------|---------|
| Plan 01 | Context-Exports | `useEditModeState`, `useEditModeActions`, `useBlockIndex` aus `src/builder/EditModeContext.tsx` |
| Plan 01 | `updateBlock` Signatur | `(blockIndex: number, propPath: string, value: unknown) => void` |

### Outputs (was dieser Plan für Plan 04.x liefert)
| Für Plan | Was wird geliefert | Konkret |
|----------|-------------------|---------|
| Plan 04.x | Text-Hook | `useEditableText(propPath)` aus `src/builder/useEditableText.ts` |
| Plan 04.x | Bild-Hook | `useEditableImage(currentSrc, propPath)` aus `src/builder/useEditableImage.tsx` |
| Plan 04.x | CSS-Klassen | `.edit__text-field`, `.edit__image-wrap`, `.edit__image-overlay`, `.edit__image-input` aus `src/builder/EditMode.css` |

## Voraussetzungen

- [ ] Plan 01 abgeschlossen
- [ ] `EditModeContext.tsx` exportiert `useEditModeState`, `useEditModeActions`, `useBlockIndex`

## Betroffene Dateien

### Neue Dateien
| Datei | Beschreibung |
|-------|--------------|
| `src/builder/useEditableText.ts` | Hook: gibt contentEditable-Props zurück wenn Edit Mode aktiv |
| `src/builder/useEditableImage.tsx` | Hook: gibt Overlay-Element zurück wenn Edit Mode aktiv |
| `src/builder/EditMode.css` | Zentrale CSS für alle Edit-UI-Elemente (importiert von useEditableImage) |

---

## Implementierung

### Schritt 1: useEditableText Hook

**Datei:** `src/builder/useEditableText.ts`

```ts
import type { FocusEvent } from 'react';
import { useEditModeState, useEditModeActions, useBlockIndex } from './EditModeContext';

/**
 * Gibt Props zurück die auf ein texttragdes Element gestreut werden.
 * Im normalen Modus: leeres Objekt (No-Op, kein Overhead).
 * Im Edit Mode: contentEditable + blur-Handler der updateBlock aufruft.
 *
 * Verwendung:
 *   const editProps = useEditableText('heading');
 *   <h2 {...editProps}>{heading}</h2>
 */
export function useEditableText(propPath: string) {
  const { isEditMode } = useEditModeState();
  const { updateBlock } = useEditModeActions();
  const blockIndex = useBlockIndex();

  if (!isEditMode) return {};

  return {
    contentEditable: true as const,
    suppressContentEditableWarning: true,
    // data-Attribut statt className — überschreibt NICHT die bestehende className des Elements
    'data-edit-mode': 'text' as const,
    onBlur: (e: FocusEvent<HTMLElement>) => {
      // textContent statt innerHTML — verhindert XSS, gibt reinen Text zurück
      updateBlock(blockIndex, propPath, e.currentTarget.textContent ?? '');
    },
  };
}
```

**Erklärung:**
- Frühe Rückgabe `{}` wenn nicht im Edit Mode → Module spreaden ein leeres Objekt, kein Performance-Overhead.
- `textContent` (nicht `innerHTML`) verhindert, dass eingeschleuster HTML-Code gespeichert wird.
- `suppressContentEditableWarning` unterdrückt React-Warnung bei `contentEditable` mit Kinder-Elementen.
- `className: 'edit__text-field'` kommt aus `EditMode.css` (Schritt 3).

---

### Schritt 2: useEditableImage Hook

**Datei:** `src/builder/useEditableImage.tsx`

```tsx
import { useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import './EditMode.css';
import { useEditModeState, useEditModeActions, useBlockIndex } from './EditModeContext';

/**
 * Gibt ein Overlay-ReactNode zurück, das neben dem <img> gerendert wird.
 * Im normalen Modus: null (kein Overhead).
 * Im Edit Mode: schwebende Schaltfläche über dem Bild; Klick öffnet URL-Eingabe.
 *
 * Verwendung:
 *   const { overlayElement } = useEditableImage(src, 'imageSrc');
 *   <div className="mymodule__image-wrap">
 *     <img src={src} alt={alt} />
 *     {overlayElement}
 *   </div>
 *
 * Hinweis: Das Eltern-Element braucht `position: relative` (oder das Modul-CSS
 * setzt es bereits — dann nichts tun).
 */
export function useEditableImage(currentSrc: string, propPath: string) {
  const { isEditMode } = useEditModeState();
  const { updateBlock } = useEditModeActions();
  const blockIndex = useBlockIndex();

  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(currentSrc);
  const overlayRef = useRef<HTMLDivElement>(null);

  if (!isEditMode) return { overlayElement: null };

  function commit() {
    const trimmed = inputValue.trim();
    if (trimmed) updateBlock(blockIndex, propPath, trimmed);
    setOpen(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') setOpen(false);
  }

  function handleOverlayClick(e: MouseEvent) {
    // Klick auf Overlay selbst (nicht auf Input/Button) schließt
    if (e.target === overlayRef.current) setOpen(false);
  }

  const overlayElement = (
    <div className="edit__image-wrap">
      <button
        className="edit__image-btn"
        onClick={() => {
          setInputValue(currentSrc);
          setOpen(true);
        }}
        title="Bild tauschen"
      >
        ✎
      </button>

      {open && (
        <div
          ref={overlayRef}
          className="edit__image-overlay"
          onClick={handleOverlayClick}
        >
          <div className="edit__image-panel">
            <input
              className="edit__image-input"
              type="url"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Bild-URL eingeben…"
              autoFocus
            />
            <button className="edit__image-confirm" onClick={commit}>
              OK
            </button>
            <button className="edit__image-cancel" onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return { overlayElement };
}
```

**Erklärung:**
- Inline-Overlay (kein Portal) — ausreichend für Module ohne `overflow: hidden` auf Elternebene.
- Enter/Escape als Keyboard-Shortcuts.
- Klick auf den dunkel-transparenten Backdrop (`.edit__image-overlay`) schließt ohne zu speichern.
- `autoFocus` auf Input für sofortige Eingabe nach Öffnen.

---

### Schritt 3: EditMode.css

**Datei:** `src/builder/EditMode.css`

```css
/* ── Text Editing ─────────────────────────────────────────────────────────── */
/* Attribut-Selektor statt Klasse — der Hook überschreibt keine bestehenden classNames */

[data-edit-mode="text"] {
  outline: 2px dashed var(--primary);
  outline-offset: 2px;
  border-radius: var(--radius_sm);
  cursor: text;
  min-width: 1ch;
}

[data-edit-mode="text"]:focus {
  outline-style: solid;
  background-color: color-mix(in srgb, var(--primary) 8%, transparent);
}

/* ── Image Editing ────────────────────────────────────────────────────────── */

/* Wrapper über dem Eltern-Element des <img> */
.edit__image-wrap {
  position: absolute;
  inset: 0;
  pointer-events: none; /* Durchsichtig für Hover bis Button gezeigt wird */
}

.edit__image-wrap:hover,
.edit__image-wrap:focus-within {
  pointer-events: auto;
}

/* Tausch-Button oben rechts im Bild */
.edit__image-btn {
  position: absolute;
  top: var(--space_xs);
  right: var(--space_xs);
  background: var(--primary);
  color: var(--inverted_text);
  border: none;
  border-radius: var(--radius_sm);
  padding: var(--space_xs) var(--space_sm);
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  opacity: 0;
  transition: opacity 0.15s;
  pointer-events: auto;
}

.edit__image-wrap:hover .edit__image-btn,
.edit__image-wrap:focus-within .edit__image-btn {
  opacity: 1;
}

/* Halbtransparenter Vollbild-Backdrop */
.edit__image-overlay {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 40%);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}

/* Eingabe-Panel in der Mitte */
.edit__image-panel {
  display: flex;
  gap: var(--space_sm);
  background: var(--surface);
  border-radius: var(--radius_md);
  padding: var(--space_md);
  box-shadow: 0 8px 32px rgb(0 0 0 / 24%);
  min-width: 360px;
}

.edit__image-input {
  flex: 1;
  border: 1px solid var(--muted_text);
  border-radius: var(--radius_sm);
  padding: var(--space_xs) var(--space_sm);
  font-family: var(--font_family);
  font-size: 0.9rem;
  color: var(--text);
  background: var(--background);
}

.edit__image-input:focus {
  outline: 2px solid var(--primary);
  border-color: transparent;
}

.edit__image-confirm {
  background: var(--primary);
  color: var(--inverted_text);
  border: none;
  border-radius: var(--radius_sm);
  padding: var(--space_xs) var(--space_md);
  cursor: pointer;
  font-family: var(--font_family);
}

.edit__image-cancel {
  background: transparent;
  color: var(--muted_text);
  border: 1px solid var(--muted_text);
  border-radius: var(--radius_sm);
  padding: var(--space_xs) var(--space_sm);
  cursor: pointer;
  font-family: var(--font_family);
}
```

**Erklärung:**
- Alle Farben/Abstände via `var(--…)` Token — kein hardcodierter Wert.
- `.edit__image-wrap` ist `position: absolute; inset: 0` → das Eltern-Element des Bildes braucht `position: relative`. Das wird in den Modul-CSS-Dateien ergänzt (Plan 04.3).
- `pointer-events: none` auf Wrap bis Hover — der Edit-Button erscheint nur wenn man über das Bild hovert.

---

### Schritt 4: EditMode.css in useEditableImage importieren

`EditMode.css` wird von `useEditableImage.tsx` selbst importiert (`import './EditMode.css'`  — bereits in Schritt 2 enthalten). Kein globaler Import nötig.

---

## Validierung

### Manuelle Tests
- [ ] `useEditableText('heading')` gibt `{}` zurück wenn `isEditMode === false`
- [ ] Im Edit Mode: Klick auf einen Text zeigt gestrichelte Outline, Text ist editierbar
- [ ] Nach Blur: `updateBlock` wurde mit richtigem `propPath` + Wert aufgerufen
- [ ] `useEditableImage` gibt `{ overlayElement: null }` zurück wenn nicht im Edit Mode
- [ ] Im Edit Mode: Hover über Bild zeigt ✎-Button
- [ ] Klick auf ✎ öffnet URL-Panel
- [ ] Enter in Input → speichert, schließt Panel
- [ ] Escape → schließt ohne zu speichern
- [ ] Klick auf Backdrop → schließt ohne zu speichern

### Erwartetes Verhalten
Nach Plan 02: Hooks existieren und funktionieren korrekt — aber noch kein Modul nutzt sie (kommt in Plan 04.x). Zum Testen kann temporär ein Modul manuell angepasst werden.

---

*Status: Ausstehend*
*Erstellt am: 2026-04-11*
