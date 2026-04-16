# Component Quality - Plan 02: TextBlock Eyebrow

## Übersicht

| Aspekt | Details |
|--------|---------|
| **Ziel** | `TextBlock` bekommt optionales `eyebrow` Prop — kleiner Label-Text über der Hauptüberschrift wie "ÜBER UNS" |
| **Abhängig von** | — (unabhängig) |
| **Betroffene Bereiche** | Frontend (Modul: TextBlock) |
| **Geschätzte Komplexität** | Niedrig |

### Größen-Check

| Metrik | Wert | Schwellwert |
|--------|------|-------------|
| Implementierungsschritte | 3 | >8 → Sub-Pläne |
| Neue Dateien | 0 | >5 → Sub-Pläne |
| Zu ändernde Dateien | 3 | >10 → Sub-Pläne |

## Schnittstellen

### Inputs
Keine.

### Outputs
`TextBlock` mit optionalem `eyebrow` Prop, das vom LLM (Plan 05) genutzt wird.

## Voraussetzungen
- [ ] Keine

## Betroffene Dateien

### Zu ändernde Dateien
| Datei | Art der Änderung |
|-------|------------------|
| `src/elements/content/TextBlock/TextBlock.schema.ts` | `eyebrow?: z.string()` hinzufügen |
| `src/elements/content/TextBlock/TextBlock.tsx` | `eyebrow` Prop rendern |
| `src/elements/content/TextBlock/TextBlock.css` | `.text_block__eyebrow` Stile hinzufügen |

## Implementierung

### Schritt 1: Schema erweitern

**Datei:** `src/elements/content/TextBlock/TextBlock.schema.ts`

**Änderung:** Im `TextBlockPropsSchema` ein `eyebrow`-Feld hinzufügen (vor `heading`):

```typescript
export const TextBlockPropsSchema = z.object({
    eyebrow: z.string().optional(),
    heading: z.string().optional(),
    body:    z.string(),
    subtext: z.string().optional(),
    align:   z.enum(['left', 'center', 'right']).default('left'),
});
```

**Erklärung:** `eyebrow` ist optional — nur setzen wenn ein Sektions-Label gewünscht ist. Wird vor `heading` definiert weil es auch visuell davor kommt.

---

### Schritt 2: TextBlock.tsx erweitern

**Datei:** `src/elements/content/TextBlock/TextBlock.tsx`

**Änderung:** `eyebrow` in den Props deklarieren und rendern:

```typescript
import './TextBlock.css';
import { useEditableText } from '../../../builder/useEditableText';
import type { TextBlockProps } from './TextBlock.schema';

export default function TextBlock({ eyebrow, heading, body, subtext, align }: TextBlockProps) {
    const eyebrowEdit = useEditableText('eyebrow');
    const headingEdit = useEditableText('heading');
    const bodyEdit = useEditableText('body');
    const subtextEdit = useEditableText('subtext');

    return (
        <div className="section text_block" data-align={align}>
            {eyebrow && <span className="text_block__eyebrow" {...eyebrowEdit}>{eyebrow}</span>}
            {heading && <h2 className="text_block__heading" {...headingEdit}>{heading}</h2>}
            <p className="text_block__body" {...bodyEdit}>{body}</p>
            {subtext && <p className="text_block__subtext" {...subtextEdit}>{subtext}</p>}
        </div>
    );
}
```

**Erklärung:**
- `eyebrow` wird als `<span>` (inline) gerendert — CSS macht es zu block-Element
- `useEditableText('eyebrow')` damit der Edit-Mode funktioniert
- Reihenfolge: eyebrow → heading → body → subtext

---

### Schritt 3: CSS hinzufügen

**Datei:** `src/elements/content/TextBlock/TextBlock.css`

**Änderung:** Neue `.text_block__eyebrow`-Klasse hinzufügen (vor `.text_block__heading`):

```css
.text_block__eyebrow {
    display: block;
    margin: 0 0 var(--space_sm) 0;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--primary);
}

.text_block[data-align="left"]   { text-align: left; }
.text_block[data-align="center"] { text-align: center; }
.text_block[data-align="right"]  { text-align: right; }

.text_block__heading {
    margin: 0 0 var(--space_md) 0;
    font-size: 2rem;
    color: var(--secondary);
}
/* ... rest bleibt unverändert ... */
```

**Erklärung:**
- `display: block` damit der Eyebrow über der Überschrift sitzt
- `font-size: 0.75rem` klein, unterordnend
- `text-transform: uppercase` + `letter-spacing: 0.12em` — das typische Eyebrow-Style
- `color: var(--primary)` — kontrastiert mit Heading-Farbe (secondary)
- Margin: `0 0 var(--space_sm) 0` — Abstand unten zur Heading

---

## Aufrufer umstellen

Keine — TextBlock wird vom Renderer genutzt, nicht direkt aufgerufen.

---

## Validierung

### Manuelle Tests
- [ ] TextBlock mit `eyebrow: "ÜBER UNS"` + `heading: "Unser Café"` → Eyebrow ist klein, uppercase, über der Heading
- [ ] TextBlock ohne `eyebrow` → kein zusätzliches Element gerendert, Seite sieht aus wie vorher
- [ ] Alignment: Eyebrow folgt der `data-align` des Blocks

### Erwartetes Verhalten
TextBlock kann jetzt eine Sektions-Marke haben wie bei professionellen Websites.

## Rollback-Plan

1. `eyebrow` aus `TextBlockPropsSchema` entfernen
2. `eyebrow`-Zeilen aus `TextBlock.tsx` entfernen
3. `.text_block__eyebrow`-Klasse aus `TextBlock.css` entfernen

---

*Status: Ausstehend*
*Erstellt am: 2026-04-16*
