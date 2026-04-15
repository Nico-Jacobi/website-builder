# Refactoring Plan Template

Verwende dieses Template für `docs/refactoring/{bereich}/plans/XX_{name}.md`

---

# {Bereich} - Refactoring Plan {XX}: {Name}

## Übersicht

| Aspekt | Details |
|--------|---------|
| **Ziel** | {Was wird verbessert?} |
| **Problem-Referenz** | Analysis.md → P1/M2/... |
| **Risiko** | Niedrig / Mittel / Hoch |
| **Abhängig von** | Plan 01, Plan 02, ... oder "Keine" |
| **Betroffene Features** | {Welche Features könnten betroffen sein?} |

## Problem-Zusammenfassung

**Aktueller Zustand:**
{Was ist das Problem?}

**Ziel-Zustand:**
{Wie soll es nach dem Refactoring aussehen?}

## Voraussetzungen

- [ ] Plan {XX-1} abgeschlossen (falls abhängig)
- [ ] Tests für betroffene Features existieren
- [ ] Backup/Branch erstellt

## Betroffene Dateien

### Zu ändernde Dateien

| Datei | Art der Änderung | Risiko |
|-------|------------------|--------|
| `path/to/file` | Funktion extrahieren | Niedrig |

### Neue Dateien

| Datei | Beschreibung |
|-------|--------------|
| `path/to/new-util` | Extrahierte gemeinsame Logik |

### Zu löschende Dateien

| Datei | Grund |
|-------|-------|
| `path/to/deprecated` | Ersetzt durch neue Lösung |

## Refactoring-Schritte

### Schritt 1: {Beschreibung}

**Datei:** `path/to/file`

**Vorher:**
```
// Aktueller Code
```

**Nachher:**
```
// Refactored Code
```

**Warum:** {Begründung}

---

### Schritt 2: {Beschreibung}
...

## Validierung

### Automatisierte Tests

```bash
# Projektspezifischen Test-Command ausführen
```

### Manuelle Tests

- [ ] Feature X funktioniert wie vorher
- [ ] Keine Regression

### Regressions-Checkliste

| Feature | Zu testen | Status |
|---------|-----------|--------|
| ... | ... | [ ] |

## Risiko-Bewertung

| Risiko | Wahrscheinlichkeit | Auswirkung | Mitigation |
|--------|-------------------|------------|------------|
| Breaking Change | Niedrig | Hoch | Alle Aufrufer prüfen |

## Rollback-Plan

1. Git revert auf vorherigen Stand
2. ...

---

*Status: Ausstehend / In Arbeit / Abgeschlossen*
*Erstellt am: {Datum}*