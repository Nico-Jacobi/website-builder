# Section Tone System - Plan 03: Renderer Integration

## Übersicht

| Aspekt | Details |
|--------|---------|
| **Ziel** | Renderer wrappt jeden Block in `<SectionShell tone={block.tone}>`. Tone wird aus `BlockSpec` gelesen, Module wissen davon nichts. |
| **Abhängig von** | Plan 01 (BlockSpec.tone), Plan 02 (SectionShell-Komponente) |
| **Betroffene Bereiche** | Shared (Builder-Core) |
| **Geschätzte Komplexität** | Niedrig |

### Größen-Check

| Metrik | Wert | Schwellwert |
|--------|------|-------------|
| Implementierungsschritte | 2 | >8 → Sub-Pläne |
| Neue Dateien | 0 | >5 → Sub-Pläne |
| Zu ändernde Dateien | 1 | >10 → Sub-Pläne |

## Schnittstellen

### Inputs
| Von Plan | Was wird erwartet | Konkret |
|----------|-------------------|---------|
| Plan 01 | `BlockSpec.tone?: Tone` vorhanden | `src/builder/schemas.ts` |
| Plan 02 | `SectionShell`-Komponente exportiert | `src/builder/SectionShell.tsx` |

### Outputs
| Für Plan | Was wird geliefert | Konkret |
|----------|--------------------|---------|
| Plan 04 | Renderer ist fertig — Module-CSS-Cleanup kann unabhängig erfolgen | — |
| Plan 05 | Renderer ist fertig — LLM-Guidance baut auf vollständigem System auf | — |

### Architektur-Entscheidungen
- `SectionShell` wrappt den **gesamten** Block-Output — nicht nur den Inhalt. D.h. HeroBanner sitzt ebenfalls in einer SectionShell, aber mit `tone: undefined` → Shell ist transparent, HeroBanner setzt seinen Background selbst.
- Nested Blocks (Container.children) werden NICHT nochmal von SectionShell gewrappt — sie werden durch `materializeBlockProps` → `renderBlock` gerendert, das nur beim Top-Level-Block `SectionShell` setzt. Container.children sind Props, keine Top-Level-Blocks.
- `BlockIndexContext.Provider` bleibt um `SectionShell` herum, nicht innerhalb — die Render-Hierarchie ändert sich nicht.

## Voraussetzungen
- [ ] Plan 01 abgeschlossen (BlockSpec.tone existiert)
- [ ] Plan 02 abgeschlossen (SectionShell.tsx + SectionShell.css existieren)

## Betroffene Dateien

### Neue Dateien
Keine.

### Zu ändernde Dateien
| Datei | Art der Änderung |
|-------|------------------|
| `src/builder/Renderer.tsx` | Import SectionShell, Block in SectionShell wrappen, `block.tone` übergeben |

### Zu löschende Dateien/Code
Keine.

## Implementierung

### Schritt 1: SectionShell importieren

**Datei:** `src/builder/Renderer.tsx`

**Änderung:** Import-Zeile hinzufügen (nach den bestehenden Imports):

```typescript
import { SectionShell } from './SectionShell';
```

---

### Schritt 2: Block-Rendering in SectionShell wrappen

**Datei:** `src/builder/Renderer.tsx`

**Betroffene Funktion:** `Renderer` (Default Export) — der `spec.blocks.map(…)`-Block.

**Aktuell:**
```typescript
{spec.blocks.map((block, i) => (
    <BlockIndexContext.Provider key={block.id ?? `idx_${i}`} value={i}>
        {renderBlock(block, `blocks[${i}]`)}
    </BlockIndexContext.Provider>
))}
```

**Neu:**
```typescript
{spec.blocks.map((block, i) => (
    <BlockIndexContext.Provider key={block.id ?? `idx_${i}`} value={i}>
        <SectionShell tone={block.tone}>
            {renderBlock(block, `blocks[${i}]`)}
        </SectionShell>
    </BlockIndexContext.Provider>
))}
```

**Erklärung:**
- `block.tone` ist optional — wenn undefined, rendert SectionShell ohne `data-tone`-Attribut → vollständig transparent.
- `BlockIndexContext.Provider` bleibt außen — der Index-Context betrifft das gesamte Block-Rendering inklusive Shell.
- `renderBlock` ändert sich nicht — es weiß weiterhin nichts von `tone`.
- Container.children werden von `materializeBlockProps` → `renderBlock` gerendert. `renderBlock` wird für Child-Blocks **direkt** aufgerufen (nicht über den Top-Level-Map-Loop), also bekommen sie **keine** SectionShell. Das ist korrekt: Tone gilt für Top-Level-Blocks, nicht für verschachtelte Kinder.

---

## Aufrufer umstellen

Keine — `Renderer` selbst wird nicht von anderen Dateien abhängig.

---

## Validierung

### Automatisierte Tests

Neue Tests in `src/builder/Renderer.test.tsx`:

```typescript
it('wraps a block with tone="primary" in a shell with data-tone="primary"', () => {
    const spec: SiteSpec = {
        blocks: [{ type: 'TextBlock', props: { body: 'Test' }, tone: 'primary' }],
    };
    render(<Renderer spec={spec} />);
    const shell = document.querySelector('[data-tone="primary"]');
    expect(shell).not.toBeNull();
});

it('does not add data-tone when tone is absent', () => {
    const spec: SiteSpec = {
        blocks: [{ type: 'TextBlock', props: { body: 'Test' } }],
    };
    render(<Renderer spec={spec} />);
    const shell = document.querySelector('[data-tone]');
    expect(shell).toBeNull();
});
```

```bash
npx vitest run src/builder/Renderer.test.tsx
```

### Manuelle Tests
- [ ] Dev-Server starten, Café-Spec laden — Blöcke mit `tone` zeigen korrekte Hintergrundfarben
- [ ] Block ohne `tone` → kein visueller Unterschied
- [ ] Container mit `tone: "muted"` → Container-Hintergrund ist muted; Children-Blöcke KEINE eigene SectionShell
- [ ] Kein `.builder__error` in der gerenderten Seite

### Erwartetes Verhalten
- DOM-Struktur: `.vertical_layout > div[data-tone="…"] > <ModulOutput>`
- Bei `tone: undefined`: `.vertical_layout > div > <ModulOutput>` (kein data-tone Attribut)

## Rollback-Plan

1. In `Renderer.tsx`: `SectionShell`-Import entfernen
2. Den `<SectionShell>`-Wrapper aus dem Map-Block entfernen (Original wiederherstellen)

---

*Status: Ausstehend*
*Erstellt am: 2026-04-16*
