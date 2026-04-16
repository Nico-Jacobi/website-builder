# Masterplan: Section Tone System

## 1. Ziel

Jede Seite im Website Builder besteht aus horizontal gestapelten Blöcken. Aktuell sitzen alle Blöcke auf derselben weißen/hellen Fläche — ohne visuellen Rhythmus, ohne Trennung, was die Seite wie eine Collage wirken lässt.

**Ziel:** Jeder Block in der SiteSpec kann optional einen `tone` deklarieren. Der Renderer wickelt jeden Block in eine `SectionShell` — eine dünne Wrapper-Komponente, die basierend auf dem Tone den richtigen Hintergrund und die Textfarbe setzt. Module selbst verwalten keinen Hintergrund mehr (außer HeroBanner, der über inline-styles sein Bild-Background managt).

Das Ergebnis: Seiten mit automatisch wechselnden Farbblöcken — `muted → surface → primary → muted → dark` — die klar voneinander getrennte Sektionen bilden, ohne dass jedes Modul das selbst lösen muss.

---

## 2. Hintergrund & Motivation

**Problem (aktuell):**
- `BlockSpec` hat kein `tone`-Feld
- Header, Footer, FooterSimple hardcoden `background-color: var(--primary)` in ihrem eigenen CSS
- HeroBanner managt seinen Background über inline-styles aus Props
- Alle anderen Module haben keine Hintergrundfarbe — sie "floaten" auf der globalen `--background`-Farbe
- Die `.section`-Klasse existiert in `App.css` (mit Padding-Definitionen), wird aber von keinem Modul verwendet — Dead Code

**Lösung:**
- `tone` als optionales Feld in `BlockSpec` (Spec-Level, nicht Modul-Level)
- `SectionShell` als neuer Layer im Renderer, der Tone → CSS umsetzt
- Alle Module, die aktuell `background-color` hardcoden, verlieren diese Regel — das Tone-System übernimmt
- Das LLM lernt, Tones sinnvoll zu vergeben (alternierend, Hero = dark/primary, Footer = dark)

---

## 3. Nicht-Ziel (Scope-Abgrenzung)

- **Kein Spacing-System in diesem Feature** — SectionShell setzt ausschließlich Hintergrundfarbe und Textfarbe. Vertikales Padding bleibt bei den Modulen selbst.
- **Kein neues visuelles Editor-UI** — Tone ist im Builder-UI noch nicht sichtbar/editierbar (nächstes Feature)
- **Kein per-Block-Border oder Divider** — nur Hintergrundfarbe und Text

---

## 4. Architektur-Entscheidungen

### 4.1 Tone lebt auf BlockSpec-Ebene, nicht auf Modul-Props-Ebene

```
Warum nicht auf Modul-Props?
- Müsste in jedes Schema einzeln eingetragen werden (13 Module)
- Jedes Modul müsste das selbst lesen und anwenden — Boilerplate
- Tone ist ein Layout-Concern, kein Modul-Concern (wie paddingY auf Container)

Warum auf BlockSpec?
- Ein einziger Punkt in schemas.ts
- Renderer-Layer liest es, Module wissen nichts davon
- Gilt uniform für alle Module ohne Änderungen an den Modulen selbst
- LLM kann es für jeden Block vergeben
```

### 4.2 SectionShell ist ein transparenter Wrapper

```
SectionShell:
- Setzt background-color via CSS custom properties / data-tone Attribut
- Setzt color (Textfarbe) damit Kinder-Elemente automatisch die richtige Farbe erben
- Setzt KEIN padding — das bleibt bei den Modulen
- Ist ein <div> mit data-tone="${tone}" — CSS macht den Rest
- Default: kein data-tone → transparent / keine Hintergrundfarbe
```

### 4.3 Tone-Varianten

| Tone | Hintergrund | Textfarbe | Anwendung |
|------|-------------|-----------|-----------|
| `surface` | `--surface` (weiß) | `--text` | Standard, heller Inhalt |
| `muted` | `--background` (off-white/beige) | `--text` | Alternierend zu surface |
| `primary` | `--primary` | `--inverted_text` | Header, Akzentsektionen |
| `dark` | `--secondary` | `--inverted_text` | Footer, dunkle CTA-Sektionen |
| `accent` | `--accent` | `--inverted_text` | Highlight-Sektionen, Callouts |

