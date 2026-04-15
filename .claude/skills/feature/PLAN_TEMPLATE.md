# Implementierungsplan Template

Verwende dieses Template für `docs/features/{feature}/plans/XX_{name}.md`

**Sub-Plan Konvention:** Bei zu großen Plänen → `04.1_Name.md`, `04.2_Name.md`, etc.

---

# {Feature} - Plan {XX}: {Teilschritt-Name}

## Übersicht

| Aspekt | Details |
|--------|---------|
| **Ziel** | <!-- Was wird in diesem Schritt erreicht? --> |
| **Abhängig von** | Plan 01, Plan 02, ... |
| **Betroffene Bereiche** | Backend / Frontend / Shared / Database |
| **Geschätzte Komplexität** | Niedrig / Mittel / Hoch |

### Größen-Check (für Sub-Plan Entscheidung)
| Metrik | Wert | Schwellwert |
|--------|------|-------------|
| Implementierungsschritte | ? | >8 → Sub-Pläne |
| Neue Dateien | ? | >5 → Sub-Pläne |
| Zu ändernde Dateien | ? | >10 → Sub-Pläne |

> **Wenn ein Schwellwert überschritten:** `subplan-creator` Agent starten!

#### Zählregeln (verbindlich)

**Implementierungsschritte zählen:**
- Jeder `### Schritt N:` Header = 1 Schritt
- Sub-Punkte innerhalb eines Schritts zählen NICHT separat
- "Aufrufer umstellen" Sektion = 1 Schritt (egal wie viele Aufrufer)
- "Validierung" Sektion = 0 Schritte (ist Prüfung, nicht Implementierung)

**Neue Dateien zählen:**
- Jede Source-Datei = 1
- Test-Dateien = NICHT mitgezählt
- Index-Dateien die nur re-exportieren = NICHT mitgezählt
- Typ-/Interface-Dateien = JA mitgezählt

**Zu ändernde Dateien zählen:**
- Nur wenn LOGIK sich ändert (Code, Imports, Typen)
- Kommentar-only Änderungen = NICHT mitgezählt
- Nur Import hinzufügen = JA mitgezählt (ist Abhängigkeit)
- Eine Datei = 1, egal ob 1 Zeile oder 100 Zeilen geändert

## Schnittstellen (Kohärenz-Vertrag)

### Inputs (was dieser Plan von vorherigen erwartet)
| Von Plan | Was wird erwartet | Konkret (Datei / Export / Typ) |
|----------|-------------------|-------------------------------|
| Plan {XX-1} | <!-- z.B. Service existiert --> | <!-- z.B. `src/foo-service` exportiert `FooService` --> |

### Outputs (was dieser Plan für nachfolgende liefert)
| Für Plan | Was wird geliefert | Konkret (Datei / Export / Typ) |
|----------|-------------------|-------------------------------|
| Plan {XX+1} | <!-- z.B. Service mit CRUD --> | <!-- z.B. `src/foo-service` exportiert `FooService.create()` --> |

### Architektur-Entscheidungen (die andere Pläne betreffen)
- ...

## Voraussetzungen

- [ ] Plan {XX-1} abgeschlossen
- [ ] Inputs von Plan {XX-1} verfügbar
- [ ] Benötigte Packages installiert

## Betroffene Dateien

### Neue Dateien
| Datei | Beschreibung |
|-------|--------------|
| `path/to/new/file` | Kurze Beschreibung |

### Zu ändernde Dateien
| Datei | Art der Änderung |
|-------|------------------|
| `path/to/existing` | Neue Methode hinzufügen |

### Zu löschende Dateien/Code
| Datei | Was wird gelöscht | Grund |
|-------|-------------------|-------|
| `path/to/old` | Ganze Datei / Methode X | Ersetzt durch Y |

## Implementierung

### Schritt 1: {Beschreibung}

**Datei:** `path/to/file`

**Änderung:**
```
// Code-Beispiel oder Pseudocode
```

**Erklärung:**
<!-- Warum diese Änderung? -->

### Schritt 2: {Beschreibung}

...

---

## Aufrufer umstellen

| Datei | Zeile | Alter Aufruf | Neuer Aufruf |
|-------|-------|--------------|--------------|
| `path/to/caller` | 42 | `oldMethod()` | `newMethod()` |

---

## Validierung

### Manuelle Tests
- [ ] Test 1: Beschreibung
- [ ] Test 2: Beschreibung

### Automatisierte Tests
```bash
# Projektspezifischen Test-Command ausführen
```

### Erwartetes Verhalten
<!-- Was sollte nach diesem Plan funktionieren? -->

## Rollback-Plan

Falls dieser Schritt fehlschlägt:
1. ...
2. ...

---

*Status: Ausstehend / In Arbeit / Abgeschlossen*
*Erstellt am: {Datum}*