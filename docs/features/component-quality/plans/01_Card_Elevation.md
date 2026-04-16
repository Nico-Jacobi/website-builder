# Component Quality - Plan 01: Card Elevation

## Übersicht

| Aspekt | Details |
|--------|---------|
| **Ziel** | `.card` in `src/App.css` mit `background: var(--surface)` + `box-shadow` versehen |
| **Abhängig von** | — (keine Vorgänger) |
| **Betroffene Bereiche** | Shared CSS (App.css) |
| **Geschätzte Komplexität** | Niedrig |

### Größen-Check

| Metrik | Wert | Schwellwert |
|--------|------|-------------|
| Implementierungsschritte | 1 | >8 → Sub-Pläne |
| Neue Dateien | 0 | >5 → Sub-Pläne |
| Zu ändernde Dateien | 1 | >10 → Sub-Pläne |

## Schnittstellen

### Inputs
Keine Vorbedingung.

### Outputs
`.card` hat visuell Elevation — CardRow + CardGrid erhalten automatisch Schatten.

## Voraussetzungen
- [ ] Keine

## Betroffene Dateien

### Zu ändernde Dateien
| Datei | Art der Änderung |
|-------|------------------|
| `src/App.css` | `.card` bekommt `background` + `box-shadow` |

## Implementierung

### Schritt 1: `.card` CSS erweitern

**Datei:** `src/App.css`

**Änderung:** Die `.card`-Klasse (Z. 29–36) erweitern:

```css
/* Shared image-title-body card used by CardRow and CardGrid */
.card {
    display: flex;
    flex-direction: column;
    gap: var(--space_sm);
    border-radius: var(--radius_md);
    overflow: hidden;
    padding-bottom: var(--space_md);
    background-color: var(--surface);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
```

**Erklärung:**
- `background-color: var(--surface)` — Karte hebt sich vom Hintergrund ab, egal ob muted/surface Tone
- `box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08)` — subtiler Schatten, nicht aufdringlich
- `overflow: hidden` bleibt (ist bereits da) — sorgt dafür dass abgerundete Ecken korrekt wirken
- Auf `primary`/`dark` Tone-Hintergründen könnte der Schatten falsch wirken → Risiko dokumentiert im Masterplan, kann später mit `[data-tone="primary"] .card { box-shadow: none }` gefixt werden

---

## Aufrufer umstellen

Keine — `.card` ist eine CSS-Klasse, keine Funktion/Variable. CardRow und CardGrid nutzen automatisch die neue Elevation über das gemeinsame `<Card>`-Component.

---

## Validierung

### Manuelle Tests
- [ ] Im Browser: CardRow/CardGrid mit `tone: "muted"` → Karten heben sich mit Schatten vom muted-Hintergrund ab
- [ ] Im Browser: CardRow/CardGrid mit `tone: "surface"` → Karten sind sichtbar (Schatten reicht aus)
- [ ] Im Browser: CardRow/CardGrid mit `tone: "primary"` (falls vorhanden) → Karten sichtbar oder Schatten zu dezent? (Notiz für Rollback)

### Erwartetes Verhalten
Karten wirken jetzt wie eigenständige Objekte, nicht wie Patches auf dem Hintergrund.

## Rollback-Plan

1. `background-color: var(--surface)` aus `.card` entfernen
2. `box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08)` aus `.card` entfernen

---

*Status: Ausstehend*
*Erstellt am: 2026-04-16*
