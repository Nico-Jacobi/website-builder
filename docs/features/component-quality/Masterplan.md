# Masterplan: Component Quality

## 1. Ziel

Module sehen einzeln korrekt aus, wirken aber auf echten Seiten flach und austauschbar. Karten heben sich nicht vom Hintergrund ab, Galerien erscheinen kontextlos, Sektionsüberschriften fehlt die typografische Hierarchie die professionelle Sites haben, und der Hero ist zu flach ohne Bild.

Dieses Feature behebt genau diese vier Punkte durch additive Verbesserungen: neue optionale Props (eyebrow, heading/subheading, minHeight) und eine CSS-Anpassung für Cards. Alles bleibt schema-getrieben, keine Inline-Hacks außer bei genuinen dynamischen Werten (minHeight).

---

## 2. Hintergrund & Motivation

**Problem (aktuell):**
- `.card` hat kein `background` und keinen `box-shadow` → Karten sind auf `surface`-Backgrounds unsichtbar als Objekte
- `Gallery` hat keine Überschrift → drei Bilder ohne Kontext wirken beliebig
- `TextBlock` hat keinen Eyebrow-Label → keine typografische Hierarchie wie bei Schick Bau ("UNTERNEHMEN" über dem Titel)
- `HeroBanner` hat kein `minHeight` → ohne Bild wirkt der Hero zu niedrig/flach

**Lösung:**
- `.card` in `App.css` bekommt `background: var(--surface)` + `box-shadow`
- `Gallery` bekommt optionale `heading` + `subheading` Props
- `TextBlock` bekommt optionales `eyebrow` Prop
- `HeroBanner` bekommt optionales `minHeight` Prop (inline style — genuiner dynamischer Wert)
- `buildSystemPrompt.ts` wird erweitert damit das LLM die neuen Props nutzt

---

## 3. Nicht-Ziel (Scope-Abgrenzung)

- **Kein neues Modul** — alle Änderungen sind additive Props auf bestehenden Modulen
- **Kein Hover-State auf Cards** — Link-Verhalten ist nicht Teil dieses Features
- **Keine Card-Varianten** — keine separaten Schema-Felder für Elevation-Level, ein Standard reicht
- **Keine Änderung an Container** — der bekommt kein heading-Prop (das ist Aufgabe von TextBlock innerhalb)
- **Kein Callout-Redesign** — Callout hat bereits ein funktionierendes Tone-System

---

## 4. Architektur-Entscheidungen

### 4.1 Card Elevation in App.css (nicht in CardRow/CardGrid.css)

`.card` ist eine shared primitive in `App.css` — dort gehört `background` und `box-shadow` hin. CardRow/CardGrid nutzen `.card` via dem shared `<Card>`-Component, ohne es zu kennen. Wenn SectionShell später `tone: "muted"` auf einen CardGrid-Block setzt, hebt `background: var(--surface)` die Karte automatisch vom muted-Hintergrund ab — das ist genau das gewollte Verhalten.

### 4.2 Gallery Heading — Header-Div oberhalb des Grids

```
<section className="section gallery">
  <div className="gallery__header">          ← NEU (nur wenn heading vorhanden)
    <p className="gallery__eyebrow">…</p>    ← optional (kein eigenes Prop, entfällt)
    <h2 className="gallery__heading">…</h2>
    <p className="gallery__subheading">…</p>
  </div>
  <div className="gallery__grid">…</div>
</section>
```

Kein `eyebrow` auf Gallery — das wäre over-engineering für eine Medien-Komponente. Nur `heading` (h2) und `subheading` (p).

### 4.3 TextBlock Eyebrow — `<span>` über dem `<h2>`

```tsx
{eyebrow && <span className="text_block__eyebrow">{eyebrow}</span>}
{heading && <h2 className="text_block__heading">{heading}</h2>}
```

`<span>` statt `<p>` damit es kein Block-Element ist — CSS macht es zu `display: block` über der Überschrift. Kleine Caps, letter-spacing, accent-Farbe.

