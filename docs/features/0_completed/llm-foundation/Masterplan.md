# LLM Foundation — Masterplan

## Status
- [x] Phase 1: Masterplan
- [x] Phase 1b: Impact-Analyse
- [x] Phase 2: Implementierungspläne
- [x] Phase 2b: Sub-Pläne (nicht nötig — alle Pläne unter Schwellwert)
- [x] Phase 2c: Kohärenz-Check
- [x] Implementierung gestartet
- [x] Cleanup-Validierung
- [x] Feature abgeschlossen

## 1. Ziel

**Was soll erreicht werden?**

Die zwei reinen Refactoring-Fundamente legen, auf denen später der LLM-Call
aufsetzt, **ohne** in diesem Feature schon einen LLM-Call zu integrieren oder
UI zu bauen.

1. **Top-level `SiteSpecSchema` (Zod)** — eine ganze Site-Spec kann in einem
   Aufruf validiert werden, inkl. aller Blocks und deren Props gegen die
   Modul-Schemas. Die `SiteSpec`- und `BlockSpec`-TS-Interfaces werden
   gelöscht und aus dem Zod-Schema abgeleitet (`z.infer`), passend zur
   Modul-Schema-Convention im Projekt.
2. **Registry → LLM-Schema-Surface** — eine Funktion, die
   `listModules()` in eine LLM-konsumierbare Struktur konvertiert
   (Name, Category, Description, Tags, `z.toJSONSchema(propsSchema)`),
   plus das Top-level-`SiteSpecSchema` als JSON-Schema. Diese Struktur
   ist die einzige Quelle, aus der ein LLM später erfährt, welche Module
   existieren.

**Anwendungsfall:**

- Nach diesem Feature: Ein zukünftiger `generateSpec(prompt)` kann
  `getRegistryLLMSurface()` aufrufen, das Ergebnis in einen System-Prompt
  einbauen, die LLM-Antwort als JSON parsen, und mit einem einzigen
  `SiteSpecSchema.parse(...)` + `validateSpecAgainstRegistry(...)` wissen,
  ob die Ausgabe brauchbar ist — ohne dass der Renderer unsauberen Input
  zu sehen bekommt.
- Der Renderer selbst bleibt unverändert in Verhalten: er kann entweder
  weiter per-Block validieren oder auf bereits validierte Specs vertrauen
  (Option für später, außerhalb dieses Features).

## 2. Ist-Zustand

**Aktuelle Implementierung:**

- [src/builder/types.ts](../../../src/builder/types.ts) definiert
  `BlockSpec` und `SiteSpec` als **hand-written TS interfaces**. Es
  gibt kein zugehöriges Zod-Schema.
- [src/builder/Renderer.tsx](../../../src/builder/Renderer.tsx) validiert
  **nur pro Block** (Zeile 57: `module.propsSchema.safeParse(block.props)`)
  und rendert bei Fehlern ein `ErrorPlaceholder` — es gibt **keinen
  Validierungs-Entry-Point** für eine komplette Spec.
- [src/elements/layout/Container/Container.schema.ts](../../../src/elements/layout/Container/Container.schema.ts)
  definiert **lokal** ein minimales `BlockSpecSchema` (Zeilen 9–12),
  weil es keinen zentralen Ort dafür gibt. Diese Duplikation muss weg.
- [src/builder/registry.ts](../../../src/builder/registry.ts) hat
  `listModules()` und `getModule(name)` — aber keine Funktion, die die
  Module in ein LLM-taugliches Format serialisiert. Die Modul-Metas
  existieren zwar (`ModuleMeta` in types.ts), werden aber nirgendwo
  nach außen aggregiert.

**Probleme mit aktuellem Ansatz:**

1. Eine komplette LLM-Ausgabe kann nicht in einem Schritt validiert
   werden — der Renderer fängt Fehler erst zur Render-Zeit ab, und ein
   kaputter Block zeigt sich als visuelles ErrorPlaceholder mitten in
   der Seite statt als klarer "die Ausgabe ist nicht brauchbar"-Signal.
