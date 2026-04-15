# LLM Foundation — Plan 02: Prod Code Import Migration

## Übersicht

| Aspekt | Details |
|--------|---------|
| **Ziel** | Produktionscode stellt alle `BlockSpec`/`SiteSpec`-Imports auf das neue `src/builder/schemas.ts` um. Container eliminiert seine lokale `BlockSpecSchema`-Duplikation. Die Interfaces in `types.ts` bleiben in diesem Plan **noch stehen** (werden in Plan 03 gelöscht), damit Test-Code weiter kompiliert. |
| **Abhängig von** | Plan 01 (schemas.ts muss existieren) |
| **Betroffene Bereiche** | Frontend / Shared (nur `src/builder/` und ein Modul-Schema) |
| **Geschätzte Komplexität** | Niedrig (rein mechanisch) |

### Größen-Check

| Metrik | Wert | Schwellwert | OK? |
|--------|------|-------------|-----|
| Implementierungsschritte | 2 | >8 | ✓ |
| Neue Dateien | 0 | >5 | ✓ |
| Zu ändernde Dateien | 6 | >10 | ✓ |

## Schnittstellen (Kohärenz-Vertrag)

### Inputs

| Von Plan | Was wird erwartet | Konkret |
|----------|-------------------|---------|
| Plan 01 | `BlockSpec`, `SiteSpec` als TS-Typen + `BlockSpecSchema` als Zod-Schema exportiert aus `src/builder/schemas.ts` | Siehe Plan 01 Outputs |

### Outputs

| Für Plan | Was wird geliefert |
|----------|---------------------|
| Plan 03 | Alle Produktions-Aufrufer nutzen bereits `./schemas`. Plan 03 muss nur noch Interfaces in `types.ts` löschen + Test-Imports umstellen. |

### Architektur-Entscheidungen

- Keine — dieser Plan führt die Architektur aus Plan 01 aus.

## Voraussetzungen

- [ ] Plan 01 abgeschlossen (`schemas.ts` existiert und exportiert `BlockSpec`, `SiteSpec`, `BlockSpecSchema`).
- [ ] Alle Bestands-Tests grün.

## Betroffene Dateien

### Neue Dateien

Keine.

### Zu ändernde Dateien

| Datei | Art der Änderung |
|-------|------------------|
| `src/App.tsx` | Import-Pfad: `./builder/types` → `./builder/schemas` |
| `src/builder/Renderer.tsx` | Import-Pfad: `./types` → `./schemas` |
| `src/builder/EditModeContext.tsx` | Import-Pfad: `./types` → `./schemas` |
| `src/builder/specHelpers.ts` | Import-Pfad: `./types` → `./schemas` |
| `src/builder/blockIds.ts` | Import-Pfad: `./types` → `./schemas` |
| `src/elements/layout/Container/Container.schema.ts` | Lokales `BlockSpecSchema` (Zeilen 9–12) + zugehöriger JSDoc (Zeilen 4–8) löschen; stattdessen Import aus `../../../builder/schemas` |

### Zu löschende Dateien/Code

| Datei | Was wird gelöscht | Grund |
|-------|-------------------|-------|
| `src/elements/layout/Container/Container.schema.ts` | Zeilen 4–8 (JSDoc) + Zeilen 9–12 (lokales `const BlockSpecSchema = z.object({…})`) | Duplikation; zentrales Schema existiert ab Plan 01 in `src/builder/schemas.ts` |

## Implementierung

### Schritt 1: Container-Schema auf zentrales `BlockSpecSchema` umstellen

**Datei:** `src/elements/layout/Container/Container.schema.ts`

**Aktueller Zustand (Zeilen 1–13):**

```ts
import { z } from 'zod';
import type { ModuleMeta } from '../../../builder/types';

/**
 * Flat block spec schema. Intentionally does not include a recursive Container
 * shape — this enforces the "max 1 level of nesting" constraint.
 * Each child's props are validated by its own module schema inside the renderer.
 */
const BlockSpecSchema = z.object({
    type:  z.string(),
    props: z.record(z.string(), z.unknown()),
});

export const ContainerPropsSchema = z.object({
```