Kein Tone (undefined) → SectionShell rendert ohne background-style → Modul bestimmt seinen eigenen Background (relevant für HeroBanner mit image).

### 4.4 HeroBanner-Sonderfall

HeroBanner hat sein eigenes `background`/`backgroundImage`-System via inline styles. Das bleibt unangetastet. In Specs bekommt HeroBanner `tone: undefined` — SectionShell setzt keinen Hintergrund, HeroBanner setzt seinen eigenen.

### 4.5 Tone-Tokens vs. Direkte CSS-Vars

Tone-CSS wird **nicht** als neue `--tone_*` Tokens in index.css definiert. Stattdessen mappt SectionShell die existierenden Tokens (`--primary`, `--surface` etc.) direkt in die Styles der Shell. Das vermeidet Alias-Redundanz und hält index.css schlank.

---

## 5. Betroffene Dateien

### Neue Dateien

| Datei | Zweck |
|-------|-------|
| `src/builder/SectionShell.tsx` | Wrapper-Komponente, liest `tone`, setzt background/color |
| `src/builder/SectionShell.css` | CSS für `[data-tone="…"]` Selektoren |

### Geänderte Dateien

| Datei | Was ändert sich |
|-------|----------------|
| `src/builder/schemas.ts` | `BlockSpecSchema` + `BlockSpec` type bekommt `tone?: Tone` |
| `src/builder/types.ts` | `Tone` Union-Type exportieren |
| `src/builder/Renderer.tsx` | Jeder Block in `<SectionShell tone={block.tone}>` gewickelt |
| `src/App.css` | `.section`-Klasse entfernen (Dead Code — kein Modul nutzt sie) |
| `src/elements/layout/Header/Header.css` | `background-color: var(--primary)` entfernen |
| `src/elements/layout/Footer/Footer.css` | `background-color: var(--primary)` entfernen |
| `src/elements/layout/FooterSimple/FooterSimple.css` | `background-color: var(--primary)` entfernen |
| `src/llm/buildSystemPrompt.ts` | Tone-Konzept und Vergabe-Regeln erklären |
| `src/builder/schemas.ts` → `SiteSpecSchema` | Tone-Feld automatisch durch BlockSpec-Update abgedeckt |

### Nicht geändert (explizit)

| Datei | Warum nicht |
|-------|-------------|
| `src/elements/layout/HeroBanner/*` | Hat eigenes Background-System via inline styles, bleibt unverändert |
| Alle Module-Schemas (außer Header/Footer) | Tone ist BlockSpec-Level, nicht Modul-Prop |
| `src/index.css` | Keine neuen Tokens nötig — SectionShell nutzt existierende Vars direkt |
| `src/builder/registry.ts` | Keine Änderung nötig |

---

## 6. Implementierungsreihenfolge

```
Plan 01: Types & Schema Foundation
  → Tone-Type + BlockSpec-Erweiterung + SiteSpec-Schema-Update

Plan 02: SectionShell Komponente
  → SectionShell.tsx + SectionShell.css

Plan 03: Renderer Integration
  → Renderer.tsx wrapped + App.css .section entfernt

Plan 04: Modul-Cleanup
  → Header/Footer/FooterSimple CSS bereinigt

Plan 05: LLM-Guidance
  → buildSystemPrompt.ts mit Tone-Regeln
```

---

## 7. Akzeptanzkriterien (vorläufig, wird nach Impact-Analyse vervollständigt)

- [ ] `BlockSpec` hat `tone?: 'surface' | 'muted' | 'primary' | 'dark' | 'accent'`
- [ ] Renderer wrapped jeden Block in `<SectionShell tone={block.tone}>`
- [ ] `SectionShell` ohne tone → kein background-Attribut, kein inline style
- [ ] `SectionShell tone="primary"` → `background: var(--primary)`, `color: var(--inverted_text)`
- [ ] `SectionShell tone="muted"` → `background: var(--background)`, `color: var(--text)`
- [ ] `SectionShell tone="dark"` → `background: var(--secondary)`, `color: var(--inverted_text)`
- [ ] `SectionShell tone="accent"` → `background: var(--accent)`, `color: var(--inverted_text)`
- [ ] Header, Footer, FooterSimple verlieren hardcoded `background-color` — werden über `tone: "primary"` / `tone: "dark"` im spec gesteuert
- [ ] `.section`-Klasse in `App.css` ist entfernt
- [ ] LLM vergibt Tones im Cafe-Beispiel: Hero=none, Über Uns=muted, MediaText=surface, CardGrid-Section=muted, Gallery=surface, Callout=accent, Footer=dark
- [ ] Bestehendes Renderer-Test-Suite und Schema-Tests laufen weiterhin durch
- [ ] `validateSpecAgainstRegistry` akzeptiert Specs mit und ohne tone-Felder

