# LLM Foundation — Plan 04: Registry LLM Surface

## Übersicht

| Aspekt | Details |
|--------|---------|
| **Ziel** | `getRegistryLLMSurface()` hinzufügen: eine Funktion, die die Registry in ein LLM-konsumierbares Shape serialisiert (Name, Category, Description, Tags + JSON-Schema pro Modul, plus JSON-Schema der kompletten SiteSpec). Rein additiv. |
| **Abhängig von** | Plan 01 (benötigt `SiteSpecSchema` aus `schemas.ts`) |
| **Betroffene Bereiche** | Shared (`src/builder/`) |
| **Geschätzte Komplexität** | Niedrig |

### Größen-Check

| Metrik | Wert | Schwellwert | OK? |
|--------|------|-------------|-----|
| Implementierungsschritte | 3 | >8 | ✓ |
| Neue Dateien | 0 | >5 | ✓ (Typen leben in `types.ts`, Function in `registry.ts`; Test-File zählt nicht) |
| Zu ändernde Dateien | 2 | >10 | ✓ |

## Schnittstellen (Kohärenz-Vertrag)

### Inputs

| Von Plan | Was wird erwartet | Konkret |
|----------|-------------------|---------|
| Plan 01 | `SiteSpecSchema` exportiert | `src/builder/schemas.ts` → `SiteSpecSchema` |

### Outputs

| Für Plan | Was wird geliefert |
|----------|---------------------|
| Zukünftiges LLM-Call-Feature | `getRegistryLLMSurface()` → `{ modules: ModuleLLMDescriptor[], siteSpecJSONSchema: Record<string, unknown> }` |

### Architektur-Entscheidungen

- **Typen in `types.ts`**, **Function in `registry.ts`** — Kohärenz mit bestehender Struktur (Typen zentral, Funktionen nah am Datenbesitz).
- **`z.toJSONSchema` Default-Einstellungen** — Zod v4 Default ist Draft 2020-12 mit `$ref`-Extraktion. Passt zur Anthropic Messages API Tool-Use Input Schema (siehe offene Frage im Masterplan, wird ggf. im nächsten Feature justiert).
- **Kein Caching** — der Aufruf ist einmal pro LLM-Call. Vorzeitige Optimierung wäre unangebracht.
- **Reine Funktion, kein Side-Effect** — `getRegistryLLMSurface()` liest nur `listModules()` + `SiteSpecSchema`. Wiederholte Aufrufe liefern strukturell identisches Ergebnis.

## Voraussetzungen

- [ ] Plan 01 abgeschlossen (`SiteSpecSchema` in `src/builder/schemas.ts`).
- [ ] Plan 02 + 03 nicht zwingend — dieser Plan funktioniert auch allein nach Plan 01, solange der Rest des Projekts weiterhin kompiliert.

## Betroffene Dateien

### Neue Dateien

| Datei | Beschreibung |
|-------|--------------|
| `src/builder/registry.test.ts` (erweitern oder neu falls nicht vorhanden) | Tests für `getRegistryLLMSurface()`. |

> Hinweis: `src/builder/registry.test.ts` existiert laut Projekt-Layout bereits — wir erweitern sie, keine neue File.

### Zu ändernde Dateien

| Datei | Art der Änderung |
|-------|------------------|
| `src/builder/types.ts` | Neue Interfaces `ModuleLLMDescriptor` und `RegistryLLMSurface` hinzufügen |
| `src/builder/registry.ts` | Neue Funktion `getRegistryLLMSurface()` exportieren |
| `src/builder/registry.test.ts` | Tests für `getRegistryLLMSurface()` ergänzen |

### Zu löschende Dateien/Code

Keine.

## Implementierung

### Schritt 1: Typen in `types.ts` ergänzen

**Datei:** `src/builder/types.ts`

**Änderung (am Ende der Datei hinzufügen):**

```ts
/**
 * LLM-konsumierbare Beschreibung eines einzelnen Moduls.
 * Wird aus ModuleMeta + z.toJSONSchema(propsSchema) abgeleitet.
 */
export interface ModuleLLMDescriptor {
    name: string;
    category: string;
    description: string;
    tags?: string[];
    /** JSON Schema (Draft 2020-12) derived from module.propsSchema. */
    propsJSONSchema: Record<string, unknown>;
}

/**
 * Aggregat, das ein LLM (oder ein menschlicher API-Konsument) braucht,
 * um valide SiteSpecs zu erzeugen: die Liste aller Module und die
 * Top-Level-Spec-Shape als JSON Schema.
 */
export interface RegistryLLMSurface {
    /** Descriptors in registry insertion order. */
    modules: ModuleLLMDescriptor[];
    /** JSON Schema for the full SiteSpec (shape only). */
    siteSpecJSONSchema: Record<string, unknown>;
}
```

### Schritt 2: `getRegistryLLMSurface()` in `registry.ts` implementieren

**Datei:** `src/builder/registry.ts`

**Änderung (Imports oben ergänzen + Funktion am Ende hinzufügen):**

