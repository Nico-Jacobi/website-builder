# Section Tone System - Plan 01: Types & Schema Foundation

## Übersicht

| Aspekt | Details |
|--------|---------|
| **Ziel** | `Tone`-Union-Type in `types.ts` definieren, `BlockSpec`/`BlockSpecSchema` in `schemas.ts` um `tone?` erweitern |
| **Abhängig von** | — (kein Vorgänger-Plan) |
| **Betroffene Bereiche** | Shared (Builder-Core) |
| **Geschätzte Komplexität** | Niedrig |

### Größen-Check

| Metrik | Wert | Schwellwert |
|--------|------|-------------|
| Implementierungsschritte | 2 | >8 → Sub-Pläne |
| Neue Dateien | 0 | >5 → Sub-Pläne |
| Zu ändernde Dateien | 2 | >10 → Sub-Pläne |

## Schnittstellen

### Inputs
| Von Plan | Was wird erwartet | Konkret |
|----------|-------------------|---------|
| — | Keine Vorbedingung | — |

### Outputs
| Für Plan | Was wird geliefert | Konkret |
|----------|--------------------|---------|
| Plan 02 | `Tone`-Type importierbar | `src/builder/types.ts` exportiert `Tone` |
| Plan 02 | `BlockSpec.tone` optional vorhanden | `src/builder/schemas.ts` — `BlockSpec.tone?: Tone` |
| Plan 03 | `block.tone` aus Renderer-Loop lesbar | `BlockSpec` hat das Feld |
| Plan 05 | Schema-JSON enthält `tone`-Enum automatisch | `z.toJSONSchema(SiteSpecSchema)` gibt `tone` aus |

### Architektur-Entscheidungen
- `Tone` als eigener exportierter Type in `types.ts` (nicht inlined in schemas.ts), damit andere Dateien ihn importieren können ohne schemas.ts vollständig zu importieren
- `tone` muss **innerhalb** des `z.lazy()`-Wrappers in `z.object({…})` stehen — außerhalb würde es nicht in den rekursiven Typ übernommen
- Kein `z.default()` auf `tone` — undefined ist der gewollte Null-Zustand (SectionShell bleibt transparent)

## Voraussetzungen
- [ ] Keine

## Betroffene Dateien

### Neue Dateien
Keine.

### Zu ändernde Dateien
| Datei | Art der Änderung |
|-------|------------------|
| `src/builder/types.ts` | `Tone` Union-Type exportieren |
| `src/builder/schemas.ts` | `tone?: Tone` in `BlockSpecSchema` + `BlockSpec`-Type |

### Zu löschende Dateien/Code
Keine.

## Implementierung

### Schritt 1: `Tone`-Type in `types.ts` definieren

**Datei:** `src/builder/types.ts`

**Änderung:** Am Ende der Datei (nach den bestehenden Interfaces) einfügen:

```typescript
/**
 * Visual tone for a block's SectionShell wrapper.
 * Applied by the Renderer — modules do not read this value directly.
 *
 * surface → white background, dark text
 * muted   → off-white/background-color, dark text  (alternates with surface)
 * primary → --primary background, inverted text
 * dark    → --secondary background, inverted text  (footer, dark CTAs)
 * accent  → --accent background, inverted text     (highlights, callouts)
 */
export type Tone = 'surface' | 'muted' | 'primary' | 'dark' | 'accent';
```

**Erklärung:** Zentraler Type-Export. Alle anderen Dateien (schemas.ts, SectionShell.tsx, buildSystemPrompt.ts) importieren von hier — single source of truth für die Enum-Werte.

---

### Schritt 2: `tone` in `BlockSpecSchema` und `BlockSpec`-Type eintragen

**Datei:** `src/builder/schemas.ts`

**Änderung:**

