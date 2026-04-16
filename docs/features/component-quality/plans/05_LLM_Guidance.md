# Component Quality - Plan 05: LLM Guidance

## Übersicht

| Aspekt | Details |
|--------|---------|
| **Ziel** | `buildSystemPrompt.ts` um Guidance für die neuen Props (eyebrow, Gallery heading, minHeight) erweitern, damit das LLM sie sinnvoll nutzt |
| **Abhängig von** | Plan 02 (eyebrow auf TextBlock), Plan 03 (heading auf Gallery), Plan 04 (minHeight auf HeroBanner) |
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
- Plan 02 (TextBlock.eyebrow)
- Plan 03 (Gallery.heading + Gallery.subheading)
- Plan 04 (HeroBanner.minHeight)

### Outputs
Vollständiges System: LLM kennt alle neuen Props und nutzt sie situativ.

## Voraussetzungen
- [ ] Plan 01 abgeschlossen (Card Elevation)
- [ ] Plan 02 abgeschlossen (TextBlock Eyebrow)
- [ ] Plan 03 abgeschlossen (Gallery Heading)
- [ ] Plan 04 abgeschlossen (HeroBanner minHeight)

## Betroffene Dateien

### Zu ändernde Dateien
| Datei | Art der Änderung |
|-------|------------------|
| `src/llm/buildSystemPrompt.ts` | Neuer Abschnitt "## Component Enhancements" mit Regeln für die neuen Props |

## Implementierung

### Schritt 1: Guidance-Abschnitt in buildSystemPrompt.ts einfügen

**Datei:** `src/llm/buildSystemPrompt.ts`

**Änderung:** Einen neuen Abschnitt nach dem "## Theme"-Abschnitt, vor "## Available modules" einfügen:

```typescript
return [
    // ... bestehender Anfang (Role + Rules + Theme) ...
    '## Theme',
    '',
    'Optionally set `spec.theme` to override CSS variables. Recognised keys:',
    '`primary`, `secondary`, `accent`, `alt_primary`, `alt_secondary`,',
    '`background`, `surface`, `text`, `muted_text`, `inverted_text`.',
    'Values must be valid CSS colours (`#hex`, `rgb(…)`, `hsl(…)`).',
    'Pick a palette that matches the user\'s brief — warm, cool, minimal, etc.',
    '',
    '## Component Enhancements',
    '',
    'Several modules have optional fields that elevate page design:',
    '',
    '### TextBlock: eyebrow label',
    'TextBlock supports an optional `eyebrow` field — a short, uppercase label above the heading.',
    'Use this for section markers (e.g. "ABOUT US", "OUR PROCESS", "UNTERNEHMEN").',
    'Example:',
    '```json',
    '{',
    '  "type": "TextBlock",',
    '  "props": {',
    '    "eyebrow": "ABOUT US",',
    '    "heading": "Who We Are",',
    '    "body": "…"',
    '  }',
    '}',
    '```',
    '',
    '### Gallery: heading and subheading',
    'Gallery supports optional `heading` and `subheading` fields above the image grid.',
    'Use to contextualize a photo collection (e.g. "Our Work", "Client Portfolios").',
    'Example:',
    '```json',
    '{',
    '  "type": "Gallery",',
    '  "props": {',
    '    "heading": "Our Studio at Work",',
    '    "subheading": "Recent projects and moments",',
    '    "images": […],',
    '    "columns": 3',
    '  }',
    '}',
    '```',
    '',
    '### HeroBanner: minHeight',
    'HeroBanner has an optional `minHeight` field (pixels, 200–900, default 480).',
    'Use when no `backgroundImage` is set to ensure the hero doesn\'t look too short.',
    'Typical values: 400 (compact), 480 (standard), 600+ (tall dramatic).',
    'Example:',
    '```json',
    '{',
    '  "type": "HeroBanner",',
    '  "props": {',
    '    "heading": "Welcome",',
    '    "minHeight": 550',
    '  }',
    '}',
    '```',
    '',
    '**Rules:**',
    '1. Use eyebrow on TextBlock sections to create hierarchy and guide the reader.',
    '2. Use Gallery heading when photos alone aren\'t self-explanatory.',
    '3. Increase minHeight on HeroBanner when it would otherwise feel cramped (no image, short text).',
    '4. Don\'t over-use eyebrow — use sparingly for truly important section boundaries.',
    '',
    '## Available modules',
    '',
    modulesSection,
].join('\n');
```

**Erklärung:**
- Der neue Abschnitt "Component Enhancements" erklärt *wann* und *warum*, nicht nur *was*
- Konkrete JSON-Beispiele helfen dem LLM die Syntax zu verstehen
- "Rules" am Ende fassen zusammen wann man welches Feld nutzt
- Platzierung nach Theme, vor modules — macht Sinn logisch (Customizations, dann Details pro Modul)

---

## Aufrufer umstellen

Keine — `buildSystemPrompt` wird vom LLM-Call-Layer genutzt, Interface ändert sich nicht.

---

## Validierung

### Manuelle Tests
- [ ] Neuen Spec generieren (z.B. "Erstelle eine Website für ein Café") 
- [ ] Genesierte Spec hat TextBlock-Blöcke mit `eyebrow` für Sektions-Titel
- [ ] Gallery-Blöcke haben `heading`
- [ ] HeroBanner ohne Bild hat `minHeight: 500+` 
- [ ] Kein Over-Use von eyebrow (max 2–3 pro Seite)

### Erwartetes Verhalten
Generierte Specs sehen jetzt professioneller aus — mit Sektions-Marken (eyebrow), kontextualizierten Galerien, proportional besseren Heros.

## Rollback-Plan

1. Den neuen "## Component Enhancements"-Abschnitt aus dem Return-Array entfernen

---

*Status: Ausstehend*
*Erstellt am: 2026-04-16*