2. `BlockSpecSchema` ist in Container dupliziert — wer einen zweiten
   rekursiven Container (z.B. eine `Section` mit Children) bauen will,
   müsste erneut ein lokales Schema anlegen oder Container importieren.
3. Für den LLM existiert keine maschinenlesbare Modul-Liste. Ein LLM
   kann ohne Schemas nicht sinnvoll Props erzeugen.

**Relevante Dateien:**

- `src/builder/types.ts` — Interfaces, werden zu z.infer-Typen
- `src/builder/registry.ts` — bekommt eine neue Exporter-Funktion
- `src/builder/Renderer.tsx` — bleibt in Verhalten unverändert, evtl.
  kleine Typ-Anpassungen nach z.infer-Ersetzung
- `src/builder/specHelpers.ts` — nutzt `SiteSpec` / `BlockSpec`, muss
  nach Änderung weiter kompilieren (Signaturen bleiben gleich, Typ-Quelle
  wechselt)
- `src/builder/blockIds.ts` — dito
- `src/builder/EditModeContext.tsx` — dito
- `src/elements/layout/Container/Container.schema.ts` — lokales
  `BlockSpecSchema` löschen, shared importieren
- `src/App.tsx` — nutzt `SiteSpec`, muss weiter kompilieren

## 3. Soll-Zustand

**Gewünschtes Verhalten:**

### Neue Dateien

- **`src/builder/schemas.ts`** (neu) — zentrale Zod-Schemas:
  - `BlockSpecSchema` (rekursiv via `z.lazy`, unterstützt beliebig
    tiefes Nesting auf Schema-Ebene; die 1-Level-Beschränkung bleibt
    eine Konvention der Module, nicht des Schemas).
  - `SiteSpecSchema` mit `theme?: Record<string,string>` und
    `blocks: BlockSpec[]`.
  - `z.infer`-Typen `BlockSpec` und `SiteSpec` als Export.
  - `validateSpecAgainstRegistry(spec: unknown)` — validiert erst
    Shape via `SiteSpecSchema`, dann walked sie die Blocks und
    validiert jeden Block gegen `registry[block.type].propsSchema`.
    Gibt ein diskriminiertes Union zurück:
    `{ ok: true, spec: SiteSpec } | { ok: false, errors: SpecError[] }`
    mit `SpecError = { path: string, message: string }`.

### Geänderte Dateien

- **`src/builder/types.ts`** — `BlockSpec`- und `SiteSpec`-Interfaces
  löschen. `ModuleDefinition`, `ModuleMeta` bleiben (sind kein Spec-Typ).
  Re-Export von `BlockSpec`/`SiteSpec` aus `./schemas` **nicht** nötig —
  alle internen Konsumenten importieren direkt aus `./schemas`.
- **`src/builder/registry.ts`** — neue Funktion
  `getRegistryLLMSurface(): RegistryLLMSurface` (Shape siehe unten).
  Nutzt `z.toJSONSchema` aus Zod v4 (bereits als Dependency vorhanden).
- **`src/elements/layout/Container/Container.schema.ts`** — lokales
  `BlockSpecSchema` löschen, Import aus `src/builder/schemas.ts`.
- **Konsumenten von `SiteSpec`/`BlockSpec`** (specHelpers, blockIds,
  EditModeContext, Renderer, App, Tests) — Import-Pfad von
  `./types` auf `./schemas` umstellen. Da die Typen strukturell
  identisch sind (nur jetzt aus z.infer), erwarten wir **keine**
  inhaltlichen Änderungen in diesen Dateien.

### LLM-Surface Shape

```ts
export interface ModuleLLMDescriptor {
    name: string;
    category: string;
    description: string;
    tags?: string[];
    /** JSON Schema (Draft 2020-12) derived from module.propsSchema. */
    propsJSONSchema: Record<string, unknown>;
}

export interface RegistryLLMSurface {
    /** One descriptor per registered module. Order matches listModules(). */
    modules: ModuleLLMDescriptor[];
    /** JSON Schema for the full SiteSpec (shape only — props per block
     *  are validated against the module's propsSchema separately). */
    siteSpecJSONSchema: Record<string, unknown>;
}
```

