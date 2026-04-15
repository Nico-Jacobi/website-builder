# imageQuery Refactor - Masterplan

## Status
- [ ] Phase 1: Masterplan (in Arbeit)
- [ ] Phase 1b: Impact-Analyse
- [ ] Phase 2: Implementierungspläne
- [ ] Phase 2b: Sub-Pläne (falls nötig)
- [ ] Implementierung gestartet
- [ ] Cleanup-Validierung
- [ ] Feature abgeschlossen

## 1. Ziel

Anstatt dass das LLM Bild-URLs generiert (die sofort wieder überschrieben werden), soll es stattdessen ein `imageQuery`-Feld mit beschreibenden Keywords füllen (z.B. `"espresso coffee cup dark roast"`). Der `imageFiller`-Post-Processor liest diese Keywords direkt und bezieht das passende Foto von Pixabay/LoremFlickr.

**Anwendungsfall:**
LLM generiert `{ imageQuery: "cozy cafe interior warm light" }` statt `{ imageSrc: "https://unsplash.com/..." }`. Der imageFiller sucht dann gezielt nach diesem Query anstatt Keywords aus Alt-Text zu extrahieren.

## 2. Ist-Zustand

**Aktuelle Implementierung:**
- LLM füllt `imageSrc`/`backgroundImage`/`src` mit beliebigen URLs (oft Unsplash aus Trainingsdaten)
- `imageFiller.ts` überschreibt alle diese URLs komplett
- Keyword-Extraktion erfolgt indirekt aus `imageAlt`, `heading`, `body` Feldern des Blocks
- `buildQuery()` nimmt bis zu 5 Tokens aus dem Hint + 2 aus dem globalen Prompt-Kontext

**Probleme mit aktuellem Ansatz:**
- LLM-generierte URLs sind Wegwerfwerte — sinnlose Arbeit für das Modell
- Keyword-Extraktion aus Alt-Text ist umständlich und oft unpräzise
- Stopwort-Liste und Tokenisierung als Workaround für ein Problem das nicht sein muss
- Unsplash-URLs die das Modell halluziniert können zu Rate-Limiting oder 404 führen wenn `fillImages` fehlschlägt

**Relevante Dateien:**
- `src/llm/imageFiller.ts` — Hauptlogik, komplett betroffen
- `src/elements/shared/schemas.ts` — CardSchema (imageQuery hinzufügen)
- `src/elements/layout/HeroBanner/HeroBanner.schema.ts` — backgroundImage
- `src/elements/content/MediaText/MediaText.schema.ts` — imageSrc
- `src/elements/media/ImageBlock/ImageBlock.schema.ts` — src
- `src/elements/media/Gallery/Gallery.schema.ts` — GalleryImageSchema.src
- `src/elements/shared/EditableImage.tsx` — leeres src behandeln

## 3. Soll-Zustand

**Gewünschtes Verhalten:**
- Jedes Modul mit Bild-Feldern bekommt ein `imageQuery: z.string()` Feld
- URL-Felder (`imageSrc`, `backgroundImage`, `src`) werden `optional()` mit Default `''`
- LLM füllt nur `imageQuery`, nie URL-Felder direkt
- `imageFiller` liest `imageQuery` direkt — keine Keyword-Extraktion mehr nötig
- `EditableImage` rendert kein `<img>` wenn `src` leer ist

**User Flow:**
1. Nutzer gibt Prompt ein → LLM generiert Spec mit `imageQuery` Feldern
2. `validateSpecAgainstRegistry` validiert — imageQuery required, URL optional
3. `fillImages` läuft: liest `imageQuery`, fetcht Pixabay/LoremFlickr, schreibt URL zurück
4. Spec wird in localStorage gespeichert — URL-Felder jetzt gefüllt
5. Renderer zeigt fertige Website mit echten Fotos

**Technische Anforderungen:**
- Keine Breaking Changes für manuell erstellte Specs (imageQuery optional wo Bild optional ist)
- `EditableImage` muss leeres src-Attribut graceful handhaben

## 4. Architektur-Entscheidungen

### Datenmodell

| Modul | Altes Feld | Neues Schema |
|---|---|---|
| HeroBanner | `backgroundImage?: string` | `imageQuery?: string` + `backgroundImage?: string` (default `''`) |
| MediaText | `imageSrc: string` (required) | `imageQuery: string` (required) + `imageSrc?: string` (default `''`) |
| ImageBlock | `src: string` (required) | `imageQuery: string` (required) + `src?: string` (default `''`) |
| Gallery item | `src: string` (required) | `imageQuery: string` (required) + `src?: string` (default `''`) |
| CardSchema | `imageSrc?: string` | `imageQuery?: string` + `imageSrc?: string` |

### imageQuery Pflicht vs. Optional
- **Pflichtfeld** bei Modulen die immer ein Bild zeigen: `MediaText`, `ImageBlock`, `Gallery`-Items
- **Optionales Feld** bei Modulen wo Bild optional ist: `HeroBanner`, `CardSchema`

### imageFiller Vereinfachung
- `collectFromBlock` liest `props.imageQuery` statt aus Alt/Heading zu extrahieren
- `buildQuery()` und `tokenize()` werden nicht mehr benötigt → entfernen
- `extractContext()` aus User-Prompt bleibt als globaler Kontext-Boost (optional)

## 5. Beachtenswertes

### Backward Compatibility
Bestehende Specs in localStorage die noch `imageSrc` URLs enthalten aber kein `imageQuery` müssen weiterhin rendern. Da URL-Felder optional mit Default `''` werden und `imageQuery` ebenfalls optional (oder fehlt in alten Specs), muss `imageFiller` graceful mit fehlendem `imageQuery` umgehen — in diesem Fall Slot überspringen (URL bleibt wie sie ist).

