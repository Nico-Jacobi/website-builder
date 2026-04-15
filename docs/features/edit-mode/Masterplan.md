# Edit Mode - Masterplan

## Status
- [x] Phase 1: Masterplan
- [x] Phase 1b: Impact-Analyse
- [x] Phase 2: Implementierungspläne
- [x] Phase 2b: Sub-Pläne (04.1–04.4)
- [x] Implementierung gestartet
- [x] Cleanup-Validierung
- [x] Feature abgeschlossen

---

## 1. Ziel

**Was soll erreicht werden?**
Ein zentraler, einheitlicher Edit-Mode für den Website-Builder. Wenn aktiv, können Nutzer Texte direkt im UI inline bearbeiten und Bilder austauschen — ohne Formular-Panels oder separate Editoren. Alle Module verhalten sich konsistent gleich.

**Anwendungsfall:**
- Nutzer aktiviert Edit Mode (Toggle-Button oder Variable)
- Texte werden klickbar / inline-editierbar (contenteditable)
- Bilder zeigen ein Overlay mit „Bild tauschen"-Aktion
- Änderungen fließen sofort zurück in den SiteSpec-State
- Nutzer deaktiviert Edit Mode → normale Ansicht

---

## 2. Ist-Zustand

**Aktuelle Implementierung:**
- `App.tsx` rendert statisch ein einzelnes `<Header>`-Element direkt, ohne Renderer
- Alle Module sind **pure, zustandslose** React-Komponenten — sie kennen kein Editing
- `Renderer.tsx` übernimmt SiteSpec → React-Tree, aber `App.tsx` nutzt ihn noch nicht
- Kein globaler State vorhanden

**Probleme mit aktuellem Ansatz:**
- App.tsx muss erst auf Renderer umgestellt werden, damit Edit Mode sinnvoll greift
- Kein Mechanismus, SiteSpec-Änderungen zurückzuschreiben
- Module haben keine Ahnung vom Edit-Kontext

**Relevante Dateien:**
- `src/App.tsx` — Einstiegspunkt, noch kein Renderer-Einsatz
- `src/builder/Renderer.tsx` — rendert SiteSpec, muss edit-aware werden
- `src/builder/types.ts` — SiteSpec, BlockSpec, ModuleDefinition
- `src/builder/registry.ts` — zentrales Modul-Register
- `src/elements/**` — alle 13 Module mit Text/Bild-Props

---

## 3. Soll-Zustand

**Gewünschtes Verhalten:**
- Ein `EditModeContext` hält `isEditMode: boolean` und eine `updateBlock`-Funktion
- Module nutzen zwei Primitive Hooks: `useEditableText` und `useEditableImage`
- Im normalen Modus: Hooks sind No-Ops → kein Performance-Overhead, exakt gleiche Ausgabe
- Im Edit-Modus:
  - Texte: werden `contenteditable`, Blur → `updateBlock`-Call mit neuem Wert
  - Bilder: Klick-Overlay erscheint, URL-Eingabe oder Datei-Upload → `updateBlock`
- Einheitliche visuelle Sprache: Hover-Highlight, Edit-Cursor, konsistentes Overlay-Design via eigene CSS-Klassen

**User Flow:**
1. App zeigt einen Toggle-Button (oder `isEditMode`-Variable)
2. Nutzer aktiviert Edit Mode
3. Alle editierbaren Felder bekommen visuelles Feedback (Outline, Cursor)
4. Nutzer klickt auf einen Text → wird editierbar in-place
5. Nutzer verlässt Feld (blur) → SiteSpec wird aktualisiert, Renderer re-rendert
6. Nutzer klickt auf ein Bild → Overlay öffnet URL-Eingabefeld
7. Nutzer bestätigt → SiteSpec wird aktualisiert
8. Nutzer deaktiviert Edit Mode → alles sieht wieder normal aus

**Technische Anforderungen:**
- Kein Re-Render des gesamten Trees bei jeder Zeichen-Eingabe (contenteditable lässt React außen vor)
- Modules bleiben im Wesentlichen unverändert — nur Props werden durch Hook-Rückgaben ersetzt
- CSS-Klassen für Edit-Overlays kommen aus `src/builder/EditMode.css` (zentral, nicht pro Modul)

---

## 4. Architektur-Entscheidungen

### Datenmodell

```
App.tsx
  └── hält: siteSpec: SiteSpec (useState)
  └── hält: isEditMode: boolean (useState)
  └── stellt bereit: EditModeContext { isEditMode, updateBlock }
      └── Renderer bekommt spec + onBlockChange
          └── Module nutzen useEditableText / useEditableImage
```

