# imageQuery Refactor - Plan 01: Schemas + imageFiller + EditableImage

## Übersicht

| Aspekt | Details |
|--------|---------|
| **Ziel** | LLM liefert `imageQuery` Keywords statt URLs; imageFiller liest diese direkt; URL-Felder werden post-hoc gefüllt |
| **Abhängig von** | — (erster und einziger Plan) |
| **Betroffene Bereiche** | Shared Schemas, Module Schemas, LLM-Layer, Shared Components |
| **Geschätzte Komplexität** | Niedrig |

### Größen-Check

| Metrik | Wert | Schwellwert |
|--------|------|-------------|
| Implementierungsschritte | 7 | >8 → Sub-Pläne |
| Neue Dateien | 0 | >5 → Sub-Pläne |
| Zu ändernde Dateien | 8 | >10 → Sub-Pläne |

→ Kein Sub-Plan nötig.

## Schnittstellen (Kohärenz-Vertrag)

### Inputs
— (kein vorheriger Plan)

### Outputs
Alle Module-Schemas exportieren `imageQuery` als Feld. `imageFiller` nutzt dieses Feld direkt.

## Voraussetzungen
- [ ] Kein anderer Plan

## Betroffene Dateien

### Neue Dateien
— keine

### Zu ändernde Dateien
| Datei | Art der Änderung |
|-------|------------------|
| `src/elements/shared/schemas.ts` | `imageQuery?: string` zu CardSchema hinzufügen |
| `src/elements/layout/HeroBanner/HeroBanner.schema.ts` | `imageQuery?: string` hinzufügen |
| `src/elements/content/MediaText/MediaText.schema.ts` | `imageQuery: string` (required), `imageSrc` → optional mit default `''` |
| `src/elements/media/ImageBlock/ImageBlock.schema.ts` | `imageQuery: string` (required), `src` → optional mit default `''` |
| `src/elements/media/Gallery/Gallery.schema.ts` | `imageQuery: string` (required) in GalleryImageSchema, `src` → optional mit default `''` |
| `src/llm/imageFiller.ts` | `collectFromBlock` liest `imageQuery`; `buildQuery`, `tokenize`, `transliterate`, `extractContext` löschen |
| `src/elements/shared/EditableImage.tsx` | Kein `<img>` rendern wenn `src` leer |
| `src/elements/schemas.test.ts` | Tests an neue Schema-Constraints anpassen |

### Zu löschende Funktionen
| Datei | Funktion | Grund |
|-------|----------|-------|
| `src/llm/imageFiller.ts` | `buildQuery()` | Nicht mehr nötig |
| `src/llm/imageFiller.ts` | `tokenize()` | Nicht mehr nötig |
| `src/llm/imageFiller.ts` | `transliterate()` | Nicht mehr nötig |
| `src/llm/imageFiller.ts` | `extractContext()` | Nicht mehr nötig |
| `src/llm/imageFiller.ts` | Export `buildImageQuery`, `tokenizeKeyword` | Test-Exports für gelöschte Funktionen |

---

## Implementierung

### Schritt 1: CardSchema — `imageQuery` hinzufügen

**Datei:** `src/elements/shared/schemas.ts`

```ts
export const CardSchema = z.object({
    /** Keywords describing the desired image (e.g. "espresso coffee cup"). Filled automatically into imageSrc — do not provide a URL. */
    imageQuery: z.string().optional(),
    /** Populated automatically from imageQuery — leave empty. */
    imageSrc:   z.string().optional(),
    imageAlt:   z.string().optional(),
    title:      z.string(),
    body:       z.string().optional(),
});
```

**Erklärung:** `imageQuery` optional da Karten kein Bild haben müssen. `imageSrc` bleibt optional (war es schon) und bekommt einen Hinweis-Kommentar.

---

### Schritt 2: HeroBanner — `imageQuery` hinzufügen

**Datei:** `src/elements/layout/HeroBanner/HeroBanner.schema.ts`

Im `z.object({...})` nach `ctaHref` einfügen:

```ts
/**
 * Keywords describing the desired background photo (e.g. "cozy cafe interior warm light").
 * Filled automatically into backgroundImage — do not provide a URL.
 */
imageQuery: z.string().optional(),
```

`backgroundImage` bleibt unverändert (war schon optional).

---

### Schritt 3: MediaText — `imageQuery` required, `imageSrc` optional

**Datei:** `src/elements/content/MediaText/MediaText.schema.ts`

```ts
export const MediaTextPropsSchema = z.object({
    /** Keywords describing the desired image (e.g. "barista latte art coffee"). Filled automatically into imageSrc — do not provide a URL. */
    imageQuery:    z.string(),
    /** Populated automatically from imageQuery — leave empty. */
    imageSrc:      z.string().default(''),
    imageAlt:      z.string(),
    heading:       z.string().optional(),
    body:          z.string(),
    imagePosition: z.enum(['left', 'right']).default('left'),
});
```