---

## 8. Risiken & Offene Fragen

| Risiko | Mitigation |
|--------|-----------|
| `z.lazy()` in `BlockSpecSchema` — Tone-Feld zu lazy-wrapped Type hinzufügen | Schema-Test schreiben der Roundtrip prüft |
| Header/Footer verlieren ihre Hintergrundfarbe wenn `tone` in alten Specs fehlt | Default: tone=undefined → kein background → Module fallen auf global --background zurück. Aber Header braucht IMMER einen Hintergrund. Lösung: Header-CSS behält einen fallback `background-color: var(--primary)` als Default, den der Tone überschreiben kann |
| Textfarbe-Vererbung — Module nutzen `color: var(--text)` hardcoded und ignorieren den Shell-Context | Zu prüfen pro Modul. SectionShell setzt `color` auf dem Shell-div — Module die `color` nicht hardcoden erben es korrekt |

---

## 9. Was muss weg (Dateien / Code der gelöscht wird)

### 9.1 CSS-Regeln die entfernt werden

| Datei | Zeile(n) | Zu löschender Code | Begründung |
|-------|----------|--------------------|------------|
| `src/App.css` | Z. 18–26 | Komplette `.section`-Klasse inkl. `@media`-Block | Dead Code — Masterpan-Befund bestätigt: 5 Module nutzen `className="section …"` als Komposition. **Achtung: Die Klasse ist KEIN Dead Code — sie wird aktiv genutzt (siehe 9.2).** |
| `src/elements/layout/Header/Header.css` | Z. 6 | `background-color: var(--primary);` | Wird durch `tone: "primary"` auf BlockSpec-Ebene ersetzt |
| `src/elements/layout/Footer/Footer.css` | Z. 3 | `background-color: var(--primary);` | Wird durch `tone: "dark"` auf BlockSpec-Ebene ersetzt |
| `src/elements/layout/FooterSimple/FooterSimple.css` | Z. 9 | `background-color: var(--primary);` | Wird durch `tone: "dark"` auf BlockSpec-Ebene ersetzt |

### 9.2 Korrektur: `.section` ist KEIN Dead Code

Entgegen der Annahme im Masterplan (Sektion 2 / 5) wird `.section` aktiv von **5 Modulen** als Basis-Klasse verwendet:

| Datei | Zeile | Verwendung |
|-------|-------|------------|
| `src/elements/content/TextBlock/TextBlock.tsx` | Z. 11 | `className="section text_block"` |
| `src/elements/content/CardRow/CardRow.tsx` | Z. 7 | `className="section card_row"` |
| `src/elements/content/CardGrid/CardGrid.tsx` | Z. 7 | `className="section card_grid"` |
| `src/elements/content/StatRow/StatRow.tsx` | Z. 7 | `className="section stat_row"` |
| `src/elements/content/MediaText/MediaText.tsx` | Z. 11 | `className="section media_text"` |
| `src/elements/media/Gallery/Gallery.tsx` | Z. 8 | `className="section gallery"` |

**Konsequenz:** Die `.section`-Klasse in `src/App.css` (Z. 18–26) darf **nicht** gelöscht werden. Der Masterplan-Abschnitt 5 ("Geänderte Dateien") muss korrigiert werden — `App.css` fällt aus der Änderungsliste heraus.

### 9.3 Weitere background-color Funde in src/elements/ — KEINE Aktion nötig

| Datei | Zeile | Wert | Entscheidung |
|-------|-------|------|--------------|
| `src/elements/media/Gallery/Gallery.css` | Z. 34 | `background-color: var(--background)` | Lazy-load-Placeholder für `.gallery__img` — kein Sektions-Hintergrund, bleibt unverändert |
| `src/elements/content/Callout/Callout.css` | Z. 27 | `background-color: var(--callout-tone-color)` | Icon-Badge-Hintergrund per CSS Custom Property — kein Sektions-Hintergrund, bleibt unverändert |
| `src/elements/layout/HeroBanner/HeroBanner.css` | Z. 3 | `background: var(--primary)` | Explizit als Fallback dokumentiert ("overridden by inline style when background prop is set") — HeroBanner-Sonderfall, bleibt unverändert |