### 4.4 HeroBanner minHeight — inline style (CLAUDE.md-konform)

`minHeight` ist ein genuiner dynamischer Zahlenwert. CLAUDE.md erlaubt inline styles für "genuinely dynamic values". Ein `z.number()` mit Default `480` → `style={{ minHeight: minHeight }}` im JSX. CSS setzt kein festes `min-height`.

### 4.5 LLM-Guidance — prosa Regeln, nicht Schema-Änderung

Das LLM bekommt die neuen Props automatisch über `z.toJSONSchema()`. Die `buildSystemPrompt.ts`-Erweiterung erklärt *wann* und *warum* man `eyebrow` / `heading` / `minHeight` einsetzt — nicht was die erlaubten Werte sind (das kommt aus dem Schema).

---

## 5. Betroffene Dateien

### Neue Dateien
Keine.

### Zu ändernde Dateien

| Datei | Art der Änderung |
|-------|------------------|
| `src/App.css` | `.card` bekommt `background: var(--surface)` + `box-shadow` |
| `src/elements/media/Gallery/Gallery.schema.ts` | `heading?`, `subheading?` Props hinzufügen |
| `src/elements/media/Gallery/Gallery.tsx` | `heading`/`subheading` rendern |
| `src/elements/media/Gallery/Gallery.css` | `.gallery__header`, `.gallery__heading`, `.gallery__subheading` hinzufügen |
| `src/elements/content/TextBlock/TextBlock.schema.ts` | `eyebrow?` Prop hinzufügen |
| `src/elements/content/TextBlock/TextBlock.tsx` | `eyebrow` rendern |
| `src/elements/content/TextBlock/TextBlock.css` | `.text_block__eyebrow` hinzufügen |
| `src/elements/layout/HeroBanner/HeroBanner.schema.ts` | `minHeight?` Prop hinzufügen |
| `src/elements/layout/HeroBanner/HeroBanner.tsx` | `minHeight` als inline style anwenden |
| `src/llm/buildSystemPrompt.ts` | Guidance für eyebrow, Gallery heading, minHeight |

### Nicht geändert (explizit)

| Datei | Warum nicht |
|-------|-------------|
| `src/elements/shared/Card.tsx` | Card-Component bleibt unverändert — Elevation kommt aus `.card`-CSS |
| `src/elements/content/CardRow/CardRow.tsx` | Nutzt `<Card>` — erhält Elevation automatisch |
| `src/elements/content/CardGrid/CardGrid.tsx` | Nutzt `<Card>` — erhält Elevation automatisch |
| `src/elements/layout/HeroBanner/HeroBanner.css` | CSS-seitig kein `min-height` — das kommt als inline style |
| `src/elements/media/Gallery/index.ts` | Re-Export, kein Logic-Change |
| `src/index.css` | Keine neuen Tokens nötig — `box-shadow` nutzt bestehende Vars |
| `src/builder/schemas.ts` | Kein BlockSpec-Change — rein additive Modul-Props |

---

## 6. Implementierungsreihenfolge

```
Plan 01: Card Elevation
  → src/App.css

Plan 02: TextBlock Eyebrow
  → TextBlock.schema.ts + TextBlock.tsx + TextBlock.css

Plan 03: Gallery Heading
  → Gallery.schema.ts + Gallery.tsx + Gallery.css

Plan 04: HeroBanner minHeight
  → HeroBanner.schema.ts + HeroBanner.tsx

Plan 05: LLM Guidance
  → buildSystemPrompt.ts
```

Pläne 01–04 sind unabhängig voneinander (keine geteilten Dateien) — rein logisch aufsteigend sortiert. Plan 05 hängt von allen vorherigen ab (LLM muss alle neuen Props kennen).

---

## 7. Akzeptanzkriterien (vorläufig)

