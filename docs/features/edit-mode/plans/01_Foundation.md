# Edit Mode - Plan 01: Foundation

## Übersicht

| Aspekt | Details |
|--------|---------|
| **Ziel** | App.tsx auf Renderer + SiteSpec-State umstellen, EditModeContext anlegen, BlockIndexContext in Renderer verdrahten |
| **Abhängig von** | — (erster Plan) |
| **Betroffene Bereiche** | Frontend / Shared |
| **Geschätzte Komplexität** | Mittel |

### Größen-Check
| Metrik | Wert | Schwellwert |
|--------|------|-------------|
| Implementierungsschritte | 4 | >8 → Sub-Pläne |
| Neue Dateien | 1 | >5 → Sub-Pläne |
| Zu ändernde Dateien | 2 | >10 → Sub-Pläne |

## Schnittstellen (Kohärenz-Vertrag)

### Outputs (was dieser Plan für nachfolgende liefert)
| Für Plan | Was wird geliefert | Konkret |
|----------|-------------------|---------|
| Plan 02 | Context-Exports | `src/builder/EditModeContext.tsx` exportiert `EditModeStateContext`, `EditModeActionsContext`, `BlockIndexContext`, `useEditModeState`, `useEditModeActions`, `useBlockIndex` |
| Plan 02 | `updateBlock` Signatur | `(blockIndex: number, propPath: string, value: unknown) => void` |
| Plan 03 | `setIsEditMode` via Context | `useEditModeActions().setIsEditMode` |
| Plan 04.x | Renderer liefert BlockIndex | Jeder Block-Render ist in `<BlockIndexContext.Provider value={i}>` eingebettet |

## Voraussetzungen

- [ ] Keine — erster Plan

## Betroffene Dateien

### Neue Dateien
| Datei | Beschreibung |
|-------|--------------|
| `src/builder/EditModeContext.tsx` | Context-Definitionen + Hooks für Edit Mode und Block-Index |

### Zu ändernde Dateien
| Datei | Art der Änderung |
|-------|------------------|
| `src/App.tsx` | Statisches `<Header>` → `<Renderer spec={spec}>`, SiteSpec-State, Context-Provider |
| `src/builder/Renderer.tsx` | `BlockIndexContext.Provider` um jeden Block wrappen |

### Zu löschende Code-Stellen
| Datei | Was wird gelöscht | Grund |
|-------|-------------------|-------|
| `src/App.tsx` | `import { Header }` + `<Header title=… />` | Ersetzt durch Renderer + Demo-Spec |

---

## Implementierung

### Schritt 1: EditModeContext.tsx anlegen

**Datei:** `src/builder/EditModeContext.tsx`

```tsx
import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { SiteSpec } from './types';

// ── State Context (isEditMode) ────────────────────────────────────────────────
// Getrennt von Actions, damit Konsumenten die nur den Status brauchen
// nicht bei updateBlock-Änderungen neu rendern.

interface EditModeStateValue {
  isEditMode: boolean;
}

export const EditModeStateContext = createContext<EditModeStateValue>({
  isEditMode: false,
});

export function useEditModeState(): EditModeStateValue {
  return useContext(EditModeStateContext);
}

// ── Actions Context (updateBlock, setIsEditMode) ──────────────────────────────

interface EditModeActionsValue {
  updateBlock: (blockIndex: number, propPath: string, value: unknown) => void;
  setIsEditMode: (value: boolean) => void;
}

export const EditModeActionsContext = createContext<EditModeActionsValue>({
  updateBlock: () => {},
  setIsEditMode: () => {},
});

export function useEditModeActions(): EditModeActionsValue {
  return useContext(EditModeActionsContext);
}

// ── Block Index Context ───────────────────────────────────────────────────────
// Wird vom Renderer vor jedem Block gesetzt.
// Hooks lesen ihn, ohne dass Module den Index als Prop erhalten müssen.

export const BlockIndexContext = createContext<number>(-1);

export function useBlockIndex(): number {
  return useContext(BlockIndexContext);
}

// ── Provider ──────────────────────────────────────────────────────────────────

interface EditModeProviderProps {
  children: ReactNode;
  spec: SiteSpec;
  onSpecChange: (spec: SiteSpec) => void;
}

export function EditModeProvider({ children, spec, onSpecChange }: EditModeProviderProps) {
  const [isEditMode, setIsEditMode] = useState(false);

  const updateBlock = useCallback(
    (blockIndex: number, propPath: string, value: unknown) => {
      onSpecChange({
        ...spec,
        blocks: spec.blocks.map((block, i) => {
          if (i !== blockIndex) return block;
          return { ...block, props: setNestedProp(block.props, propPath, value) };
        }),
      });
    },
    [spec, onSpecChange],
  );

  return (
    <EditModeStateContext.Provider value={{ isEditMode }}>
      <EditModeActionsContext.Provider value={{ updateBlock, setIsEditMode }}>
        {children}
      </EditModeActionsContext.Provider>
    </EditModeStateContext.Provider>
  );
}

// ── Nested prop path helper ───────────────────────────────────────────────────
// Parst Pfade wie 'heading', 'cards[0].title', 'columns[1].links[0].label'
// und gibt eine tiefe immutable Kopie mit dem neuen Wert zurück.

function setNestedProp(
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const keys = parsePath(path);
  return setIn(obj, keys, value) as Record<string, unknown>;
}

function parsePath(path: string): (string | number)[] {
  return path
    .split(/\.|\[(\d+)\]/)
    .filter(Boolean)
    .map((k) => (/^\d+$/.test(k) ? parseInt(k, 10) : k));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setIn(obj: any, keys: (string | number)[], value: unknown): unknown {
  if (keys.length === 0) return value;
  const [head, ...tail] = keys;
  if (Array.isArray(obj)) {
    const copy = [...obj];
    copy[head as number] = setIn(copy[head as number], tail, value);
    return copy;
  }
  return { ...obj, [head]: setIn(obj?.[head], tail, value) };
}
```