**`updateBlock(blockIndex: number, newProps: Record<string, unknown>)`**
— ersetzt `siteSpec.blocks[blockIndex].props` mit neuen Props (immutabel)

**`EditModeContext`:**
```ts
interface EditModeContextValue {
  isEditMode: boolean;
  updateBlock: (blockIndex: number, newProps: Record<string, unknown>) => void;
}
```

### Hook-API

```ts
// Text: gibt Props zurück, die direkt auf ein Element gestreut werden
useEditableText(
  value: string,
  blockIndex: number,
  propPath: string   // z.B. 'heading' oder 'cards[0].title'
): { children: string; contentEditable?: true; onBlur?: handler; className?: string }

// Bild: gibt Props + Overlay-Element zurück
useEditableImage(
  src: string,
  blockIndex: number,
  propPath: string
): { src: string; overlayElement: ReactNode | null }
```

### Renderer-Änderung

Der Renderer übergibt `blockIndex` an jeden Block. Dafür muss jedes Modul den Index "wissen". Sauberste Lösung: Renderer stellt per Context den aktuellen `blockIndex` bereit, den die Hooks lesen.

**`BlockIndexContext`**: wird vom Renderer vor jedem Block-Render gesetzt.

### Keine Props-Durchbohrung

Module erhalten **keine neuen Props**. Sie rufen nur die Hooks auf. Hooks lesen Context intern. Module-Signaturen bleiben unverändert — Zod-Schemas ändern sich nicht.

---

## 5. Beachtenswertes

### Performance
- `contenteditable` schreibt nicht in React-State bei jedem Keystroke — React bleibt außen
- `updateBlock` wird nur bei `blur` aufgerufen → kein unnötiges Re-Rendering beim Tippen
- Context-Updates: `isEditMode`-Wechsel rendert alle Consumer neu (akzeptabel, da selten)

### Styling (CLAUDE.md-Konform)
- Edit-Overlays in `src/builder/EditMode.css` (eigene Datei, kein Modul-CSS)
- Klassen: `.edit__text-field`, `.edit__image-overlay`, `.edit__active`
- Nur `var(--…)` Tokens — keine hardcodierten Farben
- Kein Inline-Style außer dynamischen Werten

### Sicherheit
- URL-Eingabe für Bilder: keine direkte Ausführung, nur `src`-Attribut-Zuweisung
- `contenteditable` erzeugt kein HTML (nur `textContent` auslesen, nicht `innerHTML`)

### App.tsx Umbau
- App.tsx muss von statischem `<Header>` auf `<Renderer spec={spec}>` umgestellt werden
- `spec` wird als `useState` gehalten
- Eine Demo-Spec wird initial geladen (alle vorhandenen Module, sinnvolle Defaults)

---

## 6. Abhängigkeiten

**Voraussetzungen:**
- App.tsx muss Renderer verwenden (wird im ersten Plan umgebaut)
- SiteSpec muss als React-State existieren

**Betroffene Features:**
- Alle 13 bestehenden Module werden angepasst (Hooks eingebaut)

**Externe Abhängigkeiten:**
- Keine neuen Packages nötig — React Context + Hooks reichen

---

## 7. Nicht-Ziele

**Explizit NICHT Teil dieses Features:**
- Persistenz (kein Save-to-File, kein Backend)
- Undo/Redo
- Drag & Drop zum Umordnen von Blöcken
- Block hinzufügen / löschen
- Rich-Text-Editing (Bold, Italic, Listen) — nur plain text
- Bild-Upload / Dateiauswahl-Dialog — nur URL-Eingabe
- Auth/Login-Integration (die Toolbar ist ein temporärer Platzhalter)
- Mobile-Optimierung des Edit-Overlays

**Spätere Erweiterungen:**
- Persistenz + Backend-Sync
- Strukturelle Änderungen (Block-Reihenfolge, neue Blöcke)
- Datei-Upload für Bilder
- Undo/Redo Stack

---

## 8. Offene Fragen

- [x] ~~Soll der initiale Demo-Spec alle Module zeigen oder nur eine sinnvolle Auswahl?~~
  → **Sinnvolle Auswahl** — repräsentative Mischung, kein Kitchen-Sink
- [x] ~~Edit-Mode-Toggle: simpler `<button>` in App.tsx oder eine schwebende Toolbar?~~
  → **Schwebende Toolbar** (fixed position, oben rechts oder unten), aber **vollständig isoliert** in einer eigenen Komponente `EditModeToolbar` — kann mit einer Zeile in `App.tsx` entfernt werden. Später durch Login/Auth-Logic ersetzt.
