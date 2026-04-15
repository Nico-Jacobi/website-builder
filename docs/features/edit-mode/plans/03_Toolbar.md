# Edit Mode - Plan 03: EditModeToolbar

## Übersicht

| Aspekt | Details |
|--------|---------|
| **Ziel** | Schwebende Toolbar zum Ein-/Ausschalten des Edit Modes — isoliert, in einer Zeile entfernbar |
| **Abhängig von** | Plan 01 |
| **Betroffene Bereiche** | Frontend |
| **Geschätzte Komplexität** | Niedrig |

### Größen-Check
| Metrik | Wert | Schwellwert |
|--------|------|-------------|
| Implementierungsschritte | 3 | >8 → Sub-Pläne |
| Neue Dateien | 2 | >5 → Sub-Pläne |
| Zu ändernde Dateien | 1 | >10 → Sub-Pläne |

## Schnittstellen (Kohärenz-Vertrag)

### Inputs (was dieser Plan von Plan 01 erwartet)
| Von Plan | Was wird erwartet | Konkret |
|----------|-------------------|---------|
| Plan 01 | Context-Actions | `useEditModeState`, `useEditModeActions` aus `src/builder/EditModeContext.tsx` |
| Plan 01 | App.tsx importiert Toolbar | `<EditModeToolbar />` ist bereits in App.tsx referenziert (als Platzhalter) |

### Outputs
Keine Outputs für andere Pläne — Toolbar ist ein Leaf-Modul.

## Voraussetzungen

- [ ] Plan 01 abgeschlossen
- [ ] `EditModeContext` exportiert `useEditModeState` und `useEditModeActions`

## Betroffene Dateien

### Neue Dateien
| Datei | Beschreibung |
|-------|--------------|
| `src/builder/EditModeToolbar.tsx` | Schwebende Toolbar-Komponente |
| `src/builder/EditModeToolbar.css` | Styles: fixed position, Tokens |

### Zu ändernde Dateien
| Datei | Art der Änderung |
|-------|------------------|
| `src/App.tsx` | Import + `<EditModeToolbar />` einfügen (falls noch nicht aus Plan 01) |

---

## Implementierung

### Schritt 1: EditModeToolbar.tsx

**Datei:** `src/builder/EditModeToolbar.tsx`

```tsx
import './EditModeToolbar.css';
import { useEditModeState, useEditModeActions } from './EditModeContext';

/**
 * Schwebende Toolbar zum Umschalten des Edit Modes.
 *
 * TEMPORÄR — wird später durch Auth/Login ersetzt.
 * Entfernen: `<EditModeToolbar />` aus App.tsx und diesen Import löschen.
 * Keine andere Datei kennt diese Komponente.
 */
export function EditModeToolbar() {
  const { isEditMode } = useEditModeState();
  const { setIsEditMode } = useEditModeActions();

  return (
    <div className="edit-toolbar">
      <button
        className={`edit-toolbar__btn${isEditMode ? ' edit-toolbar__btn--active' : ''}`}
        onClick={() => setIsEditMode(!isEditMode)}
      >
        {isEditMode ? 'Fertig' : 'Bearbeiten'}
      </button>
    </div>
  );
}
```

**Erklärung:**
- Die Komponente hat genau eine Verantwortung: Context lesen + Toggle.
- Kein State, keine Logik außer dem Toggle.
- Der Kommentar macht explizit wie man sie entfernt.

---

### Schritt 2: EditModeToolbar.css

**Datei:** `src/builder/EditModeToolbar.css`

```css
/* Schwebende Edit-Toolbar — fixed, unten rechts */

.edit-toolbar {
  position: fixed;
  bottom: var(--space_xl);
  right: var(--space_xl);
  z-index: 9000;
}

.edit-toolbar__btn {
  background: var(--surface);
  color: var(--text);
  border: 2px solid var(--primary);
  border-radius: var(--radius_md);
  padding: var(--space_sm) var(--space_md);
  cursor: pointer;
  font-family: var(--font_family);
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: 0 4px 16px rgb(0 0 0 / 16%);
  transition: background 0.15s, color 0.15s;
}

.edit-toolbar__btn:hover {
  background: var(--primary);
  color: var(--inverted_text);
}

.edit-toolbar__btn--active {
  background: var(--primary);
  color: var(--inverted_text);
}

.edit-toolbar__btn--active:hover {
  background: var(--accent);
  border-color: var(--accent);
}
```

**Erklärung:**
- Hover-Effekt: Outline-Button wird gefüllt.
- Aktiver Zustand: Primärfarbe gefüllt, Hover wechselt zu Accent als visuellem Signal "Fertig klicken".
- `z-index: 9000` — unter dem Image-Overlay-Backdrop (`z-index: 10000`), aber über allem anderen.

---

### Schritt 3: EditModeToolbar in App.tsx einbinden

**Datei:** `src/App.tsx`

Import hinzufügen:
```tsx
import { EditModeToolbar } from './builder/EditModeToolbar';
```

In der JSX (nach `<Renderer>`):
```tsx
<EditModeProvider spec={spec} onSpecChange={setSpec}>
  <Renderer spec={spec} />
  <EditModeToolbar />   {/* TEMPORÄR — später durch Auth ersetzen */}
</EditModeProvider>
```

---

## Validierung

### Manuelle Tests
- [ ] Toolbar erscheint unten rechts als Outline-Button "Bearbeiten"
- [ ] Klick → Button wird gefüllt, Text wechselt zu "Fertig"
- [ ] Klick nochmal → zurück zu "Bearbeiten"
- [ ] Toolbar überlagert keinen wichtigen Inhalt (Abstände prüfen)
- [ ] Beim Öffnen des Image-Overlays liegt Toolbar darunter (z-index korrekt)

### Erwartetes Verhalten
Nach Plan 03: Toolbar Toggle funktioniert. Aber Editing hat noch keine sichtbare Wirkung auf Module — das kommt in Plan 04.x.

---

*Status: Ausstehend*
*Erstellt am: 2026-04-11*