Keine Prompt-Formatierung in diesem Feature — die Surface ist reine
Daten. Wie ein Prompt daraus entsteht, gehört zum nächsten Feature
(LLM-Call-Layer).

**User Flow:**

Nicht anwendbar — dieses Feature hat **keine sichtbaren User-Flows**.
Nach Abschluss läuft die Anwendung in der Demo (App.tsx mit DEMO_SPEC)
exakt wie vorher, der Renderer zeigt dieselbe Seite, der Edit-Mode
funktioniert wie bisher. Die Unterschiede sind ausschließlich auf der
API-Ebene sichtbar (neue Exports, neue Import-Pfade).

**Technische Anforderungen:**

- **Typ-Kompatibilität:** Die aus `z.infer` abgeleiteten Typen für
  `BlockSpec` und `SiteSpec` müssen strukturell identisch zu den
  aktuellen Interfaces sein (optionale `id`, `type: string`,
  `props: Record<string, unknown>`, usw.), sonst brechen die
  bestehenden Konsumenten.
- **Build + alle Tests grün:** Keine funktionale Regression.

## 4. Architektur-Entscheidungen

### Zwei-Stufen-Validierung (bestätigt vom Nutzer)

- `SiteSpecSchema.parse(x)` — prüft nur die Shape, keine
  Registry-Kopplung. Schnell und isoliert testbar.
- `validateSpecAgainstRegistry(x)` — zusätzlich per-Block-Props gegen
  die Modul-Schemas. Nutzt intern zuerst `SiteSpecSchema`, dann walkt
  es die Blocks. Einzige Stelle, die Registry kennt.

Das trennt sauber: das Schema-Modul ist registry-unabhängig
(importierbar auch in Tests / Tools, die keine Module laden wollen),
die Registry-Kopplung passiert in der Registry-Datei.

### Rekursion in `BlockSpecSchema`

BlockSpec ist rekursiv, weil `Container.props.children` wieder
`BlockSpec[]` enthält. Lösung: `z.lazy(() => BlockSpecSchema)` für das
`children`-Feld in Container **ist nicht nötig**, da Container sein
`children` einfach als `z.array(BlockSpecSchema)` deklariert und
`BlockSpecSchema` in schemas.ts selbst rekursiv wird via:

```ts
const BlockSpecSchema: z.ZodType<BlockSpec> = z.lazy(() =>
    z.object({
        id:    z.string().optional(),
        type:  z.string(),
        props: z.record(z.string(), z.unknown()),
    })
);
```

Die Rekursion findet real auf Datenebene statt (ein Block in
`props.children` ist wieder ein Block), aber das Schema selbst muss
nur die äußere Form kennen — `props` ist `Record<string, unknown>`,
und die Props-Validierung pro Modul liefert `validateSpecAgainstRegistry`.

### `z.toJSONSchema`

Zod v4 bringt `z.toJSONSchema` nativ mit
(`node_modules/zod/v4/core/to-json-schema.d.ts`). Keine externe
Abhängigkeit nötig. Bei Zod v4.3.6 gilt Draft 2020-12 als Default,
passt zu den gängigen LLM-Tool-APIs.

### Nicht ins Feature

- Prompt-Engineering / System-Prompt-Texte
- LLM-Call / API-Key-Handling
- UI (Textarea, Generate-Button)
- Persistenz (localStorage)
- Renderer-Änderungen über Typ-Import hinaus

Alles oben wird im nächsten Feature adressiert.

## 5. Beachtenswertes

### Performance

Irrelevant auf dieser Ebene. Validierung läuft einmal pro LLM-Antwort,
Registry-Surface wird einmal erzeugt (kann gecacht werden). Kein
Hot-Path.

### Sicherheit

- Die LLM-Surface enthält keine Secrets, rein öffentliche Schema-Daten.
- `validateSpecAgainstRegistry` ist die Grenze zwischen "unvertrauter
  Input" und "Renderer". Unknown `type` → Fehler, nicht silent.

### Migration