```ts
import { z } from 'zod';
import { SiteSpecSchema } from './schemas';
import type { ModuleLLMDescriptor, RegistryLLMSurface } from './types';

// … bestehender Code bleibt unverändert …

/**
 * Projects the registry into a shape that an LLM (or any external consumer)
 * can use to produce valid SiteSpecs:
 *
 *   - One `ModuleLLMDescriptor` per registered module, each containing the
 *     module's meta fields and its propsSchema rendered as JSON Schema.
 *   - The full `SiteSpecSchema` rendered as JSON Schema, so the consumer
 *     knows the outer shape (theme + blocks array).
 *
 * This is the single place that couples "registry content" to the JSON
 * Schema surface. The LLM call layer (not part of this feature) composes
 * this into its system prompt.
 */
export function getRegistryLLMSurface(): RegistryLLMSurface {
    const modules: ModuleLLMDescriptor[] = listModules().map((m) => ({
        name:        m.meta.name,
        category:    m.meta.category,
        description: m.meta.description,
        ...(m.meta.tags ? { tags: m.meta.tags } : {}),
        propsJSONSchema: z.toJSONSchema(m.propsSchema) as Record<string, unknown>,
    }));

    return {
        modules,
        siteSpecJSONSchema: z.toJSONSchema(SiteSpecSchema) as Record<string, unknown>,
    };
}
```

**Erklärung:**

- `listModules()` liefert die bereits bestehende, ordered Module-Liste — wir fügen keine zweite Quelle der Wahrheit hinzu.
- `z.toJSONSchema` ist seit Zod v4 im Kern (`zod/v4/core/to-json-schema`). Keine externe Dependency.
- `tags` wird nur gesetzt wenn vorhanden (passt zum `tags?: string[]` im Interface).

### Schritt 3: Tests in `registry.test.ts` ergänzen

**Datei:** `src/builder/registry.test.ts`

**Test-Cases:**

1. **Descriptor-Anzahl = Modul-Anzahl:**
   ```ts
   const surface = getRegistryLLMSurface();
   expect(surface.modules).toHaveLength(listModules().length);
   ```

2. **Jeder Descriptor hat Pflicht-Felder:**
   Für alle Descriptors: `name`, `category`, `description` sind Strings, `propsJSONSchema` ist ein Objekt mit `type` oder `$ref` (typische JSON-Schema-Wurzelform).

3. **`tags` wird durchgereicht, wenn vorhanden:**
   ```ts
   const header = surface.modules.find((m) => m.name === 'Header');
   expect(header?.tags).toEqual(expect.arrayContaining(['header', 'nav', 'branding']));
   ```

4. **`siteSpecJSONSchema` ist valides JSON Schema mit `blocks`-Feld:**
   ```ts
   expect(surface.siteSpecJSONSchema).toHaveProperty('type', 'object');
   // properties.blocks sollte existieren
   expect(
     (surface.siteSpecJSONSchema as any).properties?.blocks,
   ).toBeDefined();
   ```

5. **Container's Props-Schema-Ausgabe referenziert BlockSpec:**
   ```ts
   const container = surface.modules.find((m) => m.name === 'Container');
   // Props-JSON-Schema von Container sollte ein children-Array mit BlockSpec-Shape haben
   expect(JSON.stringify(container?.propsJSONSchema)).toContain('children');
   ```
   (Hinweis: Exakte `$ref`/`$defs`-Struktur hängt von Zod's JSON-Schema-Output ab — Test bleibt bewusst robust.)

6. **Funktion ist reinig** — zwei Aufrufe liefern strukturell identisches Ergebnis:
   ```ts
   expect(getRegistryLLMSurface()).toEqual(getRegistryLLMSurface());
   ```

---

## Aufrufer umstellen

Keine — `getRegistryLLMSurface()` ist eine neue, in diesem Feature noch ungenutzte Funktion. Der erste Konsument ist das Folge-Feature (LLM-Call-Layer).

---

## Validierung

### Manuelle Tests

- [ ] Im Dev-REPL oder einem Scratch-Script:
  ```ts
  import { getRegistryLLMSurface } from './src/builder/registry';
  console.log(JSON.stringify(getRegistryLLMSurface(), null, 2));
  ```
  Das Ergebnis manuell sichten: 13 Descriptors (alle registrierten Module), jedes mit sinnvollem `propsJSONSchema`.

### Automatisierte Tests

```bash
npm run test -- registry
npm run build
npm run lint
```

### Erwartetes Verhalten

- `getRegistryLLMSurface()` importierbar aus `./registry`.
- Return-Shape entspricht `RegistryLLMSurface` aus `./types`.
- Bestehende App-Funktionalität vollständig unverändert.

## Rollback-Plan

Falls dieser Schritt fehlschlägt:

1. Änderungen in `registry.ts` und `types.ts` rückgängig machen.
2. Test-Case(s) entfernen.
3. `z.toJSONSchema`-Output auf der offenen Frage aus Masterplan Abschnitt 8 prüfen — möglich, dass eine andere Draft/Option nötig ist. Dann anpassen und erneut versuchen.

---

*Status: Ausstehend*
*Erstellt am: 2026-04-14*