- [ ] `.card` hat `background: var(--surface)` und `box-shadow` — Karten sind auf muted-Hintergrund sichtbar als Objekte
- [ ] `Gallery` rendert optional `heading` als `<h2>` oberhalb des Grids
- [ ] `Gallery` rendert optional `subheading` als `<p>` unterhalb des Headings
- [ ] `TextBlock` rendert optional `eyebrow` als `<span>` oberhalb des `<h2>`
- [ ] `eyebrow` ist visuell klein, uppercase/caps, letter-spaced, in `var(--accent)` oder `var(--primary)` Farbe
- [ ] `HeroBanner` akzeptiert `minHeight` als Zahl; Default ist 480
- [ ] HeroBanner mit `minHeight: 600` ist sichtbar höher als ohne
- [ ] Alle bestehenden Specs (ohne neue Props) laufen weiterhin fehlerfrei
- [ ] LLM setzt `eyebrow` auf TextBlocks die Sektions-Titel sind (z.B. "ÜBER UNS" über "Wir sind ein Café")
- [ ] LLM setzt `heading` auf Gallery-Blöcken

---

## 8. Risiken & Offene Fragen

| Risiko | Mitigation |
|--------|-----------|
| `.card` `box-shadow` könnte auf `primary`/`dark` Tone-Hintergründen falsch wirken | Prüfen: Karten auf `primary`-Hintergrund brauchen vielleicht keinen Schatten. CSS-Selektor `[data-tone="primary"] .card { box-shadow: none }` als Override falls nötig |
| Gallery `refine`-Constraint (images.length % columns === 0) — bleibt durch neue Props unverändert | Kein Risiko — heading/subheading sind unabhängig vom refine |
| HeroBanner `minHeight` als Zahl — LLM könnte unrealistische Werte setzen (z.B. 10000) | `z.number().min(200).max(900)` im Schema als Guard |

---

## 9. Zu löschender Code

**Ergebnis: Keine Löschungen nötig.**

Dieses Feature ist **rein additiv**:
- Gallery: `heading?` und `subheading?` sind neue optionale Props (Nicht-Breaking)
- TextBlock: `eyebrow?` ist neues optionales Prop (Nicht-Breaking)
- HeroBanner: `minHeight?` ist neues optionales Prop (Nicht-Breaking)
- App.css: `.card` bekommt `background` + `box-shadow` hinzu (Nicht-Breaking)

**Hinweis:** Es gibt eine veraltete Test-Suite (`src/elements/components.test.tsx`, Zeilen 80, 85, 91, 98), die `HeroBannerProps` mit `textColor="light"` testet, aber dieses Prop existiert nicht in der aktuellen `HeroBanner.schema.ts`. Dies ist Teil von Sektion 11 (Akzeptanzkriterien Tests).

---

## 10. Direkte Aufrufer & Registrierungen

### Gallery
- **Registriert in:** `src/builder/registry.ts:22` (import + array)
- **Schema-Datei:** `src/elements/media/Gallery/Gallery.schema.ts`
- **Component-Datei:** `src/elements/media/Gallery/Gallery.tsx`
- **Export:** `src/elements/media/Gallery/index.ts`
- **getestet in:**
  - `src/elements/schemas.test.ts:19` (GalleryPropsSchema, GalleryDefaults, GalleryImageSchema)
  - `src/elements/components.test.tsx:25` (Gallery component render tests)
- **Aktueller Status:** Schema hat Props `images`, `columns` (default 2), `gap` (default 'md')
- **Neue Props:** `heading?: string`, `subheading?: string` — müssen in Defaults **nicht** gesetzt werden (optional)

### TextBlock
- **Registriert in:** `src/builder/registry.ts:13` (import + array)
- **Schema-Datei:** `src/elements/content/TextBlock/TextBlock.schema.ts`
- **Component-Datei:** `src/elements/content/TextBlock/TextBlock.tsx`
- **Export:** `src/elements/content/TextBlock/index.ts`
- **Getestet in:**
  - `src/elements/schemas.test.ts:12` (TextBlockPropsSchema, TextBlockDefaults)
  - `src/elements/components.test.tsx:16` (TextBlock component render tests)