- [x] ~~Für verschachtelte Props (z.B. `cards[0].title`): einfacher `propPath`-String oder strukturierter Pfad?~~
  → **Einfacher String-Pfad** — `'heading'`, `'cards[0].title'`, etc. Wird intern von den Hooks geparst.

---

## 9. Was muss weg (Impact-Analyse)

### 9.1 Zu löschende Dateien
Keine Datei wird komplett gelöscht. Alle bestehenden Dateien werden entweder beibehalten oder modifiziert.

### 9.2 Zu löschender Code
| Datei | Zeile(n) | Element | Grund |
|-------|----------|---------|-------|
| `src/App.tsx` | 2 | `import { Header } from "./elements/layout/Header"` | Header wird nicht mehr direkt in App.tsx verwendet |
| `src/App.tsx` | 6–15 | Gesamter JSX-Body (`<div className="vertical_layout">…</div>`) inkl. `<Header title={"Tolle Website"} subtitle={"by nico"} />` | Wird durch `<EditModeContext.Provider>` + `<Renderer spec={spec} />` + `<EditModeToolbar>` ersetzt |

### 9.3 Veraltete Patterns die ersetzt werden
| Altes Pattern | Neues Pattern | Betroffene Stellen |
|---------------|---------------|-------------------|
| `App.tsx` rendert `<Header>` direkt (Zeile 10) | `App.tsx` hält `siteSpec` als `useState<SiteSpec>` und rendert via `<Renderer spec={siteSpec}>` | `src/App.tsx` Zeilen 1–18 komplett |
| `Renderer.tsx` iteriert Blöcke ohne Index-Context (Zeile 23–25) | Renderer setzt vor jedem Block einen `BlockIndexContext` mit dem aktuellen `i` | `src/builder/Renderer.tsx` Zeile 23–27 |
| Module rendern Props direkt als statischen Text/Bild-Attribut | Module wrappen editierbare Werte in `useEditableText(value, blockIndex, propPath)` / `useEditableImage(src, …)` | Alle 13 Modul-`.tsx`-Dateien (schrittweise in Plan 04) |

---

## 10. Betroffene Aufrufer (Impact-Analyse)

### 10.1 Direkte Aufrufer
| Datei | Zeile | Aktueller Aufruf | Muss geändert zu |
|-------|-------|------------------|------------------|
| `src/App.tsx` | 1 | `import './App.css'` | bleibt, aber `App.css` erhält keine neuen Regeln |
| `src/App.tsx` | 2 | `import { Header } from "./elements/layout/Header"` | entfernen; stattdessen `import Renderer from './builder/Renderer'` + `import { EditModeContext } from './builder/EditModeContext'` + `import { EditModeToolbar } from './builder/EditModeToolbar'` |
| `src/App.tsx` | 4 | `function App()` — hält keinen State | Funktion hält `const [siteSpec, setSiteSpec] = useState<SiteSpec>(demoSpec)` und `const [isEditMode, setIsEditMode] = useState(false)` |
| `src/App.tsx` | 6–15 | `<div className="vertical_layout"><Header … /></div>` | `<EditModeContext.Provider value={…}><Renderer spec={siteSpec} /><EditModeToolbar /></EditModeContext.Provider>` |
| `src/builder/Renderer.tsx` | 23–27 | `spec.blocks.map((block, i) => <Fragment key={i}>{renderBlock(block, …)}</Fragment>)` | Jedes Block-Render zusätzlich in `<BlockIndexContext.Provider value={i}>` einwickeln |
| `src/builder/Renderer.tsx` | 41 | `function renderBlock(block, path)` — ohne Index-Kontext | Bleibt strukturell gleich; Index kommt aus `BlockIndexContext`, kein zusätzliches Argument nötig |

### 10.2 Transitive Aufrufer

