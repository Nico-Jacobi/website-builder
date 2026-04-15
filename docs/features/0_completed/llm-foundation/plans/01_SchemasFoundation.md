# LLM Foundation — Plan 01: Schemas Foundation (additiv)

## Übersicht

| Aspekt | Details |
|--------|---------|
| **Ziel** | `BlockSpecSchema`, `SiteSpecSchema` und `validateSpecAgainstRegistry` als neue, additive Bausteine anlegen. Kein bestehender Code wird geändert — Build und alle Tests bleiben grün. |
| **Abhängig von** | — (erster Plan der Kette) |
| **Betroffene Bereiche** | Shared (Typ-/Schema-Layer in `src/builder/`) |
| **Geschätzte Komplexität** | Niedrig |

### Größen-Check

| Metrik | Wert | Schwellwert | OK? |
|--------|------|-------------|-----|
| Implementierungsschritte | 5 | >8 | ✓ |
| Neue Dateien | 2 (Tests zählen nicht) | >5 | ✓ |
| Zu ändernde Dateien | 0 | >10 | ✓ |

## Schnittstellen (Kohärenz-Vertrag)

### Inputs

Keine (erster Plan).

### Outputs (was dieser Plan für nachfolgende liefert)

| Für Plan | Was wird geliefert | Konkret (Datei / Export / Typ) |
|----------|-------------------|-------------------------------|
| Plan 02 | Zentrale Zod-Schemas + z.infer-Typen | `src/builder/schemas.ts` exportiert: `BlockSpecSchema`, `SiteSpecSchema`, `BlockSpec` (Typ), `SiteSpec` (Typ) |
| Plan 02 | Container-Schema kann zentrales `BlockSpecSchema` importieren | Import-Pfad: `'../../../builder/schemas'` |
| Plan 03 | Dasselbe — `BlockSpec`/`SiteSpec`-Typen für Test-Code konsumierbar | siehe oben |
| Plan 04 | `SiteSpecSchema` für `z.toJSONSchema()` | `src/builder/schemas.ts` → `SiteSpecSchema` |

### Architektur-Entscheidungen (die andere Pläne betreffen)

- **`validateSpecAgainstRegistry` lebt in eigenem File** `src/builder/validateSpec.ts`, nicht in `schemas.ts`. Grund: `schemas.ts` bleibt damit registry-frei und ist überall isoliert importierbar (Tests, Tools, spätere Exporter). Dies ist eine Verfeinerung gegenüber Masterplan Abschnitt 3, der beide Teile in `schemas.ts` gebündelt hatte. Plan 02–04 brauchen dafür keine Anpassung.
- **`SpecError`-Shape:** `{ path: string, message: string, raw?: ZodIssue[] }`. Das minimale Pflicht-Paar `path` + `message` reicht für UI-Darstellung und Logging; `raw` liefert auf Wunsch den vollen Zod-Tree für Debugging, ohne den Standard-Pfad zu verschmutzen. Beantwortet Masterplan Offene Frage 2.
- **`BlockSpecSchema` ist rekursiv typisiert** via `z.ZodType<BlockSpec> = z.lazy(() => …)`. Das Schema selbst enthält keine `children`-Rekursion — Container deklariert sein `children: z.array(BlockSpecSchema)` separat. Dadurch existiert nur **eine** kanonische BlockSpec-Definition, und Module können sie kombinieren, ohne dass das Schema selbst Modul-Semantik kennt.
- **Kein Export von `id` als Required:** `id` bleibt optional (entspricht `BlockSpec.id?` heute). `ensureBlockIds` füllt es erst beim Rendern — hand-authored Specs (und damit später LLM-Output) müssen `id` nicht kennen.

## Voraussetzungen

- [x] Zod v4 vorhanden (`zod ^4.3.6` in package.json).
- [x] Vitest + Testing-Library vorhanden.

## Betroffene Dateien

### Neue Dateien

| Datei | Beschreibung |
|-------|--------------|
| `src/builder/schemas.ts` | `BlockSpecSchema`, `SiteSpecSchema`, z.infer-Typen `BlockSpec` und `SiteSpec`. Kein Import aus `./registry` oder `./types`. |
| `src/builder/validateSpec.ts` | `validateSpecAgainstRegistry(spec)` und `SpecError`-Typ. Importiert `SiteSpecSchema` aus `./schemas` und `getModule` aus `./registry`. |
| `src/builder/schemas.test.ts` | Unit-Tests für die beiden Zod-Schemas (Happy-Path + Fehlerfälle). |
| `src/builder/validateSpec.test.ts` | Unit-Tests für `validateSpecAgainstRegistry` (Happy-Path, unbekannter Typ, schlechte Props, verschachtelte Container-Children). |

### Zu ändernde Dateien

Keine.