- **Aktueller Status:** Schema hat Props `heading?`, `body` (required), `subtext?`, `align` (default 'left')
- **Neue Props:** `eyebrow?: string` — muss in Defaults **nicht** gesetzt werden (optional)

### HeroBanner
- **Registriert in:** `src/builder/registry.ts:7` (import + array)
- **Schema-Datei:** `src/elements/layout/HeroBanner/HeroBanner.schema.ts`
- **Component-Datei:** `src/elements/layout/HeroBanner/HeroBanner.tsx`
- **Export:** `src/elements/layout/HeroBanner/index.ts`
- **Getestet in:**
  - `src/elements/schemas.test.ts:8` (HeroBannerPropsSchema, HeroBannerDefaults)
  - `src/elements/components.test.tsx:10` (HeroBanner component render tests — **hat Fehler**)
- **Aktueller Status:** Schema hat Props `heading` (required), `subheading?`, `ctaLabel?`, `ctaHref?`, `imageQuery?`, `background?`, `backgroundImage?`
- **Neue Props:** `minHeight?: number` (default 480) — muss in Defaults **nicht** gesetzt werden (optional)
- **Test-Fehler:** `src/elements/components.test.tsx:80, 85, 91, 98` verwenden `textColor` Prop, das in Schema nicht existiert

### Card Elevation (App.css nur, keine Module betroffen)
- **Datei:** `src/App.css:29-36` (`.card` Klasse)
- **Betroffene Module, die `.card` nutzen:**
  - `src/elements/content/CardRow/CardRow.tsx` → nutzt shared `<Card>` Component
  - `src/elements/content/CardGrid/CardGrid.tsx` → nutzt shared `<Card>` Component
  - `src/elements/shared/Card.tsx` → shared component (keine Änderung nötig)
- **Tests für CardRow/CardGrid:**
  - `src/elements/schemas.test.ts:459` (CardRowPropsSchema)
  - `src/elements/schemas.test.ts:497` (CardGridPropsSchema)
  - `src/elements/components.test.tsx` (CardRow/CardGrid component tests)
- **Status:** CSS-Change ist **visual-only** — keine Props-Änderung

### LLM-System
- **Datei:** `src/llm/buildSystemPrompt.ts`
- **Aktuelle Funktion:** Assembliert system prompt aus `RegistryLLMSurface.modules` (meta + propsJSONSchema für jedes Modul)
- **Auto-Erfassung:** Neue Props werden **automatisch** in propsJSONSchema durch `z.toJSONSchema()` erfasst
- **Guidace-Erweiterung nötig:** Textuelle Anleitung hinzufügen, **wann** man `eyebrow`, `heading`/`subheading`, `minHeight` einsetzt

---

## 11. Akzeptanzkriterien & Test-Anforderungen

### Akzeptanzkriterien (aus Sektion 7, erweiter um Tests)

- [ ] **Card Elevation:** `.card` in `src/App.css` hat `background: var(--surface)` + `box-shadow`
  - **Test:** CardRow/CardGrid Tests nicht broken (CSS ist visual, keine Regression)

- [ ] **Gallery Heading/Subheading:**
  - [ ] Gallery.schema.ts hat `heading?: z.string()` + `subheading?: z.string()`
  - [ ] Gallery.tsx rendert `<div className="gallery__header">` wenn heading gesetzt
  - [ ] Gallery.tsx rendert `<h2 className="gallery__heading">` für heading
  - [ ] Gallery.tsx rendert `<p className="gallery__subheading">` für subheading
  - [ ] Gallery.css hat `.gallery__header`, `.gallery__heading`, `.gallery__subheading` Styles
  - [ ] GalleryDefaults **nicht** `heading` oder `subheading` setzen (optional, bleiben undefined)
  - [ ] `src/elements/schemas.test.ts` — GalleryPropsSchema testet neue Props als optional
  - [ ] `src/elements/components.test.tsx` — Gallery mit/ohne heading rendert korrekt