`MediaTextDefaults` anpassen:
```ts
export const MediaTextDefaults: MediaTextProps = {
    imageQuery:    'placeholder image',
    imageSrc:      '',
    imageAlt:      'Placeholder image',
    body:          'Describe what makes this image interesting.',
    imagePosition: 'left',
};
```

---

### Schritt 4: ImageBlock — `imageQuery` required, `src` optional

**Datei:** `src/elements/media/ImageBlock/ImageBlock.schema.ts`

```ts
export const ImageBlockPropsSchema = z.object({
    /** Keywords describing the desired image (e.g. "modern office workspace"). Filled automatically into src — do not provide a URL. */
    imageQuery: z.string(),
    /** Populated automatically from imageQuery — leave empty. */
    src:        z.string().default(''),
    alt:        z.string(),
    caption:    z.string().optional(),
    objectFit:  z.enum(['cover', 'contain', 'fill']).default('cover'),
    maxHeight:  z.number().default(480),
});
```

`ImageBlockDefaults` anpassen:
```ts
export const ImageBlockDefaults: ImageBlockProps = {
    imageQuery: 'placeholder image',
    src:        '',
    alt:        'Placeholder image',
    objectFit:  'cover',
    maxHeight:  480,
};
```

---

### Schritt 5: Gallery — `imageQuery` required, `src` optional

**Datei:** `src/elements/media/Gallery/Gallery.schema.ts`

`GalleryImageSchema` anpassen:
```ts
export const GalleryImageSchema = z.object({
    /** Keywords describing the desired photo (e.g. "mountain landscape sunset"). Filled automatically into src — do not provide a URL. */
    imageQuery: z.string(),
    /** Populated automatically from imageQuery — leave empty. */
    src:        z.string().default(''),
    alt:        z.string(),
    caption:    z.string().optional(),
});
```

`GalleryDefaults` anpassen:
```ts
export const GalleryDefaults: GalleryProps = {
    images: [
        { imageQuery: 'gallery image one',   src: '', alt: 'Gallery image one',   caption: 'Caption for image one'   },
        { imageQuery: 'gallery image two',   src: '', alt: 'Gallery image two',   caption: 'Caption for image two'   },
    ],
    columns: 2,
    gap: 'md',
};
```

---

### Schritt 6: imageFiller — Vereinfachen

**Datei:** `src/llm/imageFiller.ts`

**Zu löschende Funktionen:** `buildQuery`, `tokenize`, `transliterate`, `extractContext` und der Export am Ende (`export { buildImageQuery as buildImageQuery, tokenizeKeyword as tokenizeKeyword }`).

**`fillImages` Signatur vereinfachen** — `userPrompt` Parameter entfernen da `extractContext` wegfällt:
```ts
export async function fillImages(spec: SiteSpec): Promise<SiteSpec>
```

**`resolveSlot`** — `globalContext` und `buildQuery` entfernen, direkt `slot.imageQuery` nutzen:
```ts
async function resolveSlot(
    slot: ImageSlot,
    idx: number,
    pixabayApiKey: string,
): Promise<{ url: string; query: string }> {
    const query = slot.imageQuery || 'photography';
    const url = pixabayApiKey
        ? await fetchPixabay(query, slot.width, slot.height, idx, pixabayApiKey)
        : loremFlickrUrl(query, slot.width, slot.height, idx);
    return { url, query };
}
```

**`ImageSlot` Interface** — `keywordHint` umbenennen zu `imageQuery`:
```ts
interface ImageSlot {
    readonly imageQuery: string;
    readonly width: number;
    readonly height: number;
    readonly label: string;
    readonly apply: (url: string) => void;
}
```

**`collectFromBlock`** — Für jeden case `keywordHint` ersetzen durch direktes Lesen von `props.imageQuery`:

