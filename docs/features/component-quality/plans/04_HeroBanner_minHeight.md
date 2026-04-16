# Component Quality - Plan 04: HeroBanner minHeight

## Übersicht

| Aspekt | Details |
|--------|---------|
| **Ziel** | `HeroBanner` bekommt optionales `minHeight` Prop (Default: 480px) für bessere visuellen Proportionen ohne Hintergrundbild. Nebeneffekt: Fix eines Test-Bugs (entferne nicht-existentes `textColor` Prop). |
| **Abhängig von** | — (unabhängig) |
| **Betroffene Bereiche** | Frontend (Modul: HeroBanner) + Tests |
| **Geschätzte Komplexität** | Niedrig |

### Größen-Check

| Metrik | Wert | Schwellwert |
|--------|------|-------------|
| Implementierungsschritte | 2 | >8 → Sub-Pläne |
| Neue Dateien | 0 | >5 → Sub-Pläne |
| Zu ändernde Dateien | 2 | >10 → Sub-Pläne |

## Schnittstellen

### Inputs
Keine.

### Outputs
`HeroBanner` mit optionalem `minHeight: number` Prop (px-Wert).

## Voraussetzungen
- [ ] Keine

## Betroffene Dateien

### Zu ändernde Dateien
| Datei | Art der Änderung |
|-------|------------------|
| `src/elements/layout/HeroBanner/HeroBanner.schema.ts` | `minHeight?: z.number().min(200).max(900)` hinzufügen; ggf. nicht-existentes `textColor` Prop entfernen |
| `src/elements/layout/HeroBanner/HeroBanner.tsx` | `minHeight` als inline style anwenden |

## Implementierung

### Schritt 1: Schema erweitern + Bug fixen

**Datei:** `src/elements/layout/HeroBanner/HeroBanner.schema.ts`

**Änderung:** 

```typescript
import { z } from 'zod';
import type { ModuleMeta } from '../../../builder/types';

export const HeroBannerPropsSchema = z.object({
    /** Large H1 headline displayed center-stage. */
    heading: z.string(),

    /** Smaller paragraph below the heading. */
    subheading: z.string().optional(),

    /** Call-to-action button label. No button rendered when omitted. */
    ctaLabel: z.string().optional(),

    /** URL the CTA button links to. Falls back to '#' when ctaLabel is set but this is omitted. */
    ctaHref: z.string().optional(),

    /**
     * Keywords describing the desired background photo (e.g. "cozy cafe interior warm light").
     * Filled automatically into backgroundImage — do not provide a URL.
     */
    imageQuery: z.string().optional(),

    /**
     * Background color as any CSS color string (e.g. '#2D5BFF', 'hsl(230,100%,50%)').
     * Applied as an inline style because the value is unbounded.
     * Defaults to var(--primary) via CSS when omitted.
     * When backgroundImage is also set this color is used as the overlay tint.
     */
    background: z.string().optional(),

    /**
     * URL of a full-bleed background photo.
     * When provided the image is displayed cover-fit and a semi-transparent
     * overlay (from `background`) is layered on top so text stays legible.
     */
    backgroundImage: z.string().optional(),

    /**
     * Minimum height in pixels. Applied as inline style.
     * Useful when no background image is set — ensures the hero doesn't collapse.
     * Accepts 200 (minimum) to 900 (maximum). Defaults to 480.
     */
    minHeight: z.number().min(200).max(900).default(480),
});

export type HeroBannerProps = z.infer<typeof HeroBannerPropsSchema>;

export const HeroBannerDefaults: HeroBannerProps = {
    heading: 'Welcome to Our Platform',
    subheading: 'Everything you need to build and ship faster.',
    ctaLabel: 'Get Started',
    ctaHref: '#',
    // minHeight is NOT set here — it remains undefined, and Zod applies the schema default (480)
};

export const HeroBannerMeta: ModuleMeta = {
    name: 'HeroBanner',
    category: 'layout',
    description:
        'Full-width centered hero section with headline, optional subheading, optional CTA button, and configurable minimum height. Place directly below the Header.',
    tags: ['hero', 'banner', 'cta', 'layout', 'landing'],
};
```

**Erklärung:**
- `minHeight: z.number().min(200).max(900).default(480)` — Typ, Guard, Default in einem
- Keine `textColor`-Feld (das war ein Test-Bug, nicht im ursprünglichen Schema)
- Default `480` in `HeroBannerDefaults`
- Description updated um minHeight-Erwähnung

---