### Zu löschende Dateien/Code

Keine in diesem Plan (kommt in Plan 02 und Plan 03).

## Implementierung

### Schritt 1: `src/builder/schemas.ts` anlegen

**Datei:** `src/builder/schemas.ts` (neu)

**Änderung:**

```ts
import { z } from 'zod';

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
 * Recursive: a block's `props` may contain arrays of nested BlockSpecs
 * (e.g. Container.children). The recursion is expressed via `z.lazy`
 * so the type definition is a single source of truth.
 */
export const BlockSpecSchema: z.ZodType<BlockSpec> = z.lazy(() =>
    z.object({
        id:    z.string().optional(),
        type:  z.string(),
        props: z.record(z.string(), z.unknown()),
    }),
);

export type BlockSpec = {
    id?: string;
    type: string;
    props: Record<string, unknown>;
};

/**
 * The full description of a website.
 * This is the object a user, editor, or (later) LLM produces and mutates.
 * No code — just data.
 */
export const SiteSpecSchema = z.object({
    /** Optional theme token overrides applied to :root at render time. */
    theme:  z.record(z.string(), z.string()).optional(),
    /** Vertical stack of blocks. Order = render order. */
    blocks: z.array(BlockSpecSchema),
});

export type SiteSpec = z.infer<typeof SiteSpecSchema>;
```

**Erklärung:**