| Datei | Zeile | Grund der Betroffenheit |
|-------|-------|------------------------|
| `src/elements/layout/Header/Header.tsx` | 10–11 | `{title}` und `{subtitle}` → `useEditableText`; `{icon}` (Zeile 8) → `useEditableImage` |
| `src/elements/layout/HeroBanner/HeroBanner.tsx` | 25–28 | `{heading}`, `{subheading}`, `{ctaLabel}` → `useEditableText` (kein Bild-Prop) |
| `src/elements/layout/Footer/Footer.tsx` | 15, 32–33 | `{col.heading}`, `{tagline}`, `{copyright}` → `useEditableText` |
| `src/elements/layout/FooterSimple/FooterSimple.tsx` | 10–11 | `{tagline}`, `{copyright}` → `useEditableText` |
| `src/elements/layout/Container/Container.tsx` | — | Kein Text/Bild-Prop; kein Hook nötig. Nur als Container-Block in der Demo-Spec relevant |
| `src/elements/content/TextBlock/TextBlock.tsx` | 7–9 | `{heading}`, `{body}`, `{subtext}` → `useEditableText` |
| `src/elements/content/MediaText/MediaText.tsx` | 7–10 | `src={imageSrc}` → `useEditableImage`; `{heading}`, `{body}` → `useEditableText` |
| `src/elements/content/CardRow/CardRow.tsx` | 9–11 | delegiert an `<Card>`; Hook-Einbau in `src/elements/shared/Card.tsx` (Zeilen 11–14): `card.imageSrc` → `useEditableImage`, `card.title`/`card.body` → `useEditableText` |
| `src/elements/content/Callout/Callout.tsx` | 7–10 | `{heading}`, `{body}`, `{icon}` → `useEditableText` |
| `src/elements/content/StatRow/StatRow.tsx` | 10–11 | `{stat.value}`, `{stat.label}` → `useEditableText` (je Tile) |
| `src/elements/content/CardGrid/CardGrid.tsx` | 9–11 | delegiert an `<Card>` wie CardRow — gleiche Änderung in `Card.tsx` deckt beide ab |
| `src/elements/media/ImageBlock/ImageBlock.tsx` | 8–10 | `src={src}` → `useEditableImage`; `{caption}` (Zeile 14) → `useEditableText` |
| `src/elements/media/Gallery/Gallery.tsx` | 14–21 | `src={image.src}` → `useEditableImage`; `{image.caption}` → `useEditableText` (je Eintrag) |
| `src/elements/shared/Card.tsx` | 11, 13–14 | Gemeinsamer Renderer für CardRow + CardGrid: `card.imageSrc` → `useEditableImage`, `card.title`/`card.body` → `useEditableText`; **propPath muss index-bewusst sein** (z. B. `cards[0].title`) |

### 10.3 Betroffene Tests
Aktuell keine Tests vorhanden (`src/**/*.{test,spec}.{ts,tsx}` — kein Treffer).

---

## 11. Akzeptanzkriterien

### Funktionale Kriterien
- [ ] Edit Mode lässt sich ein- und ausschalten
- [ ] Alle Text-Props in allen 13 Modulen sind im Edit Mode inline editierbar
- [ ] Alle Bild-Props (`src`-Felder) zeigen im Edit Mode ein Overlay zur URL-Eingabe
- [ ] Änderungen aktualisieren sofort den SiteSpec-State (sichtbar im Re-Render)
- [ ] Im normalen Modus: Module sehen exakt gleich aus wie vorher (kein Edit-UI sichtbar)
- [ ] Einheitliches visuelles Edit-Feedback über alle Module (gleiche CSS-Klassen)

### Technische Kriterien
- [ ] Kein alter Code mehr vorhanden
- [ ] Build läuft fehlerfrei (TypeScript, keine eslint-Fehler)
- [ ] Keine `// TODO` Kommentare im neuen Code
- [ ] Module-Zod-Schemas bleiben unverändert
- [ ] Keine Props-Durchbohrung für Edit-Kontext

### Qualitätskriterien
- [ ] Edit-Styling ausschließlich über CSS-Custom-Properties (keine hardcodierten Werte)
- [ ] Hooks sind No-Ops wenn `isEditMode === false` (keine Performance-Kosten)
- [ ] `contenteditable`-Handler liest `textContent`, nicht `innerHTML`

---

## 12. Nächste Schritte

1. Review dieses Masterplans mit Nutzer → Freigabe
2. Impact-Analyse starten (Sektionen 9 + 10 verfeinern)
3. Recherche zu Best Practices (contenteditable in React, Context-Patterns)
4. Implementierungspläne erstellen:
   - `01_Foundation.md` — App.tsx Umbau + EditModeContext + State + Demo-Spec
   - `02_EditPrimitives.md` — useEditableText + useEditableImage + CSS
   - `03_Toolbar.md` — EditModeToolbar (schwebend, isoliert, einfach entfernbar)
   - `04_ModuleUpdates.md` — alle relevanten Module anpassen
5. Größen-Check → ggf. Sub-Pläne
6. Kohärenz-Check
7. `/execute`

---

*Erstellt am: 2026-04-11*
