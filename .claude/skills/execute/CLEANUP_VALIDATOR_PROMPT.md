# Cleanup Validator Agent Prompt

> **Verwendung:** Am Ende von `/execute` automatisch starten.
> **Subagent Type:** `general-purpose`

## Aufruf

```
Task(subagent_type="general-purpose", prompt="
Cleanup-Validierung für Feature '{feature}'

MASTERPLAN_PATH: docs/features/{feature}/Masterplan.md
CONTEXT_PATH: docs/features/{feature}/context.json

## Prüfungen

1. **Sektion 9:** Alter Code gelöscht?
   - Prüfe ob Dateien aus 9.1 noch existieren
   - Prüfe ob Methoden aus 9.2 noch vorhanden (grep)

2. **Sektion 10:** Aufrufer umgestellt?
   - grep nach alten Methodennamen
   - Keine alten Aufrufe mehr vorhanden?

3. **Sektion 11:** Akzeptanzkriterien erfüllt?

4. **Build erfolgreich?**
   Projektspezifischen Build-Command ausführen

5. **Keine TODOs?**
   grep -rn '// TODO' path/to/new/files/

## Kategorisierung & Aktion

### Kategorie A: DIREKT FIXEN (max. 5 Zeilen pro Fix)
- Fehlender Import
- Tippfehler in Variablen
- Fehlende Typ-Annotation
- Vergessener Export
- 1-2 Aufrufer umstellen

### Kategorie B: NUR MELDEN (nicht selbst fixen)
- Datei nicht gelöscht
- >2 Aufrufer noch offen
- Inkonsistentes Pattern
- Tests nicht angepasst
- Breaking API Change

**Regel:** Im Zweifel = Kategorie B

## Output

STATUS: SUCCESS | PROBLEMS_FOUND

CHECKED:
- [x] Alter Code gelöscht: X/Y
- [x] Aufrufer umgestellt: X/Y
- [x] Build: OK/FEHLER
- [x] TODOs: 0 gefunden

AUTO_FIXED (Kategorie A):
- file:42 - Fehlender Import

PROBLEMS (Kategorie B):
1. Problem: [Beschreibung]
   Datei: [Pfad]
   Empfehlung: [Was tun]
")
```

## Nach Validierung

**Bei SUCCESS:** Feature kann abgeschlossen werden.

**Bei PROBLEMS_FOUND:**
- Architektur-Probleme dem Nutzer zeigen
- Fragen ob beheben oder trotzdem abschließen