---

## 10. Alle Aufrufer (direkt + transitiv + betroffene Tests)

### 10.1 Direkte Importeure von `BlockSpec` / `SiteSpec` aus `src/builder/schemas.ts`

| Datei | Importierte Typen / Symbole | Rolle |
|-------|-----------------------------|-------|
| `src/builder/Renderer.tsx` | `BlockSpec`, `SiteSpec` | Render-Loop — wird geändert (SectionShell-Wrapping) |
| `src/builder/validateSpec.ts` | `BlockSpec`, `SiteSpec`, `SiteSpecSchema` | Validierungs-Pass — liest `block.tone` nicht, **keine Änderung nötig** (z.lazy-Schema gibt neues Feld durch) |
| `src/builder/blockIds.ts` | `BlockSpec`, `SiteSpec` | ID-Zuweisung — `isBlockSpec()` prüft nur `type`+`props`, **keine Änderung nötig** |
| `src/builder/specHelpers.ts` | `BlockSpec`, `SiteSpec` | Baut Specs aus Defaults — `tone` wird nicht gesetzt, bleibt `undefined` — **keine Änderung nötig** |
| `src/builder/EditModeContext.tsx` | `SiteSpec` | Context-Typ — **keine Änderung nötig** |
| `src/builder/schemas.test.ts` | `BlockSpecSchema`, `SiteSpecSchema` | **Betroffener Test** (siehe 10.4) |
| `src/builder/Renderer.test.tsx` | `SiteSpec` | **Betroffener Test** (siehe 10.4) |
| `src/builder/blockIds.test.ts` | `SiteSpec` | Kein direkter Bezug zu `tone` — läuft weiterhin unverändert |
| `src/builder/editMode.test.tsx` | `SiteSpec` | Kein direkter Bezug zu `tone` — läuft weiterhin unverändert |
| `src/builder/validateSpec.test.ts` | indirekt via `validateSpecAgainstRegistry` | Kein direkter Bezug zu `tone` — läuft weiterhin unverändert |
| `src/llm/imageFiller.ts` | `BlockSpec`, `SiteSpec` | Traversiert Props nach Image-Slots — `tone` ist kein Image-Feld, **keine Änderung nötig** |
| `src/llm/types.ts` | `SiteSpec` | Return-Type des LLM-Aufrufs — **keine Änderung nötig** |
| `src/state/specStore.ts` | `SiteSpec` | Persistenz (localStorage) — `isSpecShape()` prüft nur `blocks: Array`, **keine Änderung nötig** |
| `src/test/renderWithProviders.tsx` | `SiteSpec` | Test-Helper — **keine Änderung nötig** |
| `src/elements/layout/Container/Container.schema.ts` | `BlockSpecSchema` | Deklariert `children: z.array(BlockSpecSchema)` — erbt `tone`-Feld automatisch, **keine Änderung nötig** |

### 10.2 LLM-facing API-Surface (`getRegistryLLMSurface`)

`src/builder/registry.ts` — `getRegistryLLMSurface()` (Z. 86–102):

- Rendert `SiteSpecSchema` via `z.toJSONSchema()` als JSON Schema in den System-Prompt.
- Nach dem Tone-Update enthält `BlockSpecSchema` das `tone`-Feld → `z.toJSONSchema()` nimmt es automatisch auf → das LLM-facing JSON Schema zeigt `tone` ohne manuelle Änderung an `registry.ts`.
- **Einzige notwendige Änderung:** `src/llm/buildSystemPrompt.ts` — Tone-Konzept und Vergabe-Regeln erklären (bereits in Masterplan Sektion 5 geplant).

### 10.3 Transitive Abhängigkeitskette

