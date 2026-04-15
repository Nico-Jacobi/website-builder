# Impact Analyzer Agent Prompt

> **Verwendung:** Nach Phase 1 (Masterplan), wenn der Nutzer die Freigabe gegeben hat.
> **Subagent Type:** `general-purpose` (braucht Write-Zugriff für Masterplan-Update)

## Aufruf

```
Task(subagent_type="general-purpose", prompt="
Impact-Analyse für Feature '{feature}'

MASTERPLAN_PATH: docs/features/{feature}/Masterplan.md

## Kontext
{Kurze Beschreibung des Features}

## Aufgaben

### 1. Masterplan lesen
Lies den Masterplan komplett. Verstehe Ist-Zustand, Soll-Zustand und Architektur-Entscheidungen.

### 2. Zu löschenden Code finden
- Welche Dateien werden komplett ersetzt?
- Welche Methoden/Klassen werden entfernt?
- Welche veralteten Patterns gibt es?

### 3. Direkte Aufrufer finden
Suche nach allen Stellen die den zu löschenden Code aufrufen.

### 4. Transitive Aufrufer finden (A→B→C)
Für jeden direkten Aufrufer prüfen:
- Wird dieser selbst von anderen genutzt?
- Muss die Signatur geändert werden?

### 5. Betroffene Tests finden
Suche nach Tests die den zu löschenden Code testen.

### 6. Ergebnisse in Masterplan schreiben
Öffne den Masterplan und ERSETZE die Platzhalter in Sektionen 9 und 10 mit den Ergebnissen.

## Output-Format (für Sektionen 9+10 im Masterplan)

### Sektion 9.1: Zu löschende Dateien
| Datei | Grund |
|-------|-------|
| path/to/old | Ersetzt durch new |

### Sektion 10.1: Direkte Aufrufer
| Datei | Zeile | Aufruf | Ändern zu |
|-------|-------|--------|-----------|
| caller | 42 | old() | new() |

### Sektion 10.2: Transitive Aufrufer
| Datei | Kette | Änderung nötig? |
|-------|-------|-----------------|
| A | A→B→C | Ja, Signatur |

### Sektion 10.3: Betroffene Tests
| Test-Datei | Anpassung |
|------------|-----------|
| old-test | Komplett neu |
")
```

## Wichtige Regeln

1. **TRANSITIV suchen** - Nicht bei direkten Aufrufern stoppen
2. **ALLE Stellen finden** - Lieber zu viele als zu wenige
3. **KONKRET sein** - Dateipfade und Zeilennummern
4. **Tests nicht vergessen** - Oft größte Arbeit beim Refactoring
