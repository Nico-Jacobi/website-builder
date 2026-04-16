# Section Tone System - Plan 04: Modul-Cleanup

## Übersicht

| Aspekt | Details |
|--------|---------|
| **Ziel** | `background-color: var(--primary)` aus Header-, Footer- und FooterSimple-CSS entfernen. Das Tone-System übernimmt die Hintergrundfarbe. |
| **Abhängig von** | Plan 03 (Renderer + SectionShell müssen fertig sein, damit die Module nicht kurz "nackt" dastehen) |
| **Betroffene Bereiche** | Frontend (Module) |
| **Geschätzte Komplexität** | Niedrig |

### Größen-Check

| Metrik | Wert | Schwellwert |
|--------|------|-------------|
| Implementierungsschritte | 3 | >8 → Sub-Pläne |
| Neue Dateien | 0 | >5 → Sub-Pläne |
| Zu ändernde Dateien | 3 | >10 → Sub-Pläne |

## Schnittstellen

### Inputs
| Von Plan | Was wird erwartet | Konkret |
|----------|-------------------|---------|
| Plan 03 | Renderer wrappt Blöcke in SectionShell | `block.tone` wird zu `data-tone` am Shell-div |

### Outputs
| Für Plan | Was wird geliefert | Konkret |
|----------|--------------------|---------|
| Plan 05 | Alle Module sind "background-neutral" | LLM muss jetzt `tone` vergeben damit Header/Footer Farbe haben |

### Architektur-Entscheidungen
- **Nur `background-color`** wird entfernt — alle anderen Regeln (color, padding, flex, etc.) bleiben unverändert
- Die Module behalten weiterhin ihre `color: var(--inverted_text)`-Regeln — das ist redundant, aber nicht schädlich. SectionShell setzt `color` auf dem Wrapper, Module setzen es nochmal auf ihren Elementen. Konsistenz ist gewahrt.
- **Kein Fallback in Header-CSS** — der Masterplan hatte erwogen, einen CSS-Fallback zu behalten. Das wird abgelehnt: Ein CSS-Fallback würde das Tone-System für Header/Footer unterlaufen. Stattdessen muss das LLM (Plan 05) sicherstellen, dass Header/Footer immer mit `tone: "primary"` generiert werden. Bestehende Specs ohne `tone` auf dem Header-Block werden transparent (--background-Farbe).

## Voraussetzungen
- [ ] Plan 01 abgeschlossen (tone in BlockSpec)
- [ ] Plan 02 abgeschlossen (SectionShell Komponente)
- [ ] Plan 03 abgeschlossen (Renderer nutzt SectionShell)

## Betroffene Dateien

### Neue Dateien
Keine.

### Zu ändernde Dateien
| Datei | Art der Änderung |
|-------|------------------|
| `src/elements/layout/Header/Header.css` | Zeile mit `background-color: var(--primary)` entfernen |
| `src/elements/layout/Footer/Footer.css` | Zeile mit `background-color: var(--primary)` entfernen |
| `src/elements/layout/FooterSimple/FooterSimple.css` | Zeile mit `background-color: var(--primary)` entfernen |

### Zu löschende Dateien/Code
| Datei | Was wird gelöscht | Zeile |
|-------|-------------------|-------|
| `src/elements/layout/Header/Header.css` | `background-color: var(--primary);` | Z. 6 |
| `src/elements/layout/Footer/Footer.css` | `background-color: var(--primary);` | Z. 3 |
| `src/elements/layout/FooterSimple/FooterSimple.css` | `background-color: var(--primary);` | Z. 9 |

## Implementierung

### Schritt 1: Header.css bereinigen

**Datei:** `src/elements/layout/Header/Header.css`

**Änderung:** Die Zeile `background-color: var(--primary);` (Z. 6) aus dem `.header`-Block entfernen.

Vorher (relevanter Ausschnitt):
```css
.header {
    width: 100%;
    background-color: var(--primary);   /* ← ENTFERNEN */
    color: var(--inverted_text);
    /* ... weitere Regeln ... */
}
```

Nachher:
```css
.header {
    width: 100%;
    color: var(--inverted_text);
    /* ... weitere Regeln ... */
}
```

**Erklärung:** SectionShell mit `tone: "primary"` setzt `background-color: var(--primary)` auf dem Wrapper-div. Das Modul selbst darf keinen eigenen Hintergrund mehr setzen.

---

### Schritt 2: Footer.css bereinigen

**Datei:** `src/elements/layout/Footer/Footer.css`

**Änderung:** Die Zeile `background-color: var(--primary);` (Z. 3) aus dem `.footer`-Block entfernen.

---

### Schritt 3: FooterSimple.css bereinigen

**Datei:** `src/elements/layout/FooterSimple/FooterSimple.css`

**Änderung:** Die Zeile `background-color: var(--primary);` (Z. 9) aus dem `.footer_simple`-Block entfernen.

---

## Aufrufer umstellen

Keine Code-Aufrufer — CSS-only Änderung.

**Wichtige Folgeaktion (für LLM-Specs):** Bestehende Specs (z.B. die Café-Demo) müssen `tone: "primary"` auf `Header`-Blöcken und `tone: "dark"` auf `Footer`/`FooterSimple`-Blöcken bekommen. Das ist die Aufgabe von Plan 05 (LLM-Guidance). Ohne Plan 05 würden Header/Footer in neu generierten Specs keine Hintergrundfarbe haben.

---

## Validierung

### Manuelle Tests
- [ ] Header ohne `tone` im Spec → Header hat keinen farbigen Hintergrund (transparent/global background)
- [ ] Header mit `tone: "primary"` im Spec → Header hat `var(--primary)`-Hintergrund
- [ ] Footer mit `tone: "dark"` im Spec → Footer hat `var(--secondary)`-Hintergrund
- [ ] `color: var(--inverted_text)` auf Header/Footer-Elementen ist weiterhin aktiv (Textfarbe ok)

### Automatisierte Tests
```bash
npx vitest run
```
Alle bestehenden Tests laufen weiterhin grün — die CSS-Änderungen haben keinen Einfluss auf Jest/Vitest-Tests.

### Erwartetes Verhalten
- Header/Footer sind "background-neutral" — ihre Farbe kommt ausschließlich vom `tone`-Feld im Spec
- Alle Texte in Header/Footer bleiben korrekt eingefärbt (via eigene `color`-Regeln in den Modul-CSS-Dateien)

## Rollback-Plan

1. `background-color: var(--primary);` in `Header.css`, `Footer.css`, `FooterSimple.css` wiederherstellen

---

*Status: Ausstehend*
*Erstellt am: 2026-04-16*