```ts
case 'HeroBanner': {
    slots.push({
        imageQuery: typeof props.imageQuery === 'string' ? props.imageQuery : '',
        width: 1600, height: 700,
        label: `${where}.backgroundImage`,
        apply: (url) => { props.backgroundImage = url; },
    });
    break;
}

case 'ImageBlock': {
    slots.push({
        imageQuery: typeof props.imageQuery === 'string' ? props.imageQuery : '',
        width: 1200, height: 480,
        label: `${where}.src`,
        apply: (url) => { props.src = url; },
    });
    break;
}

case 'MediaText': {
    slots.push({
        imageQuery: typeof props.imageQuery === 'string' ? props.imageQuery : '',
        width: 800, height: 600,
        label: `${where}.imageSrc`,
        apply: (url) => { props.imageSrc = url; },
    });
    break;
}

case 'Gallery': {
    const images = props.images;
    if (Array.isArray(images)) {
        images.forEach((img, idx) => {
            if (img && typeof img === 'object') {
                const entry = img as { src: string; imageQuery?: unknown };
                slots.push({
                    imageQuery: typeof entry.imageQuery === 'string' ? entry.imageQuery : '',
                    width: 800, height: 600,
                    label: `${where}.images[${idx}].src`,
                    apply: (url) => { entry.src = url; },
                });
            }
        });
    }
    break;
}

case 'CardRow':
case 'CardGrid': {
    const cards = props.cards;
    if (Array.isArray(cards)) {
        cards.forEach((card, idx) => {
            if (card && typeof card === 'object') {
                const entry = card as { imageSrc: string; imageQuery?: unknown };
                slots.push({
                    imageQuery: typeof entry.imageQuery === 'string' ? entry.imageQuery : '',
                    width: 600, height: 400,
                    label: `${where}.cards[${idx}].imageSrc`,
                    apply: (url) => { entry.imageSrc = url; },
                });
            }
        });
    }
    break;
}
```

**`fillImages` Aufruf in `resolveSlot`** anpassen (globalContext entfernen):
```ts
const results = await Promise.allSettled(
    slots.map((slot, idx) => resolveSlot(slot, idx, key)),
);
```

**Aufrufer `generateSpec.ts`** — `fillImages(validated.spec, userPrompt)` → `fillImages(validated.spec)` (userPrompt-Argument entfernen)

---

### Schritt 7: EditableImage — leeres src graceful handhaben

**Datei:** `src/elements/shared/EditableImage.tsx`

`src` Typ von `string` zu `string | undefined` ändern (oder leer-String abfangen):

```tsx
export function EditableImage({
    path,
    src,
    alt = '',
    wrapperClassName,
    imgClassName,
    imgStyle,
}: EditableImageProps) {
    const { overlayElement } = useEditableImage(src ?? '', path);
    return (
        <div className={wrapperClassName}>
            {src && <img className={imgClassName} src={src} alt={alt} style={imgStyle} />}
            {overlayElement}
        </div>
    );
}
```

Auch `EditableImageProps.src` auf `string | undefined` anpassen.

---

## Aufrufer umstellen

| Datei | Stelle | Alter Aufruf | Neuer Aufruf |
|-------|--------|--------------|--------------|
| `src/llm/generateSpec.ts` | `fillImages(...)` | `fillImages(validated.spec, userPrompt)` | `fillImages(validated.spec)` |

---

## Tests anpassen

**Datei:** `src/elements/schemas.test.ts`

| Test | Änderung |
|------|----------|
| `MediaTextPropsSchema` — "parses with only required fields" | `imageSrc` entfernen, `imageQuery` hinzufügen |
| `MediaTextPropsSchema` — "rejects missing imageSrc" | Test löschen (imageSrc ist nicht mehr required) |
| `MediaTextPropsSchema` — "parses defaults" | Läuft weiter, da Defaults aktualisiert werden |
| `MediaTextPropsSchema` — neu | Test "rejects missing imageQuery" |
| `ImageBlockPropsSchema` — "parses with only required fields (src, alt)" | `src` entfernen, `imageQuery` hinzufügen |
| `ImageBlockPropsSchema` — "rejects missing src" | Test löschen (src nicht mehr required) |
| `ImageBlockPropsSchema` — neu | Test "rejects missing imageQuery" |
| `GalleryImageSchema` — "parses valid image" | `imageQuery` zu Testdaten hinzufügen |
| `GalleryImageSchema` — "rejects missing src" | Test löschen (src nicht mehr required) |
| `GalleryImageSchema` — neu | Test "rejects missing imageQuery" |
| `CardSchema` — neu | Test "parses with imageQuery" |

---

## Validierung

### Automatisierte Tests
```bash
npm run test
npm run build
```

### Manuelle Tests
- [ ] Prompt eingeben → Log zeigt `imageQuery`-Werte statt URL-Extraktion
- [ ] Generierte Website zeigt echte Bilder (Pixabay/LoremFlickr)
- [ ] Bestehende Spec aus localStorage (ohne imageQuery) rendert ohne kaputte Bilder

### Erwartetes Verhalten
- LLM-Output enthält `imageQuery: "coffee beans roasting"` statt `imageSrc: "https://unsplash.com/..."`
- Log zeigt: `HeroBanner[0].backgroundImage → "cozy cafe darmstadt"`
- Keine Änderung am Edit-Mode-Verhalten

---

*Status: Ausstehend*
*Erstellt am: 2026-04-14*