```
schemas.ts (BlockSpec + tone)
  └── Renderer.tsx           → wird geändert (SectionShell)
  └── validateSpec.ts        → kein Change, SiteSpecSchema.safeParse gibt tone durch
  └── blockIds.ts            → kein Change, isBlockSpec() ignoriert tone-Feld
  └── specHelpers.ts         → kein Change, tone bleibt undefined in Defaults
  └── registry.ts            → kein Change, z.toJSONSchema() übernimmt tone auto.
        └── buildSystemPrompt.ts → wird geändert (Tone-Regeln hinzufügen)
        └── registry.test.ts     → Snapshot-Test auf siteSpecJSONSchema — KEIN fix nötig (nur equality-check, neue Felder brechen nicht)
  └── Container.schema.ts    → kein Change, z.array(BlockSpecSchema) erbt tone
  └── imageFiller.ts         → kein Change
  └── specStore.ts           → kein Change
```

### 10.4 Betroffene Tests

#### Tests die nach dem Tone-Update **angepasst werden müssen**

| Datei | Test / Describe | Was sich ändert |
|-------|-----------------|-----------------|
| `src/builder/schemas.test.ts` | `describe('BlockSpecSchema')` | Ein neuer Test muss prüfen: `BlockSpecSchema.safeParse({ type:'X', props:{}, tone:'primary' })` → `success: true`. Und: `tone: 'invalid'` → `success: false`. |
| `src/builder/schemas.test.ts` | `describe('SiteSpecSchema')` | Ein neuer Test muss prüfen: Spec mit `tone` auf einem Block ist valide. |
| `src/builder/Renderer.test.tsx` | `it('renders an empty div.vertical_layout …')` | Nach Einführung von `SectionShell` wrappt der Renderer jeden Block in ein Shell-div. Tests die die DOM-Struktur direkt abfragen (`.vertical_layout` Children-Count) **könnten** brechen → prüfen. |
| `src/builder/Renderer.test.tsx` | `describe('all registered modules render with defaults')` | `SectionShell` mit `tone: undefined` darf **kein** `data-tone`-Attribut setzen und keine `.builder__error` erzeugen → Test bleibt grün wenn SectionShell korrekt implementiert. |
| `src/llm/buildSystemPrompt.test.ts` | `it('embeds the siteSpecJSONSchema …')` | Nach dem Schema-Update enthält `siteSpecJSONSchema` ein `tone`-Feld in BlockSpec. Der Test `expect(prompt).toContain(JSON.stringify(surface.siteSpecJSONSchema, null, 2))` ist ein Snapshot auf die gesamte JSON-Ausgabe — **bricht nicht**, weil er `surface` dynamisch liest. |

#### Tests die **unverändert weiterhin grün** laufen

| Datei | Begründung |
|-------|------------|
| `src/builder/blockIds.test.ts` | `isBlockSpec()` prüft nur `type`+`props` — `tone` wird ignoriert |
| `src/builder/validateSpec.test.ts` | `SiteSpecSchema.safeParse` lässt optionale Felder durch; Registry-Validierung betrifft nur `props` |
| `src/builder/editMode.test.tsx` | Alle Test-Specs nutzen `SiteSpec` ohne `tone` — valide, da `tone` optional ist |
| `src/builder/registry.test.ts` | Defaults-Parse und LLM-Surface-Tests sind daten-getrieben, kein Tone-Hardcode |
| `src/state/specStore.test.ts` | `isSpecShape()` prüft nur `blocks: Array` |
| `src/elements/components.test.tsx` | Keine Assertions auf BlockSpec-Struktur oder Sektions-Hintergrundfarbe |

---

## 11. Finalisierte Akzeptanzkriterien

### 11.1 Funktionale Kriterien (aus Sektion 7, unverändert gültig)

- [ ] `BlockSpec` hat `tone?: 'surface' | 'muted' | 'primary' | 'dark' | 'accent'`
- [ ] `BlockSpecSchema` validiert `tone` als optionalen Enum — ungültige Werte werden abgelehnt
- [ ] Renderer wrappt jeden Block in `<SectionShell tone={block.tone}>`
- [ ] `SectionShell` ohne `tone` (undefined) → kein `data-tone`-Attribut, kein inline style, kein background
- [ ] `SectionShell tone="surface"` → `background: var(--surface)`, `color: var(--text)`
- [ ] `SectionShell tone="muted"` → `background: var(--background)`, `color: var(--text)`
- [ ] `SectionShell tone="primary"` → `background: var(--primary)`, `color: var(--inverted_text)`
- [ ] `SectionShell tone="dark"` → `background: var(--secondary)`, `color: var(--inverted_text)`
- [ ] `SectionShell tone="accent"` → `background: var(--accent)`, `color: var(--inverted_text)`
- [ ] Header (`Header.css` Z. 6), Footer (`Footer.css` Z. 3), FooterSimple (`FooterSimple.css` Z. 9) verlieren `background-color` — werden über `tone: "primary"` / `tone: "dark"` im Spec gesteuert
- [ ] LLM vergibt Tones im Café-Beispiel: Hero=none/undefined, Über-Uns=muted, MediaText=surface, CardGrid-Section=muted, Gallery=surface, Callout=accent, Footer=dark
- [ ] `buildSystemPrompt` enthält Tone-Vergabe-Regeln (alternierend, Header/Footer-Defaults)

