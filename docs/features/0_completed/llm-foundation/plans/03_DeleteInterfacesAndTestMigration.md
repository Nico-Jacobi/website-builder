# LLM Foundation — Plan 03: Delete Interfaces + Test Migration

## Übersicht

| Aspekt | Details |
|--------|---------|
| **Ziel** | Die hand-written Interfaces `BlockSpec` und `SiteSpec` aus `src/builder/types.ts` löschen. Gleichzeitig alle Test- und Test-Util-Dateien auf `./schemas`-Imports umstellen, damit der Build grün bleibt. |
| **Abhängig von** | Plan 02 (Produktionscode darf kein `BlockSpec`/`SiteSpec` mehr aus `./types` ziehen, sonst bricht der Build beim Löschen) |
| **Betroffene Bereiche** | Shared Types + Test-Layer |
| **Geschätzte Komplexität** | Niedrig (rein mechanisch) |

### Größen-Check

| Metrik | Wert | Schwellwert | OK? |
|--------|------|-------------|-----|
| Implementierungsschritte | 3 | >8 | ✓ |
| Neue Dateien | 0 | >5 | ✓ |
| Zu ändernde Dateien | 6 | >10 | ✓ |

## Schnittstellen (Kohärenz-Vertrag)

### Inputs

| Von Plan | Was wird erwartet | Konkret |
|----------|-------------------|---------|
| Plan 01 | `BlockSpec`, `SiteSpec` aus `src/builder/schemas.ts` exportiert | siehe Plan 01 Outputs |
| Plan 02 | Produktionscode nutzt bereits `./schemas` — keine Prod-Referenzen mehr auf `BlockSpec`/`SiteSpec` in `./types` | Verifizierbar per grep |

### Outputs

| Für Plan | Was wird geliefert |
|----------|---------------------|
| Plan 04 | `types.ts` enthält nur noch `ModuleMeta` und `ModuleDefinition`. Die Spec-Seite ist vollständig auf Zod umgestellt. |

### Architektur-Entscheidungen

- `types.ts` bleibt bestehen — nur die zwei Spec-Interfaces (+ deren JSDoc-Blöcke) werden entfernt. `ModuleMeta` und `ModuleDefinition` verbleiben, weil sie Modul-Infrastruktur sind, nicht Spec-Daten.

## Voraussetzungen

- [ ] Plan 02 abgeschlossen (alle Prod-Aufrufer auf `./schemas` umgestellt).
- [ ] Build grün, Tests grün.
- [ ] Grep-Check vor Start: `grep -rn "from './types'" src/` zeigt **keine** Referenz auf `BlockSpec` oder `SiteSpec` mehr im Produktionscode.

## Betroffene Dateien

### Neue Dateien

Keine.

### Zu ändernde Dateien

| Datei | Art der Änderung |
|-------|------------------|
| `src/builder/types.ts` | Interfaces `BlockSpec` (Zeilen 33–45) und `SiteSpec` (Zeilen 47–57) + zugehörige JSDocs löschen. `ModuleMeta`, `ModuleDefinition` bleiben. |
| `src/test/renderWithProviders.tsx` | Import-Pfad: `../builder/types` → `../builder/schemas` |
| `src/builder/blockIds.test.ts` | Import-Pfad: `./types` → `./schemas` |
| `src/builder/editMode.test.tsx` | Import-Pfad: `./types` → `./schemas` |
| `src/builder/Renderer.test.tsx` | Import-Pfad: `./types` → `./schemas` |
| `src/elements/components.test.tsx` | Import-Pfad: `../builder/types` → `../builder/schemas` |

### Zu löschende Dateien/Code

| Datei | Was wird gelöscht | Grund |
|-------|-------------------|-------|
| `src/builder/types.ts` | Interface `BlockSpec` inkl. JSDoc | Ersetzt durch `z.infer<…>`-Typ in `src/builder/schemas.ts` |
| `src/builder/types.ts` | Interface `SiteSpec` inkl. JSDoc | Ersetzt durch `z.infer<…>`-Typ in `src/builder/schemas.ts` |

## Implementierung

### Schritt 1: Test- und Test-Util-Imports umstellen

Fünf Dateien, jeweils genau eine `import`-Zeile anpassen. Keine Logik-Änderungen.