```typescript
import { z } from 'zod';
import type { Tone } from './types';

/**
 * A single block inside a site spec.
 *
 * `type` must match a ModuleDefinition.meta.name in the registry.
 * `props` is validated against that module's propsSchema at render time
 * (and optionally up-front via validateSpecAgainstRegistry).
 *
 * `id` is optional in authored JSON but filled in by `ensureBlockIds`
 * before rendering, so React keys stay stable across reorder/insert/delete.
 *
 * `tone` is optional. When set, the Renderer wraps this block in a
 * SectionShell that applies the corresponding background and text color.
 * Modules do not receive or read `tone` — it is a layout-layer concern.
 *
 * Recursive: a block's `props` may contain arrays of nested BlockSpecs
 * (e.g. Container.children). The recursion is expressed via `z.lazy`
 * so the type definition is a single source of truth.
 */
export const BlockSpecSchema: z.ZodType<BlockSpec> = z.lazy(() =>
    z.object({
        id:    z.string().optional(),
        type:  z.string(),
        props: z.record(z.string(), z.unknown()),
        tone:  z.enum(['surface', 'muted', 'primary', 'dark', 'accent']).optional(),
    }),
);

export type BlockSpec = {
    id?: string;
    type: string;
    props: Record<string, unknown>;
    tone?: Tone;
};
```

**Erklärung:**
- `tone` steht **innerhalb** von `z.object({…})` im `z.lazy()`-Wrapper. Das ist zwingend — außerhalb würde es nicht in den rekursiven Typ (Container.children) übernommen.
- `z.enum([…]).optional()` → ungültige Tone-Werte (`"invalid"`) werden von Zod abgelehnt; fehlendes Feld ist valide.
- Der Import von `Tone` ist nur `import type` — kein Runtime-Import nötig (der Enum-String-Array in `z.enum()` reicht für Zod).
- `SiteSpecSchema` muss nicht angefasst werden — es enthält `z.array(BlockSpecSchema)`, das tone automatisch einschließt.

---

## Aufrufer umstellen

Keine Aufrufer müssen nach diesem Plan umgestellt werden. Alle Importeure von `BlockSpec` erhalten das neue optionale Feld transparent — bestehender Code der `tone` nicht kennt, läuft unverändert weiter.

---

## Validierung

### Automatisierte Tests

Neue Tests in `src/builder/schemas.test.ts` schreiben:

```typescript
describe('BlockSpec tone', () => {
    it('accepts a valid tone', () => {
        const result = BlockSpecSchema.safeParse({ type: 'X', props: {}, tone: 'primary' });
        expect(result.success).toBe(true);
    });

    it('rejects an invalid tone', () => {
        const result = BlockSpecSchema.safeParse({ type: 'X', props: {}, tone: 'neon' });
        expect(result.success).toBe(false);
    });

    it('accepts a block without tone', () => {
        const result = BlockSpecSchema.safeParse({ type: 'X', props: {} });
        expect(result.success).toBe(true);
    });

    it('tone is preserved on nested BlockSpec in Container children', () => {
        const result = BlockSpecSchema.safeParse({
            type: 'Container',
            props: { children: [{ type: 'TextBlock', props: {}, tone: 'muted' }] },
            tone: 'primary',
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.tone).toBe('primary');
        }
    });
});
```

```bash
npx vitest run src/builder/schemas.test.ts
```

### Erwartetes Verhalten
- Alle bestehenden Schema-Tests laufen weiterhin grün
- Neue Tone-Tests sind grün
- `z.toJSONSchema(SiteSpecSchema)` gibt ein JSON Schema aus das `tone` als optionalen Enum in BlockSpec enthält (kann manuell in der Konsole geprüft werden)

## Rollback-Plan

1. In `schemas.ts`: `tone`-Zeile aus `z.object({…})` entfernen, `tone?` aus dem `BlockSpec`-Type entfernen
2. In `types.ts`: `Tone`-Export entfernen
3. Import von `Tone` in `schemas.ts` entfernen

---

*Status: Ausstehend*
*Erstellt am: 2026-04-16*