### 11.2 Korrigierte Kriterien (aus Impact-Analyse)

- [ ] **`.section`-Klasse in `src/App.css` bleibt erhalten** — sie wird von 6 Modulen aktiv genutzt (TextBlock, CardRow, CardGrid, StatRow, MediaText, Gallery). Die Annahme "Dead Code" aus Sektion 2/5 ist falsch.
- [ ] Header-CSS behält `color: var(--inverted_text)` (Z. 7) — nur `background-color` (Z. 6) wird entfernt
- [ ] Footer-CSS behält `color: var(--inverted_text)` (Z. 4) — nur `background-color` (Z. 3) wird entfernt
- [ ] FooterSimple-CSS behält `color: var(--inverted_text)` (Z. 10) — nur `background-color` (Z. 9) wird entfernt
- [ ] `Gallery.css` `.gallery__img` behält `background-color: var(--background)` (Z. 34) — ist ein Image-Placeholder, kein Sektions-Hintergrund
- [ ] `Callout.css` behält `background-color: var(--callout-tone-color)` (Z. 27) — ist ein Icon-Badge, kein Sektions-Hintergrund
- [ ] `HeroBanner.css` behält `background: var(--primary)` (Z. 3) als Fallback — HeroBanner-Sonderfall (eigenes inline-style-System), bekommt `tone: undefined` in Specs

### 11.3 Schema & Validierungs-Kriterien

- [ ] `BlockSpecSchema` nutzt `z.lazy()` — `tone`-Feld muss **innerhalb** des lazy-Wrappers in `z.object({…})` eingetragen werden (nicht außen), sonst wird es nicht in den rekursiven Typ übernommen
- [ ] `SiteSpecSchema`-Roundtrip: Spec mit `tone`-Feldern übersteht `SiteSpecSchema.safeParse()` → `validateSpecAgainstRegistry()` ohne Fehler
- [ ] `validateSpecAgainstRegistry` akzeptiert Specs **mit** `tone`-Feldern (passthrough durch SiteSpecSchema) und **ohne** `tone`-Felder (optional)
- [ ] `z.toJSONSchema(SiteSpecSchema)` in `getRegistryLLMSurface()` enthält `tone` als optionales Enum-Feld in `BlockSpec` — kein manueller Eingriff in `registry.ts` nötig
- [ ] `isBlockSpec()` in `blockIds.ts` (Z. 39–46), `validateSpec.ts` (Z. 92–99) und `Renderer.tsx` (Z. 108–114) prüft nur `type`+`props` — `tone` muss **nicht** in diese Guards eingetragen werden

### 11.4 Test-Kriterien

- [ ] Neue Tests in `src/builder/schemas.test.ts`: `tone: "primary"` → valide; `tone: "invalid"` → invalide; kein `tone` → valide
- [ ] Neuer Test in `src/builder/Renderer.test.tsx`: Block mit `tone="primary"` rendert in ein Shell-div mit `data-tone="primary"`
- [ ] Neuer Test in `src/builder/Renderer.test.tsx`: Block ohne `tone` rendert in Shell-div **ohne** `data-tone`-Attribut
- [ ] Alle bestehenden Renderer-Tests laufen weiterhin grün (SectionShell mit `tone: undefined` ist transparent)
- [ ] `src/builder/registry.test.ts` `getRegistryLLMSurface`-Tests laufen weiterhin grün (keine Snapshot-Hardcodes auf BlockSpec-Shape)
- [ ] `src/llm/buildSystemPrompt.test.ts` läuft weiterhin grün (dynamischer Snapshot, keine tone-spezifischen Hardcodes)
