# Component Quality - Plan 03: Gallery Heading

## Übersicht

| Aspekt | Details |
|--------|---------|
| **Ziel** | `Gallery` bekommt optionale `heading` + `subheading` Props für Titel oberhalb der Bildergalerie |
| **Abhängig von** | — (unabhängig) |
| **Betroffene Bereiche** | Frontend (Modul: Gallery) |
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
`Gallery` mit optionalen `heading` + `subheading` Props.

## Voraussetzungen
- [ ] Keine

## Betroffene Dateien

### Zu ändernde Dateien
| Datei | Art der Änderung |
|-------|------------------|
| `src/elements/media/Gallery/Gallery.schema.ts` | `heading?: z.string()`, `subheading?: z.string()` hinzufügen |
| `src/elements/media/Gallery/Gallery.tsx` | Gallery-Header mit heading/subheading rendern |
| `src/elements/media/Gallery/Gallery.css` | `.gallery__header`, `.gallery__heading`, `.gallery__subheading` hinzufügen |

## Implementierung

### Schritt 1: Schema erweitern

**Datei:** `src/elements/media/Gallery/Gallery.schema.ts`

**Änderung:** Im `z.object({…})` am Anfang `heading` und `subheading` hinzufügen (vor `images`):

```typescript
export const GalleryPropsSchema = z.object({
    /**
     * Optional heading displayed above the gallery grid.
     */
    heading: z.string().optional(),

    /**
     * Optional smaller subheading below the heading (e.g. descriptive text).
     */
    subheading: z.string().optional(),

    /**
     * Images to display in the gallery grid.
     * Must contain at least 2 and at most 4 items.
     */
    images: z.array(GalleryImageSchema).min(2).max(4),

    /**
     * Number of grid columns on desktop (> 640 px).
     * Drives data-columns attribute → CSS custom property --gallery-cols.
     * Always 1 column on mobile. Defaults to 2.
     */
    columns: z.union([z.literal(2), z.literal(3)]).default(2),

    /**
     * Gap between grid cells.
     * Drives data-gap attribute → CSS custom property --gallery-gap.
     * Accepts 'sm', 'md', or 'lg'. Defaults to 'md'.
     */
    gap: z.enum(['sm', 'md', 'lg']).default('md'),
}).refine(
    // ... refine bleibt unverändert ...
);
```

**Erklärung:** `heading` und `subheading` sind beide optional — Gallery funktioniert auch ohne. Sie stehen vor `images` weil sie visuell oben sitzen.

---

### Schritt 2: Gallery.tsx erweitern

**Datei:** `src/elements/media/Gallery/Gallery.tsx`

**Änderung:** `heading`/`subheading` in Props deklarieren und ein Header-Div rendern:

```typescript
import './Gallery.css';
import { useEditableText } from '../../../builder/useEditableText';
import { EditableImage } from '../../shared/EditableImage';
import type { GalleryProps, GalleryImage } from './Gallery.schema';

export default function Gallery({ heading, subheading, images, columns, gap }: GalleryProps) {
    const headingEdit = useEditableText('heading');
    const subheadingEdit = useEditableText('subheading');

    return (
        <section className="section gallery">
            {(heading || subheading) && (
                <div className="gallery__header">
                    {heading && <h2 className="gallery__heading" {...headingEdit}>{heading}</h2>}
                    {subheading && <p className="gallery__subheading" {...subheadingEdit}>{subheading}</p>}
                </div>
            )}
            <div
                className="gallery__grid"
                data-columns={columns}
                data-gap={gap}
            >
                {images.map((image, index) => (
                    <GalleryItem key={index} image={image} index={index} />
                ))}
            </div>
        </section>
    );
}

// GalleryItem bleibt unverändert
function GalleryItem({
    image,
    index,
}: {
    image: GalleryImage;
    index: number;
}) {
    // ... code unverändert ...
}
```

**Erklärung:**
- `{(heading || subheading) && (…)}` — Header-Div nur rendern wenn mindestens eines der Felder gesetzt ist
- `heading` ist `<h2>`, nicht `<h1>` — Gallery ist untergeordnet auf der Seite
- `subheading` ist `<p>` — beschreibender Text
- `useEditableText` für beide damit Edit-Mode funktioniert

---

### Schritt 3: CSS hinzufügen

**Datei:** `src/elements/media/Gallery/Gallery.css`

**Änderung:** Neue Klassen für Header hinzufügen (vor `.gallery__grid`):

```css
/* Header section above the grid (heading + subheading) */
.gallery__header {
    display: flex;
    flex-direction: column;
    gap: var(--space_sm);
    margin-bottom: var(--space_lg);
    text-align: center;
}

.gallery__heading {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--secondary);
}

.gallery__subheading {
    margin: 0;
    font-size: 1rem;
    color: var(--muted_text);
    line-height: 1.5;
}

/* Column count → CSS custom property for grid-template-columns */
.gallery__grid[data-columns="2"] { --gallery-cols: 2; }
/* ... rest bleibt unverändert ... */
```

**Erklärung:**
- `.gallery__header` ist flex-column mit Gap — stapelt heading + subheading vertikal
- `margin-bottom: var(--space_lg)` — Abstand zum Grid
- Heading und Subheading nutzen bestehende Farb-Tokens (secondary, muted_text)

---

## Aufrufer umstellen

Keine.

---

## Validierung

### Manuelle Tests
- [ ] Gallery mit `heading: "Unsere Werke"` + `subheading: "Fotos aus unserem Café"` → Heading und Subheading über dem Grid sichtbar
- [ ] Gallery ohne heading/subheading → kein Header, Grid fängt direkt an wie vorher
- [ ] Responsive: Header + Grid auf mobile korrekt gestapelt

### Erwartetes Verhalten
Galerie ist jetzt kontextualisiert — nicht nur lose Bilder, sondern eine benannte Sektion.

## Rollback-Plan

1. `heading` + `subheading` aus `GalleryPropsSchema` entfernen
2. Header-Renderblock aus `Gallery.tsx` entfernen
3. `.gallery__header`, `.gallery__heading`, `.gallery__subheading` aus `Gallery.css` entfernen

---

*Status: Ausstehend*
*Erstellt am: 2026-04-16*