- `types.ts`'s `BlockSpec` und `SiteSpec` werden **gelöscht**, nicht
  versteckt oder re-exportiert. Alle Konsumenten stellen auf den
  neuen Import-Pfad um. Dies ist ein synchrones Refactoring — kein
  zweistufiger Deprecation-Plan.
- Container's lokales `BlockSpecSchema` wird **gelöscht**, durch
  zentralen Import ersetzt.

## 6. Abhängigkeiten

**Voraussetzungen:**

- Zod v4 (bereits vorhanden, `^4.3.6`).
- Bestehendes Modul-Pattern (Component/CSS/Schema/index) — unverändert.

**Betroffene Features:**

- **Edit-Mode** (bereits geliefert) — `EditModeContext.tsx` nutzt
  `SiteSpec`, muss weiter kompilieren. Erwartet: nur Import-Pfad-Update.
- **Ui-Elements** (bereits geliefert) — keine direkte Betroffenheit,
  nutzt die Module-Contract-Seite, nicht den Spec-Typ.

**Externe Abhängigkeiten:**

Keine neuen Packages.

## 7. Nicht-Ziele

**Explizit NICHT Teil dieses Features:**

- Kein LLM-Call (kommt im Folge-Feature).
- Keine Prompt-Vorlagen, keine System-Prompt-Texte.
- Keine UI für den Builder (Textarea / Generate-Button etc.).
- Keine Persistenz der generierten Spec.
- Kein User↔LLM-Feedback-Loop, keine Editierbarkeit der generierten
  Site im Prototyp.
- Keine Änderungen am Renderer-Verhalten. Der Renderer validiert
  weiter pro Block; `validateSpecAgainstRegistry` ist ein zusätzlicher,
  optionaler Entry-Point.
- Keine neuen Module.

**Spätere Erweiterungen (out of scope):**

- Eine `GeneratedSiteView`-Komponente, die eine bereits validierte
  Spec rendert und dabei die Renderer-Per-Block-Validierung skippt
  (Performance-Optimierung).
- Caching der LLM-Surface in einer Singleton.
- Prompt-Format-Vorlagen.

## 8. Offene Fragen

- [ ] **`z.toJSONSchema`-Optionen:** Default (Draft 2020-12, `$ref`
  für wiederverwendete Schemas) ist erwartet passend für Anthropics
  Tool-Use-API. Wenn der später zu wählende LLM eine andere Draft-Version
  oder Inlining braucht, justieren wir im nächsten Feature — kein
  Blocker hier.
- [ ] **SpecError-Format:** Halten wir die Error-Shape minimal
  (`{ path, message }`) oder geben wir den vollen Zod-`issues`-Tree
  zurück? Vorschlag: minimal halten, aber `raw?: ZodIssue[]` als
  optionalen Escape-Hatch. Entscheidung in Plan 01.

---

## 9. Was muss weg (Impact-Analyse)

> Wird vom `impact-analyzer` in Phase 1b befüllt.

### 9.1 Zu löschende Dateien

| Datei | Grund für Löschung |
|-------|-------------------|
| — | Keine Datei wird komplett gelöscht. `types.ts` bleibt bestehen (`ModuleMeta` / `ModuleDefinition` behalten ihren Platz), `Container.schema.ts` bleibt bestehen (nur lokales `BlockSpecSchema` wird entfernt). |

### 9.2 Zu löschender Code (Methoden, Klassen, Funktionen)

| Datei | Element | Grund |
|-------|---------|-------|
| `src/builder/types.ts` | Interface `BlockSpec` (Zeilen 33–45, inkl. JSDoc-Block Zeilen 33–40) | Wird durch `z.infer<typeof BlockSpecSchema>` aus `src/builder/schemas.ts` ersetzt (Single Source of Truth). |
| `src/builder/types.ts` | Interface `SiteSpec` (Zeilen 47–57, inkl. JSDoc-Block Zeilen 47–51) | Wird durch `z.infer<typeof SiteSpecSchema>` aus `src/builder/schemas.ts` ersetzt. |
| `src/elements/layout/Container/Container.schema.ts` | Lokales `const BlockSpecSchema = z.object({…})` (Zeilen 9–12) | Duplikation; wird durch Import von `BlockSpecSchema` aus `src/builder/schemas.ts` ersetzt. |
| `src/elements/layout/Container/Container.schema.ts` | JSDoc-Kommentar Zeilen 4–8 (erklärt das lokale Schema) | Erklärung gehört nicht mehr hierher, sobald Schema zentral lebt. |