| Datei | Zeile | Vorher | Nachher |
|-------|-------|--------|---------|
| `src/test/renderWithProviders.tsx` | 4 | `import type { SiteSpec } from '../builder/types';` | `import type { SiteSpec } from '../builder/schemas';` |
| `src/builder/blockIds.test.ts` | 3 | `import type { SiteSpec } from './types';` | `import type { SiteSpec } from './schemas';` |
| `src/builder/editMode.test.tsx` | 15 | `import type { SiteSpec } from './types';` | `import type { SiteSpec } from './schemas';` |
| `src/builder/Renderer.test.tsx` | 7 | `import type { SiteSpec, BlockSpec } from './types';` | `import type { SiteSpec, BlockSpec } from './schemas';` |
| `src/elements/components.test.tsx` | 4 | `import type { SiteSpec } from '../builder/types';` | `import type { SiteSpec } from '../builder/schemas';` |

**Vor dem Löschen in Schritt 2** nochmal verifizieren, dass hiernach `grep -rn "SiteSpec\|BlockSpec" src/builder/types.ts src/**` in den fünf Testdateien **keine** Referenz auf `./types` mehr zeigt.

### Schritt 2: Interfaces aus `src/builder/types.ts` löschen

**Datei:** `src/builder/types.ts`

**Vorher (Zeilen 33–57):**

```ts
/**
 * A single block inside a site spec.
 * `type` must match a ModuleDefinition.meta.name in the registry.
 * `props` is validated against that module's propsSchema at render time.
 *
 * `id` is optional in authored JSON but filled in by `ensureBlockIds` before
 * rendering, so React keys stay stable across reorder/insert/delete.
 */
export interface BlockSpec {
    id?: string;
    type: string;
    props: Record<string, unknown>;
}

/**
 * The full description of a website.
 * This is the object a user, editor, or (later) LLM produces and mutates.
 * No code — just data.
 */
export interface SiteSpec {
    /** Optional theme token overrides applied to :root at render time. */
    theme?: Record<string, string>;
    /** Vertical stack of blocks. Order = render order. */
    blocks: BlockSpec[];
}
```

**Nachher:**

Die kompletten Zeilen 33–57 inkl. vorangehender Leerzeile löschen. `ModuleMeta` (Zeilen 8–17) und `ModuleDefinition` (Zeilen 23–31) bleiben wortgleich stehen.

**Erklärung:**

- Die TypeScript-Compiler-Prüfung ist der Verifikations-Mechanismus: wenn irgendwo im Repo noch `SiteSpec` oder `BlockSpec` aus `./types` importiert wird, schlägt `npm run build` fehl und zeigt den Treffer direkt. Plan 02 + Schritt 1 dieses Plans haben alle bekannten Fundstellen bereits umgestellt.

### Schritt 3: Validierung

```bash
grep -rn "SiteSpec\|BlockSpec" src/builder/types.ts
# erwartet: keine Treffer

grep -rn "from '.*builder/types'" src/
# erwartet: weiterhin Treffer für ModuleMeta / ModuleDefinition,
#          aber keiner bei Importen von SiteSpec / BlockSpec

npm run lint
npm run test
npm run build
```

Alles grün.

---

## Aufrufer umstellen

Siehe Schritt 1 oben (Test-Files). Nach Schritt 2 gibt es keine weiteren Aufrufer mehr zu stellen — das ist genau der Verifikations-Punkt.

---

## Validierung

### Manuelle Tests

- [ ] `npm run dev` startet, App rendert die bisherige Demo-Seite unverändert.
- [ ] Edit-Mode-Toolbar und inline-Editing funktionieren weiter.

### Automatisierte Tests

```bash
npm run lint
npm run test         # alle bestehenden + die neuen aus Plan 01
npm run test:e2e     # Playwright — Sanity-Check, dass nichts Rendering-seitig bricht
npm run build
```

### Erwartetes Verhalten

- `src/builder/types.ts` enthält nur noch `ModuleMeta` und `ModuleDefinition`.
- Keine Datei im Projekt importiert mehr `SiteSpec` oder `BlockSpec` aus `./types` / `../builder/types`.
- Alle Tests grün, App-Verhalten visuell identisch.

## Rollback-Plan

Falls dieser Schritt fehlschlägt:

1. Interfaces in `types.ts` wiederherstellen (git diff rückgängig).
2. Test-Imports wieder auf `./types` umstellen.
3. Plan 02 bleibt gültig (Prod-Code nutzt weiter `./schemas`).
4. Ursache untersuchen — typischerweise ein übersehener Import, den Plan 02 oder die Impact-Analyse nicht erfasst hat.

---

*Status: Ausstehend*
*Erstellt am: 2026-04-14*