### Schritt 2: HeroBanner.tsx erweitern

**Datei:** `src/elements/layout/HeroBanner/HeroBanner.tsx`

**Änderung:** `minHeight` als inline style anwenden:

```typescript
import './HeroBanner.css';
import type { CSSProperties } from 'react';
import { useEditableText } from '../../../builder/useEditableText';
import type { HeroBannerProps } from './HeroBanner.schema';

export default function HeroBanner({
    heading,
    subheading,
    ctaLabel,
    ctaHref,
    background,
    backgroundImage,
    minHeight,
}: HeroBannerProps) {
    const headingEdit = useEditableText('heading');
    const subheadingEdit = useEditableText('subheading');
    const ctaLabelEdit = useEditableText('ctaLabel');

    // Build inline background style.
    // - Image only: dark overlay so text stays legible.
    // - Image + color: use color as the overlay tint.
    // - Color only: set as flat background.
    // - Neither: CSS var(--primary) takes effect naturally.
    let rootStyle: CSSProperties | undefined;
    if (backgroundImage) {
        const overlay = background ?? 'rgba(0,0,0,0.45)';
        rootStyle = {
            background: `linear-gradient(${overlay}, ${overlay}), url('${backgroundImage}') center / cover no-repeat`,
            minHeight: `${minHeight}px`,
        };
    } else if (background !== undefined) {
        rootStyle = { 
            background,
            minHeight: `${minHeight}px`,
        };
    } else {
        rootStyle = { 
            minHeight: `${minHeight}px`,
        };
    }

    return (
        <section
            className="hero_banner"
            data-has-image={backgroundImage ? 'true' : undefined}
            style={rootStyle}
        >
            <div className="hero_banner__inner">
                <h1 className="hero_banner__heading" {...headingEdit}>{heading}</h1>

                {subheading && (
                    <p className="hero_banner__subheading" {...subheadingEdit}>{subheading}</p>
                )}

                {ctaLabel && (
                    <a className="hero_banner__cta" href={ctaHref ?? '#'} {...ctaLabelEdit}>
                        {ctaLabel}
                    </a>
                )}
            </div>
        </section>
    );
}
```

**Erklärung:**
- `minHeight: `${minHeight}px`` wird zu rootStyle hinzugefügt — in jedem Zweig der if/else
- rootStyle ist jetzt immer definiert (nicht nur bei backgroundImage/background vorhanden) — minHeight ist der Fallback
- Inline style für minHeight ist CLAUDE.md-konform ("genuinely dynamic values")

---

## Aufrufer umstellen

Keine direkt, aber: bestehende Test-Datei `src/elements/components.test.tsx` nutzt nicht-existentes `textColor` Prop auf HeroBanner. Das wird durch diesen Plan indirekt gefixt (textColor-Zeilen müssen raus wenn die Tests aktualisiert werden).

---

## Validierung

### Manuelle Tests
- [ ] HeroBanner mit `minHeight: 600` (keine Bilder) → Höher als Default 480
- [ ] HeroBanner mit `minHeight: 400` + Bild → Bild wird beschnitten (aspect ratio beachtet)
- [ ] HeroBanner ohne `minHeight` (default 480) → Rendering ok

### Erwartetes Verhalten
Hero wirkt ohne Bild nicht zu flach — die minHeight sorgt für bessere Proportionen.

## Rollback-Plan

1. `minHeight` aus `HeroBannerPropsSchema` entfernen
2. Kommentar zu `minHeight` aus `HeroBannerDefaults` entfernen (Zeile bleibt wie vorher ohne Default-Setzung)
3. `minHeight: \`${minHeight}px\`` aus allen rootStyle-Zuweisungen entfernen

---

## Nebeneffekt: Test-Bug-Fix

**Kontext:** `src/elements/components.test.tsx` Zeilen 80, 85, 91, 98 nutzen ein nicht-existentes `textColor: "light"` Prop auf HeroBanner-Blöcken. Diese Plan entfernt dieses Prop NICHT (es war nie vorhanden), aber die bestehenden Tests werden wahrscheinlich fehlschlagen wenn HeroBanner ansonsten ändert.

**Handlung:** Nach Implementierung dieses Plans sollten die Test-Zeilen die `textColor` nutzen aktualisiert/entfernt werden. Das ist ein separater Task, nicht Teil dieses Plans. Aber: Diese Pläne machen den Test-Bug sichtbar → Zeit zu fixen.

---

*Status: Ausstehend*
*Erstellt am: 2026-04-16*