### 9.3 Veraltete Patterns die ersetzt werden

| Altes Pattern | Neues Pattern | Betroffene Stellen |
|---------------|---------------|-------------------|
| Hand-written TS-Interfaces für Spec-Typen (`BlockSpec`, `SiteSpec` in `types.ts`) | Zod-Schema als Quelle, TS-Typen via `z.infer` | `src/builder/types.ts` → neue `src/builder/schemas.ts` |
| Lokales Mini-Schema in einzelnem Modul (Container) | Zentraler Import aus `src/builder/schemas.ts` | `src/elements/layout/Container/Container.schema.ts` Zeilen 9–12 |
| Fehlender Full-Spec-Validator (Renderer validiert nur per-Block) | Neuer Entry-Point `validateSpecAgainstRegistry(spec)` (zusätzlich, ersetzt die Renderer-Per-Block-Validierung nicht) | `src/builder/schemas.ts` (neu) bzw. `src/builder/registry.ts` |
| Keine maschinenlesbare Modul-Liste für LLM | Neue `getRegistryLLMSurface()` mit `z.toJSONSchema` | `src/builder/registry.ts` (additiv) |

---

## 10. Betroffene Aufrufer (Impact-Analyse)

> Wird vom `impact-analyzer` in Phase 1b befüllt.

### 10.1 Direkte Aufrufer

Alle Stellen, die `SiteSpec` und/oder `BlockSpec` aus `./types` bzw. `../builder/types` importieren. Ziel-Import ist `src/builder/schemas.ts` (relativer Pfad je nach Datei). Typ-Annotationen bleiben strukturell identisch — nur die Import-Herkunft wechselt.

| Datei | Zeile | Aktueller Aufruf | Muss geändert zu |
|-------|-------|------------------|------------------|
| `src/App.tsx` | 7 | `import type { SiteSpec } from './builder/types';` | `import type { SiteSpec } from './builder/schemas';` |
| `src/App.tsx` | 9 | `const DEMO_SPEC: SiteSpec = specFromTypes([…])` | unverändert (nur Import-Quelle ändert sich) |
| `src/App.tsx` | 20 | `useState<SiteSpec>(DEMO_SPEC)` | unverändert |
| `src/builder/Renderer.tsx` | 5 | `import type { BlockSpec, SiteSpec } from './types';` | `import type { BlockSpec, SiteSpec } from './schemas';` |
| `src/builder/Renderer.tsx` | 21, 36, 46, 108–115 | Props-/Parameter-Typen `SiteSpec`, `BlockSpec`, `SiteSpec['theme']`, Type-Guard auf `BlockSpec` | unverändert (strukturgleich) |
| `src/builder/EditModeContext.tsx` | 8 | `import type { SiteSpec } from './types';` | `import type { SiteSpec } from './schemas';` |
| `src/builder/EditModeContext.tsx` | 12–13 | `spec: SiteSpec`, `onSpecChange: (spec: SiteSpec) => void` | unverändert |
| `src/builder/specHelpers.ts` | 3 | `import type { BlockSpec, SiteSpec } from './types';` | `import type { BlockSpec, SiteSpec } from './schemas';` |
| `src/builder/specHelpers.ts` | 13–14 | `specFromTypes(types, theme?: SiteSpec['theme']): SiteSpec`, `const blocks: BlockSpec[]` | unverändert |
| `src/builder/blockIds.ts` | 1 | `import type { BlockSpec, SiteSpec } from './types';` | `import type { BlockSpec, SiteSpec } from './schemas';` |
| `src/builder/blockIds.ts` | 12, 16, 39–46 | `ensureBlockIds(spec: SiteSpec): SiteSpec`, `ensureBlockIdsDeep(block: BlockSpec)`, `isBlockSpec` Type-Guard | unverändert |
| `src/elements/layout/Container/Container.schema.ts` | 9–12 | Lokales `const BlockSpecSchema = z.object({ type, props })` | GELÖSCHT; statt dessen `import { BlockSpecSchema } from '../../../builder/schemas';` |
| `src/elements/layout/Container/Container.schema.ts` | 15 | `children: z.array(BlockSpecSchema).min(1)` | unverändert (zeigt nach dem Löschen auf das importierte Schema) |
| `src/test/renderWithProviders.tsx` | 4 | `import type { SiteSpec } from '../builder/types';` | `import type { SiteSpec } from '../builder/schemas';` |
| `src/test/renderWithProviders.tsx` | 6, 9, 10 | `const EMPTY_SPEC: SiteSpec`, `spec?: SiteSpec`, `onSpecChange?: (spec: SiteSpec) => void` | unverändert |