### EditableImage leeres src
`<img src="">` löst einen Browser-Request auf die aktuelle Seite aus und zeigt ein gebrochenes Bild-Icon. Bei leerem src komplett kein `<img>` rendern — nur den Wrapper.

### JSON Schema propagation
`imageQuery` braucht einen präzisen JSDoc-Kommentar im Zod-Schema. `z.toJSONSchema()` übernimmt Kommentare als `description` ins JSON Schema, das dann direkt im System-Prompt landet → Modell wird korrekt instruiert.

## 6. Abhängigkeiten

**Voraussetzungen:** — (keine)

**Betroffene Features:**
- Edit Mode: `useEditableImage` arbeitet mit `path` zum Prop. Pfade ändern sich nicht (imageSrc/src/backgroundImage bleiben als Felder erhalten).
- `validateSpec`: Zod-Validierung greift automatisch mit neuen Schemas.

**Externe Abhängigkeiten:** — keine neuen Packages

## 7. Nicht-Ziele

- Keine Änderungen am Edit-Mode-Verhalten für Bilder
- Keine neue Image-Upload-Funktionalität
- `imageQuery` wird nach dem Fill-Schritt nicht aus der Spec entfernt (kein Cleanup nötig)

## 8. Offene Fragen

- [x] Soll `imageQuery` nach dem Filler-Schritt aus der Spec gelöscht werden? → Nein, unnötige Komplexität

---

## 9. Was muss weg (Impact-Analyse)

> **Hinweis:** Diese Sektion wird vom `impact-analyzer` Agent automatisch befüllt.

### 9.1 Zu löschende Dateien
| Datei | Grund für Löschung |
|-------|-------------------|
| — | Keine Dateien werden gelöscht |

### 9.2 Zu löschender Code (Methoden, Klassen, Funktionen)
| Datei | Element | Grund |
|-------|---------|-------|
| `src/llm/imageFiller.ts` | `buildQuery()` | Keyword-Extraktion nicht mehr nötig |
| `src/llm/imageFiller.ts` | `tokenize()` | Keyword-Extraktion nicht mehr nötig |
| `src/llm/imageFiller.ts` | `transliterate()` | Keyword-Extraktion nicht mehr nötig |
| `src/llm/imageFiller.ts` | `extractContext()` | Globaler Kontext-Boost optional, kann entfallen |
| `src/llm/imageFiller.ts` | `export { buildImageQuery, tokenizeKeyword }` | Test-Exports für gelöschte Funktionen |

### 9.3 Veraltete Patterns die ersetzt werden
| Altes Pattern | Neues Pattern | Betroffene Stellen |
|---------------|---------------|-------------------|
| Keyword-Extraktion aus alt/heading/body | `props.imageQuery` direkt lesen | `imageFiller.ts collectFromBlock()` |
| `imageSrc`/`src` als Pflichtfeld (LLM muss URL liefern) | `imageQuery` als Pflichtfeld, URL optional | MediaText, ImageBlock, Gallery schemas |

---

## 10. Betroffene Aufrufer (Impact-Analyse)

### 10.1 Direkte Aufrufer
| Datei | Zeile | Aktueller Aufruf | Muss geändert zu |
|-------|-------|------------------|------------------|
| `src/llm/imageFiller.ts` | ~88 | `buildQuery(slot.keywordHint, globalContext)` | `slot.imageQuery` direkt (kein buildQuery) |
| `src/llm/imageFiller.ts` | ~59 | `extractContext(userPrompt)` | entfernen |
| `src/llm/imageFiller.ts` | Export | `buildImageQuery`, `tokenizeKeyword` | entfernen |

### 10.2 Transitive Aufrufer
| Datei | Aufrufkette | Muss geändert werden? |
|-------|-------------|----------------------|
| `src/llm/imageFiller.test.ts` | `buildImageQuery`, `tokenizeKeyword` Tests | Ja — Tests auf neue Logik anpassen |

### 10.3 Betroffene Tests
| Test-Datei | Beschreibung | Anpassung nötig |
|------------|--------------|-----------------|
| `src/llm/imageFiller.test.ts` (falls vorhanden) | Tests für `buildImageQuery`/`tokenizeKeyword` | Ersetzen durch Tests für imageQuery-Durchleitung |
| `src/elements/schemas.test.ts` | Schema-Validierungstests | imageQuery in Testdaten ergänzen |

---

## 11. Akzeptanzkriterien

### Funktionale Kriterien
- [ ] LLM-generierte Specs enthalten `imageQuery` Felder, keine Bild-URLs
- [ ] `fillImages` nutzt `imageQuery` direkt als Suchbegriff
- [ ] Bestehende Specs ohne `imageQuery` rendern weiterhin (URL bleibt erhalten)
- [ ] `EditableImage` zeigt kein kaputtes Bild-Icon bei leerem src

### Technische Kriterien
- [ ] Kein `buildQuery`/`tokenize`/`transliterate` mehr im Code
- [ ] Build läuft fehlerfrei (`tsc -b && vite build`)
- [ ] Tests grün (`vitest run`)
- [ ] Keine URL-Pflichtfelder mehr in Bild-Schemas

### Qualitätskriterien
- [ ] JSDoc auf `imageQuery` ist präzise genug dass LLM das Feld korrekt füllt
- [ ] Kein alter Code auskommentiert, direkt gelöscht

---

## 12. Nächste Schritte

1. Impact-Analyse bestätigen (Sektionen 9+10 oben bereits vorausgefüllt)
2. Implementierungsplan erstellen
3. Implementierung via `/execute`

---

*Erstellt am: 2026-04-14*