**Neuer Zustand:**

```ts
import { z } from 'zod';
import type { ModuleMeta } from '../../../builder/types';
import { BlockSpecSchema } from '../../../builder/schemas';

export const ContainerPropsSchema = z.object({
```

Der Rest der Datei (ab `export const ContainerPropsSchema`) bleibt **unverändert** — `z.array(BlockSpecSchema).min(1)` zeigt danach auf das importierte Schema statt auf das lokale.

**Erklärung:**

- JSDoc wandert nicht mit — die "max 1 level of nesting"-Semantik ist eine Konvention der Module, nicht des Schemas. `BlockSpecSchema` in schemas.ts ist bewusst neutral (weiß nichts über Nesting-Level). Der Kommentar rot hier, wo er nicht mehr stimmt.

### Schritt 2: Alle `./types`-Imports auf `./schemas` umstellen

Mechanisch: in jeder der fünf Dateien genau den `import`-Pfad ändern. Sonst **nichts**. Typ-Annotationen bleiben 1:1.

| Datei | Zeile | Vorher | Nachher |
|-------|-------|--------|---------|
| `src/App.tsx` | 7 | `import type { SiteSpec } from './builder/types';` | `import type { SiteSpec } from './builder/schemas';` |
| `src/builder/Renderer.tsx` | 5 | `import type { BlockSpec, SiteSpec } from './types';` | `import type { BlockSpec, SiteSpec } from './schemas';` |
| `src/builder/EditModeContext.tsx` | 8 | `import type { SiteSpec } from './types';` | `import type { SiteSpec } from './schemas';` |
| `src/builder/specHelpers.ts` | 3 | `import type { BlockSpec, SiteSpec } from './types';` | `import type { BlockSpec, SiteSpec } from './schemas';` |
| `src/builder/blockIds.ts` | 1 | `import type { BlockSpec, SiteSpec } from './types';` | `import type { BlockSpec, SiteSpec } from './schemas';` |

**Erklärung:**

- `types.ts` exportiert die Interfaces noch — dadurch bleiben Test-Files (die noch nicht umgestellt sind) kompilierbar. Das ist der bewusste Checkpoint.
- `BlockSpec` und `SiteSpec` sind strukturell in beiden Quellen identisch, also kommt es zu **keinem** Typ-Widerspruch im Projekt.

---

## Aufrufer umstellen

Siehe Schritte 1 + 2 oben. Keine weiteren indirekten Aufrufer (laut Impact-Analyse Sektion 10.2).

---

## Validierung

### Manuelle Tests

- [ ] `npm run dev` startet, App rendert die bisherige Demo-Seite visuell unverändert.
- [ ] Edit-Mode-Toolbar funktioniert weiter (Toggle + inline-Edit Smoke-Test auf einem Text).

### Automatisierte Tests

```bash
npm run lint
npm run test
npm run build
```

Alle drei müssen grün sein. Besonderes Augenmerk auf:

- `src/builder/blockIds.test.ts` — nutzt `SiteSpec` aus `./types` (noch!). Muss in Plan 03 umgestellt werden, **darf aber jetzt nicht brechen** (Interfaces existieren weiter in types.ts).
- `src/builder/Renderer.test.tsx` — dito.
- `src/builder/editMode.test.tsx` — dito.

### Erwartetes Verhalten

- Produktionscode lädt `BlockSpec`/`SiteSpec` aus `schemas.ts`.
- Container validiert `children` gegen das zentrale `BlockSpecSchema`.
- `types.ts` hat weiterhin die Interfaces (für Tests bis Plan 03).
- Keine sichtbare App-Verhaltensänderung.

## Rollback-Plan

Falls dieser Schritt fehlschlägt:

1. Die sechs Edits einzeln rückgängig machen (nur Import-Pfade bzw. Container-Schema-Block wiederherstellen). Da keine Logik berührt wurde, ist Rollback trivial.
2. Plan 01 bleibt gültig — die neuen Files werden einfach noch nicht konsumiert.

---

*Status: Ausstehend*
*Erstellt am: 2026-04-14*