### 10.2 Transitive Aufrufer

Da die exportierten Signaturen strukturell identisch bleiben (beide Typen haben dieselbe Form; nur die Herkunft wechselt von `interface` auf `z.infer`), entstehen **keine echten transitiven Folgeänderungen**. Trotzdem gelistet: Aufrufer, die Funktionen/Komponenten aus 10.1 konsumieren und damit mittelbar auf dem Typ hängen.

| Datei | Aufrufkette | Muss geändert werden? |
|-------|-------------|----------------------|
| `src/App.tsx` | Konsumiert `Renderer`, `EditModeProvider`, `specFromTypes` — alle beziehen ihre Spec-Typen nach dem Refactor aus `./schemas` | Nein (Import von `SiteSpec` in App.tsx selbst wird bereits in 10.1 umgestellt) |
| `src/builder/EditModeToolbar.tsx` | Wird von `App.tsx` gerendert, benutzt keine Spec-Typen direkt | Nein |
| `src/builder/editModeStore.ts` | Wird von `EditModeContext`/`Renderer`/Tests verwendet, benutzt keine Spec-Typen direkt | Nein |
| `src/builder/useEditableText.ts`, `src/builder/useEditableImage.ts` | Konsumieren `editModeStore`, hängen nicht direkt am Spec-Typ | Nein |
| `src/builder/propPath.ts` | Pure Helper-Funktionen für `Record<string, unknown>`, keine Spec-Typ-Abhängigkeit | Nein |
| `src/elements/layout/Container/Container.tsx` | Nutzt `ContainerProps` aus `Container.schema.ts`. Dort ändert sich `z.array(BlockSpecSchema)` von lokalem auf importiertes Schema; der inferierte Typ bleibt strukturell gleich (`{ type, props }`). | Nein — inhaltlich unverändert; lediglich das Cast-Kommentar in `index.ts` (Zeile 11) bleibt korrekt |
| `src/elements/layout/Container/index.ts` | Reexportiert `ContainerProps`; Typ bleibt strukturell identisch | Nein |
| Alle übrigen Module (`Header`, `HeroBanner`, `Footer`, `FooterSimple`, `TextBlock`, `MediaText`, `CardRow`, `CardGrid`, `Callout`, `StatRow`, `ImageBlock`, `Gallery`) | Importieren nur `ModuleMeta` / `ModuleDefinition` aus `../../../builder/types` — diese bleiben dort | Nein |
| `src/builder/registry.ts` | Importiert `ModuleDefinition` aus `./types` — bleibt | Nein (bekommt jedoch additiv `getRegistryLLMSurface()`; keine Entfernung) |

### 10.3 Betroffene Tests

Rein Import-Pfad-Updates. Keine Test-Logik muss geändert werden, da die Typen strukturell identisch bleiben.