- [ ] **TextBlock Eyebrow:**
  - [ ] TextBlock.schema.ts hat `eyebrow?: z.string()`
  - [ ] TextBlock.tsx rendert `<span className="text_block__eyebrow">` wenn eyebrow gesetzt, **vor dem heading**
  - [ ] TextBlock.css hat `.text_block__eyebrow` mit small caps, letter-spacing, accent-color
  - [ ] TextBlockDefaults **nicht** `eyebrow` setzen (optional, bleibt undefined)
  - [ ] `src/elements/schemas.test.ts` — TextBlockPropsSchema testet eyebrow als optional
  - [ ] `src/elements/components.test.tsx` — TextBlock mit/ohne eyebrow rendert korrekt

- [ ] **HeroBanner minHeight:**
  - [ ] HeroBanner.schema.ts hat `minHeight?: z.number().min(200).max(900).default(480)`
  - [ ] HeroBanner.tsx wendet `style={{ minHeight: minHeight }}` auf `<section className="hero_banner">` an
  - [ ] HeroBannerDefaults **nicht** `minHeight` setzen (optional, bleibt undefined, CSS Default 480px greift)
  - [ ] `src/elements/schemas.test.ts` — HeroBannerPropsSchema testet minHeight als optional mit min/max Guards
  - [ ] `src/elements/components.test.tsx` — **FEHLER FIXEN**: Tests verwenden `textColor` Prop, das nicht existiert
    - Entfernen oder fixen Sie alle `textColor="light"` Calls in HeroBanner Tests (Zeilen 80, 85, 91, 98)

- [ ] **Existing specs bleiben gültig:** Alle bestehenden Specs ohne neue Props rendern weiterhin fehlerfrei
  - [ ] `e2e/app.spec.ts` testet keine regressions (wenn es Specs mit Blocks rendert)

- [ ] **LLM guidance:**
  - [ ] `src/llm/buildSystemPrompt.ts` erweiter um prosa Guidance:
    - Wann `eyebrow` auf TextBlock nutzen (Sektions-Überschriften wie "ÜBER UNS")
    - Wann `heading`/`subheading` auf Gallery nutzen (Kontext für Bildergalerien)
    - Wann `minHeight` auf HeroBanner nutzen (um Heros ohne Bild zu liften)
  - [ ] LLM kann neue Props in generated specs setzen (Automat via propsJSONSchema, keine manuellen Updates nötig)

### Wichtige Notizen zu Tests

1. **Defaults setzen keine neuen Props:** `GalleryDefaults`, `TextBlockDefaults`, `HeroBannerDefaults` sollten **nicht** geändert werden, um die neuen Props nicht zu erzwingen. Sie bleiben optional und undefined.

2. **Test-Fehler in HeroBanner:** `src/elements/components.test.tsx` hat einen Bug: es referenziert `textColor` Prop (Zeilen 80, 85, 91, 98), das in `HeroBanner.schema.ts` nicht existiert. **Muss vor Feature-Merge gefixt werden.**

3. **Schema-Tests erweitern:** In `src/elements/schemas.test.ts` sollten neue Tests für optionale Props hinzugefügt werden:
   - `Gallery`: testet `heading` + `subheading` als optional
   - `TextBlock`: testet `eyebrow` als optional
   - `HeroBanner`: testet `minHeight` als optional mit min/max Bounds

4. **Component-Tests erweitern:** In `src/elements/components.test.tsx` sollten neue Tests für das Rendering hinzugefügt werden:
   - `Gallery`: testet dass Heading/Subheading nur rendert wenn gesetzt
   - `TextBlock`: testet dass Eyebrow vor Heading rendert, correct styling
   - `HeroBanner`: testet dass minHeight inline style angewendet wird, richtige Höhen