**Erklärung:**
- Zwei getrennte Contexts verhindert, dass Module die nur `isEditMode` lesen bei jedem `updateBlock`-Call neu rendern.
- `setNestedProp` ersetzt einen externen Dependency (immer/lodash) — 40 Zeilen, kein neues Package nötig.
- Der Provider sitzt in `App.tsx` und bekommt `spec` + `onSpecChange` — er hat keinen eigenen State für die Spec.

---

### Schritt 2: Renderer mit BlockIndexContext erweitern

**Datei:** `src/builder/Renderer.tsx`

Import hinzufügen (oben):
```tsx
import { BlockIndexContext } from './EditModeContext';
```

In der `Renderer`-Komponente, den Block-Map-Aufruf anpassen:
```tsx
// Alt:
{spec.blocks.map((block, i) => (
  <Fragment key={i}>{renderBlock(block, `blocks[${i}]`)}</Fragment>
))}

// Neu:
{spec.blocks.map((block, i) => (
  <BlockIndexContext.Provider key={i} value={i}>
    {renderBlock(block, `blocks[${i}]`)}
  </BlockIndexContext.Provider>
))}
```

**Erklärung:** Der `renderBlock`-Aufruf bleibt unverändert. Der Provider sorgt dafür, dass alle Hooks innerhalb eines Moduls den korrekten `blockIndex` lesen — ohne Props-Drilling.

---

### Schritt 3: Demo-Spec definieren

**Datei:** `src/App.tsx`

Demo-Spec als Konstante vor der Komponente — nutzt die `defaults` aus den bereits registrierten `ModuleDefinition`-Objekten:
```tsx
import type { SiteSpec } from './builder/types';
import { HeaderModule } from './elements/layout/Header';
import { HeroBannerModule } from './elements/layout/HeroBanner';
import { TextBlockModule } from './elements/content/TextBlock';
import { MediaTextModule } from './elements/content/MediaText';
import { CardRowModule } from './elements/content/CardRow';
import { ImageBlockModule } from './elements/media/ImageBlock';
import { FooterSimpleModule } from './elements/layout/FooterSimple';

const DEMO_SPEC: SiteSpec = {
  blocks: [
    { type: 'Header',       props: { ...HeaderModule.defaults } },
    { type: 'HeroBanner',   props: { ...HeroBannerModule.defaults } },
    { type: 'TextBlock',    props: { ...TextBlockModule.defaults } },
    { type: 'MediaText',    props: { ...MediaTextModule.defaults } },
    { type: 'CardRow',      props: { ...CardRowModule.defaults } },
    { type: 'ImageBlock',   props: { ...ImageBlockModule.defaults } },
    { type: 'FooterSimple', props: { ...FooterSimpleModule.defaults } },
  ],
};
```

**Hinweis:** `ModuleDefinition.defaults` ist Teil des bestehenden Vertrags — kein Re-Export nötig. Die Module werden für die Demo-Spec direkt importiert (sie sind ohnehin schon in der Registry registriert).

---

### Schritt 4: App.tsx umbauen

**Datei:** `src/App.tsx`

Kompletter neuer Inhalt (ersetzt bisherigen):
```tsx
import { useState } from 'react';
import './App.css';
import Renderer from './builder/Renderer';
import { EditModeProvider } from './builder/EditModeContext';
import { EditModeToolbar } from './builder/EditModeToolbar';
import type { SiteSpec } from './builder/types';
import { DEMO_SPEC } from './demoSpec'; // oder inline als Konstante

function App() {
  const [spec, setSpec] = useState<SiteSpec>(DEMO_SPEC);

  return (
    <EditModeProvider spec={spec} onSpecChange={setSpec}>
      <Renderer spec={spec} />
      <EditModeToolbar />  {/* TEMPORÄR — später durch Auth ersetzen */}
    </EditModeProvider>
  );
}

export default App;
```

**Erklärung:**
- DEMO_SPEC und alle Modul-Imports können direkt in `App.tsx` stehen — keine separate Datei nötig.
- `<EditModeToolbar />` ist in einer Zeile entfernbar wenn später Auth übernimmt.
- `spec` als `useState` macht die Spec live-mutierbar — jede `updateBlock`-Änderung triggert Re-Render des Renderers.

---

## Aufrufer umstellen

| Datei | Alt | Neu |
|-------|-----|-----|
| `src/App.tsx` | `import { Header } from './elements/layout/Header'` | entfernen |
| `src/App.tsx` | `<Header title="Tolle Website" subtitle="by nico" />` | `<Renderer spec={spec} />` |

---

## Validierung

### Manuelle Tests
- [ ] App startet ohne Fehler, zeigt die 7 Demo-Blöcke
- [ ] Renderer rendert alle Blöcke aus der Demo-Spec korrekt
- [ ] TypeScript Build läuft fehlerfrei (`tsc --noEmit`)
- [ ] Edit Mode Toolbar erscheint (auch wenn noch nichts tut, kommt in Plan 03)

### Erwartetes Verhalten
Nach Plan 01: Die App zeigt eine sinnvolle Demo-Seite mit 7 Blöcken. Der `EditModeProvider` ist aktiv, aber Editing funktioniert noch nicht (kommt in Plan 02+03).

---

*Status: Ausstehend*
*Erstellt am: 2026-04-11*
