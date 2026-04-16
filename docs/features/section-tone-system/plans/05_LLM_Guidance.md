# Section Tone System - Plan 05: LLM-Guidance

## Übersicht

| Aspekt | Details |
|--------|---------|
| **Ziel** | `buildSystemPrompt.ts` mit Tone-Vergabe-Regeln erweitern, damit das LLM automatisch sinnvolle, abwechslungsreiche Tones vergibt |
| **Abhängig von** | Plan 01 (tone in Schema → taucht automatisch in JSON Schema auf), Plan 04 (Module sind background-neutral) |
| **Betroffene Bereiche** | LLM-Integration |
| **Geschätzte Komplexität** | Niedrig |

### Größen-Check

| Metrik | Wert | Schwellwert |
|--------|------|-------------|
| Implementierungsschritte | 1 | >8 → Sub-Pläne |
| Neue Dateien | 0 | >5 → Sub-Pläne |
| Zu ändernde Dateien | 1 | >10 → Sub-Pläne |

## Schnittstellen

### Inputs
| Von Plan | Was wird erwartet | Konkret |
|----------|-------------------|---------|
| Plan 01 | `tone`-Feld in `BlockSpecSchema` | `z.toJSONSchema(SiteSpecSchema)` enthält `tone` automatisch |
| Plan 04 | Header/Footer sind background-neutral | LLM muss `tone` vergeben damit sie Farbe haben |

### Outputs
| Für Plan | Was wird geliefert | Konkret |
|----------|--------------------|---------|
| — | Vollständiges System: LLM generiert Specs mit Tones, Renderer rendert sie korrekt | — |

### Architektur-Entscheidungen
- Die Tone-Regeln leben als prosa Guideline im System-Prompt (nicht als JSON-Schema-Constraint) — das LLM soll verstehen *warum* und *wann*, nicht nur *was erlaubt ist*
- Die JSON-Schema-Seite ist bereits vollständig durch Plan 01 abgedeckt (`z.toJSONSchema` gibt tone aus) — `buildSystemPrompt.ts` muss nur die Prose-Regeln ergänzen

## Voraussetzungen
- [ ] Plan 01 abgeschlossen (tone im Schema)
- [ ] Plan 02 abgeschlossen (SectionShell Komponente)
- [ ] Plan 03 abgeschlossen (Renderer Integration)
- [ ] Plan 04 abgeschlossen (Module sind background-neutral)

## Betroffene Dateien

### Neue Dateien
Keine.

### Zu ändernde Dateien
| Datei | Art der Änderung |
|-------|------------------|
| `src/llm/buildSystemPrompt.ts` | Neuer `## Section Tones`-Abschnitt im System-Prompt |

### Zu löschende Dateien/Code
Keine.

## Implementierung

### Schritt 1: Tone-Guidance in `buildSystemPrompt.ts` einfügen

**Datei:** `src/llm/buildSystemPrompt.ts`

**Änderung:** Einen neuen Abschnitt `## Section Tones` in den Return-Array des `buildSystemPrompt`-Strings einfügen — nach dem `## Theme`-Abschnitt, vor `## Available modules`:

```typescript
return [
    // ... bestehender Anfang ...
    '## Theme',
    '',
    // ... bestehende Theme-Regeln ...
    '',
    '## Section Tones',
    '',
    'Each block can optionally declare a `tone` field. The Renderer wraps the block',
    'in a colored shell based on this value. Use tones to create visual rhythm across',
    'the page — alternating backgrounds separate sections clearly.',
    '',
    '| Tone | Background | Text | When to use |',
    '|------|------------|------|-------------|',
    '| `surface` | white (--surface) | dark | Default content blocks on a white ground |',
    '| `muted` | off-white (--background) | dark | Alternating filler sections, secondary content |',
    '| `primary` | brand color (--primary) | light | **Always use for `Header`.** Hero variants, brand CTAs |',
    '| `dark` | dark (--secondary) | light | **Always use for `Footer` and `FooterSimple`.** Dark CTAs |',
    '| `accent` | accent color (--accent) | light | Callouts, highlights, single attention-grabbing section |',
    '',
    '**Rules for assigning tones:**',
    '1. `Header` must always have `tone: "primary"`. `Footer` and `FooterSimple` must always have `tone: "dark"`.',
    '2. `HeroBanner` must NOT get a tone — it manages its own background via the `background`/`backgroundImage` props.',
    '3. `Container` blocks get a tone if they represent a distinct section on the page.',
    '4. Alternate between `surface` and `muted` for regular content sections — never use the same tone twice in a row for adjacent content blocks.',
    '5. Use `accent` at most once per page — it draws the eye and loses impact if overused.',
    '6. Content blocks inside a `Container` (its `children` array) do NOT get a `tone` — only the Container block itself does.',
    '',
    '**Example tone sequence for a typical landing page:**',
    '```',
    'Header       → tone: "primary"',
    'HeroBanner   → (no tone)',
    'TextBlock    → tone: "muted"',
    'MediaText    → tone: "surface"',
    'CardGrid     → tone: "muted"',
    'Gallery      → tone: "surface"',
    'Callout      → tone: "accent"',
    'TextBlock    → tone: "muted"',
    'FooterSimple → tone: "dark"',
    '```',
    '',
    // ... bestehender ## Available modules Abschnitt ...
].join('\n');
```

**Erklärung:**
- Regel 1 (Header/Footer) ist kritisch: Nach Plan 04 haben Header/Footer keine CSS-Hintergrundfarbe mehr. Das LLM MUSS diese Tones vergeben.
- Regel 2 (kein Tone auf HeroBanner) verhindert, dass SectionShell und HeroBanners eigenes Background-System kollidieren.
- Regel 3 stellt klar dass Container (nicht seine Kinder) den Tone bekommt.
- Regel 4 (alternierend) ist das Kernprinzip gegen das "Collage"-Problem.
- Regel 6 verhindert doppeltes Tone-Assignment bei Container-Children.
- Das Beispiel gibt dem LLM ein konkretes Pattern das es direkt übernehmen kann.

---

## Aufrufer umstellen

Keine — `buildSystemPrompt` wird nur von `generateSpec.ts` aufgerufen, und dessen Interface ändert sich nicht.

---

## Validierung

### Manuelle Tests
- [ ] Neuen Spec generieren (z.B. "Erstelle eine Website für ein Café") → LLM vergibt Tones
- [ ] Header-Block in der generierten Spec hat `"tone": "primary"`
- [ ] Footer/FooterSimple hat `"tone": "dark"`
- [ ] HeroBanner hat kein `tone`-Feld
- [ ] Keine zwei aufeinanderfolgenden Content-Blöcke haben denselben Tone
- [ ] Maximal ein Block hat `"tone": "accent"`

### Automatisierte Tests
```bash
npx vitest run src/llm/buildSystemPrompt.test.ts
```

Der bestehende Test (`it('embeds the siteSpecJSONSchema …')`) liest `surface` dynamisch und ist nicht auf die Abwesenheit des neuen Abschnitts angewiesen → läuft weiterhin grün.

### Erwartetes Verhalten
Nach Abschluss aller 5 Pläne:
- Eine neu generierte Café-Spec sieht visuell so aus wie eine professionelle Website: farbig getrennte Sektionen mit Rhythmus statt Collage
- Header ist primärfarbig, Footer dunkel, Inhalt alterniert zwischen surface/muted, ein Callout hebt sich mit accent ab

## Rollback-Plan

1. Den `## Section Tones`-Abschnitt aus dem Return-Array in `buildSystemPrompt.ts` entfernen

---

*Status: Ausstehend*
*Erstellt am: 2026-04-16*