- Die `BlockSpec`-TypeScript-Deklaration wird **explizit hand-getippt** (nicht aus `z.infer` abgeleitet), weil `z.lazy` + `z.infer` im Zusammenspiel bei rekursiven Typen zu einem `unknown`-Zirkel führen kann. Das ist ein Zod-bekannter Trade-off; hand-getippter Typ + annotiertes `z.ZodType<BlockSpec>` ist die dokumentierte Standardlösung.
- `SiteSpec` dagegen nutzt `z.infer` — nicht rekursiv, kein Problem.
- `props` ist bewusst `Record<string, unknown>` (strukturgleich zum alten Interface). Per-Modul-Validierung passiert weiter über `module.propsSchema` (Renderer + Plan 02's `validateSpecAgainstRegistry`).

### Schritt 2: `src/builder/validateSpec.ts` anlegen

**Datei:** `src/builder/validateSpec.ts` (neu)

**Änderung:**

```ts
import type { ZodIssue } from 'zod';
import { SiteSpecSchema, type BlockSpec, type SiteSpec } from './schemas';
import { getModule } from './registry';

/** Single validation failure. `path` is a dotted/indexed JSON pointer. */
export interface SpecError {
    path: string;
    message: string;
    /** Full Zod issue list when the failure came from Zod. Optional. */
    raw?: ZodIssue[];
}

export type ValidateResult =
    | { ok: true;  spec: SiteSpec }
    | { ok: false; errors: SpecError[] };

/**
 * Full-spec validator used as the trust boundary between an unvalidated
 * source (LLM output, imported JSON) and the renderer.
 *
 * Runs in two passes:
 *   1. SiteSpecSchema.safeParse — shape only (blocks is array of
 *      BlockSpec, theme is Record<string,string>, etc.). No registry.
 *   2. For each block, look up registry[block.type] and run
 *      module.propsSchema.safeParse on its props. Recurses into any
 *      array prop whose items look like BlockSpecs.
 *
 * Returns all failures at once — does not stop at the first error —
 * so callers can show a complete report instead of a drip of fixes.
 */
export function validateSpecAgainstRegistry(input: unknown): ValidateResult {
    const shape = SiteSpecSchema.safeParse(input);
    if (!shape.success) {
        return { ok: false, errors: zodIssuesToSpecErrors('', shape.error.issues) };
    }

    const errors: SpecError[] = [];
    shape.data.blocks.forEach((block, i) => {
        validateBlock(block, `blocks[${i}]`, errors);
    });

    if (errors.length > 0) return { ok: false, errors };
    return { ok: true, spec: shape.data };
}

function validateBlock(block: BlockSpec, path: string, errors: SpecError[]): void {
    const module = getModule(block.type);
    if (!module) {
        errors.push({
            path,
            message: `Unknown module "${block.type}". Known modules are registered in src/builder/registry.ts.`,
        });
        return;
    }

    const parsed = module.propsSchema.safeParse(block.props);
    if (!parsed.success) {
        errors.push(...zodIssuesToSpecErrors(`${path}.props`, parsed.error.issues, parsed.error.issues));
        return;
    }

    // Recurse into any array prop whose items are BlockSpecs.
    for (const [key, value] of Object.entries(block.props)) {
        if (Array.isArray(value)) {
            value.forEach((child, i) => {
                if (isBlockSpec(child)) {
                    validateBlock(child, `${path}.props.${key}[${i}]`, errors);
                }
            });
        }
    }
}

function zodIssuesToSpecErrors(
    basePath: string,
    issues: ZodIssue[],
    raw?: ZodIssue[],
): SpecError[] {
    return issues.map((issue) => ({
        path: joinPath(basePath, issue.path.map(String).join('.')),
        message: issue.message,
        ...(raw ? { raw } : {}),
    }));
}

function joinPath(a: string, b: string): string {
    if (!a) return b;
    if (!b) return a;
    return `${a}.${b}`;
}

function isBlockSpec(v: unknown): v is BlockSpec {
    return (
        !!v &&
        typeof v === 'object' &&
        typeof (v as BlockSpec).type === 'string' &&
        typeof (v as BlockSpec).props === 'object' &&
        (v as BlockSpec).props !== null
    );
}
```

**Erklärung:**

- Zwei Pässe, klar getrennt: Zod-Shape-Validierung zuerst, dann registry-abhängige Props-Validierung pro Block.
- Sammelt **alle** Fehler, bevor es zurückkehrt — das ist für eine LLM-Rückmeldung wertvoller als der erste Treffer.
- Rekursion über `BlockSpec[]`-Arrays (wie im Renderer, bewusst dieselbe Shape-Heuristik). Das Schema auf Spec-Ebene bleibt bewusst nicht rekursiv — Nesting entsteht nur dort, wo ein Modul explizit `z.array(BlockSpecSchema)` in seinem eigenen Schema deklariert.

### Schritt 3: `src/builder/schemas.test.ts` schreiben

**Datei:** `src/builder/schemas.test.ts` (neu)

**Testfälle:**

1. `SiteSpecSchema.safeParse({ blocks: [] })` → success.
2. `SiteSpecSchema.safeParse({ theme: { primary: '#f06' }, blocks: [{ type: 'X', props: {} }] })` → success.
3. `SiteSpecSchema.safeParse({ blocks: [{ type: 'X' }] })` → failure (fehlende `props`).
4. `SiteSpecSchema.safeParse({ blocks: [{ type: 123, props: {} }] })` → failure (`type` muss string sein).
5. `SiteSpecSchema.safeParse({})` → failure (fehlende `blocks`).
6. `BlockSpecSchema.safeParse({ type: 'Foo', props: { children: [{ type: 'Bar', props: {} }] } })` → success — rekursive Struktur in `props.children` ist erlaubt (Validierung pro Kind passiert erst in `validateSpecAgainstRegistry`).

### Schritt 4: `src/builder/validateSpec.test.ts` schreiben

**Datei:** `src/builder/validateSpec.test.ts` (neu)

**Testfälle:**

1. Gültige Demo-Spec aus `specFromTypes(['Header', 'TextBlock', 'FooterSimple'])` → `{ ok: true, spec }`.
2. `{ blocks: [{ type: 'DoesNotExist', props: {} }] }` → `{ ok: false, errors: [{ path: 'blocks[0]', message: /Unknown module/ }] }`.
3. `{ blocks: [{ type: 'Header', props: {} }] }` → `{ ok: false, errors: [...] }` (Header braucht `title`).
4. Verschachtelter Container: `{ blocks: [{ type: 'Container', props: { children: [{ type: 'DoesNotExist', props: {} }] } }] }` → Fehler bei `blocks[0].props.children[0]`.
5. Totaler Müll (`null`, `42`, `"hello"`) → `{ ok: false }` vom Shape-Pass.
6. Mehrfache Fehler werden alle gesammelt (nicht nur der erste).

### Schritt 5: Validierung

```bash
npm run test -- schemas validateSpec
npm run build
npm run lint
```

Keine Änderung an bestehenden Dateien → alle Bestands-Tests müssen weiterhin grün sein.

---

## Aufrufer umstellen

Keine — dieser Plan ist rein additiv.

---

## Validierung

### Manuelle Tests

- [ ] `npm run dev` startet, App rendert die bisherige Demo-Seite unverändert (kein Aufrufer nutzt die neuen Files noch).
- [ ] `npm run test` läuft grün (bisherige + neue).
- [ ] `npm run build` läuft grün.

### Automatisierte Tests

```bash
npm run test
npm run build
npm run lint
```

### Erwartetes Verhalten

Nach Plan 01 existieren zwei neue Files + zwei neue Test-Files. Nichts in der App-Logik ändert sich. Die neuen Exports sind bereit für Plan 02.

## Rollback-Plan

Falls dieser Schritt fehlschlägt:
1. `src/builder/schemas.ts`, `src/builder/validateSpec.ts` und ihre Test-Files löschen.
2. Keine weiteren Schritte nötig — es gibt noch keine Konsumenten.

---

*Status: Ausstehend*
*Erstellt am: 2026-04-14*