| Test-Datei | Beschreibung | Anpassung nötig |
|------------|--------------|-----------------|
| `src/builder/blockIds.test.ts` (Zeile 3) | `import type { SiteSpec } from './types';` → später verwendet in Zeilen 7, 21, 33, 57, 66 für `const spec: SiteSpec` | Import-Pfad auf `./schemas` umstellen |
| `src/builder/editMode.test.tsx` (Zeile 15) | `import type { SiteSpec } from './types';` → verwendet in Zeilen 64, 131, 144, 151, 175, 187, 201, 246, 269, 338, 369, 374, 401, 534, 579 (Parameter/Cast-Typen) | Import-Pfad auf `./schemas` umstellen |
| `src/builder/Renderer.test.tsx` (Zeile 7) | `import type { SiteSpec, BlockSpec } from './types';` → verwendet in `renderSpec(spec: SiteSpec)` (Zeile 12) und mehreren `const spec: SiteSpec = {…}` Deklarationen (Zeilen 26, 36, 52, 80, 99, 117, 129, 147, 158, 186, 207, 262, 286) | Import-Pfad auf `./schemas` umstellen |
| `src/elements/components.test.tsx` (Zeile 4) | `import type { SiteSpec } from '../builder/types';` → verwendet in Zeile 27 (`EMPTY_SPEC`) | Import-Pfad auf `../builder/schemas` umstellen |
| `e2e/app.spec.ts` | Playwright-Test — importiert keine Spec-Typen (bestätigt via Grep) | Keine Anpassung |
| Neue Tests (aus Akzeptanzkriterien) | `SiteSpecSchema.parse(validSpec)` / `.parse(garbage)`, `validateSpecAgainstRegistry` Happy-Path + 2 Error-Pfade, `getRegistryLLMSurface` Descriptor-Count + JSON-Schema-Form | Werden in Plan 01 / 02 neu angelegt (nicht Teil dieser Analyse) |

---

## 11. Akzeptanzkriterien

### Funktionale Kriterien

- [ ] `SiteSpecSchema.parse(validSpec)` akzeptiert alle aktuell im
  Projekt genutzten Demo-Specs (insb. `specFromTypes(...)`-Output).
- [ ] `SiteSpecSchema.parse(garbage)` wirft mit klarer Fehlermeldung.
- [ ] `validateSpecAgainstRegistry(spec)` fängt:
  - unbekannte Modul-Typen (`type: "DoesNotExist"`),
  - falsch geformte Props (z.B. `Header` ohne `title`).
- [ ] `getRegistryLLMSurface()` gibt für jedes registrierte Modul
  genau einen Descriptor zurück; `siteSpecJSONSchema` ist valides
  JSON Schema (Draft 2020-12).
- [ ] Die Demo-App (App.tsx) rendert vor und nach dem Refactoring die
  identische Seite (visuell unverändert), Edit-Mode funktioniert weiter.

### Technische Kriterien

- [ ] Kein alter Code mehr vorhanden (Interfaces `BlockSpec`/`SiteSpec`
  in types.ts gelöscht; lokales `BlockSpecSchema` in Container
  gelöscht).
- [ ] Alle Aufrufer umgestellt (`SiteSpec`/`BlockSpec`-Imports zeigen
  auf `./schemas`).
- [ ] `npm run build` läuft fehlerfrei.
- [ ] `npm run test` läuft grün.
- [ ] `npm run lint` meldet keine neuen Fehler.
- [ ] Keine `// TODO` im neuen Code.
- [ ] Keine auskommentierten Code-Blöcke.

### Qualitätskriterien

- [ ] Neue Datei `src/builder/schemas.ts` folgt der Struktur anderer
  schemas-Dateien (JSDoc über jedem Export, `z.infer`-Typen
  co-exportiert).
- [ ] Keine Typ-Duplikation zwischen Interface und Schema.
- [ ] `validateSpecAgainstRegistry` hat Unit-Tests für Happy-Path
  und mindestens zwei Error-Pfade (unbekannter Typ, schlechte Props).

---

## 12. Nächste Schritte

Nach Freigabe dieses Masterplans:
1. `impact-analyzer` ausführen → Sektionen 9 + 10 befüllen
2. Erstellung der Implementierungspläne in `plans/`:
   - `01_SiteSpecSchema.md` (Step 1)
   - `02_RegistryLLMSurface.md` (Step 2)
3. Plan-Größen-Check
4. Kohärenz-Check
5. Bereit für `/execute`

---

*Erstellt am: 2026-04-14*
*Letzte Aktualisierung: 2026-04-14*
