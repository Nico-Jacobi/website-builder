# Analysis Template

Verwende dieses Template für `docs/refactoring/{bereich}/Analysis.md`

---

# {Bereich} - Analyse-Report

## Meta

| Aspekt | Details |
|--------|---------|
| **Analysiert am** | {YYYY-MM-DD} |
| **Analysierte Pfade** | {Liste der Pfade} |
| **Dateien gesamt** | {Anzahl} |
| **Lines of Code** | {LOC} |
| **Coupling-Score** | {1-10, 10 = stark gekoppelt} |

## 1. Struktur-Übersicht

### Dateien im Bereich

| Datei | LOC | Hauptverantwortlichkeit | Exports |
|-------|-----|------------------------|---------|
| `path/to/file` | 250 | {Kurze Beschreibung} | `functionA`, `classB` |

## 2. Gefundene Probleme

### Kritisch (Prio 1)

#### P1: {Problem-Titel}

**Beschreibung:** {Was ist das Problem?}

**Betroffene Dateien:**
- `path/to/file1:42-85`

**Auswirkung:** {Warum ist das ein Problem?}

**Empfohlene Lösung:** {Kurze Lösungsidee}

### Mittel (Prio 2)
...

### Niedrig (Prio 3)
...

## 3. Duplikation

### Identische Code-Blöcke

| Block | Vorkommen | LOC | Dateien |
|-------|-----------|-----|---------|
| ... | ... | ... | ... |

## 4. Abhängigkeiten

### Importiert von diesem Bereich

| Modul | Wie oft | Zweck |
|-------|---------|-------|
| ... | ... | ... |

### Wird importiert von

| Modul | Zweck |
|-------|-------|
| ... | ... |

### Zirkuläre Abhängigkeiten
```
{Falls vorhanden}
```

### Coupling-Analyse

- **Afferent Coupling (Ca):** {Anzahl}
- **Efferent Coupling (Ce):** {Anzahl}
- **Instabilität (I = Ce/(Ca+Ce)):** {Wert}

## 5. Empfehlungen

### Sofort (Quick Wins)
1. **{Empfehlung}** - {Begründung}

### Mittelfristig
2. **{Empfehlung}** - {Begründung}

### Langfristig
3. **{Empfehlung}** - {Begründung}

## 6. Nächste Schritte

Nach Freigabe dieser Analyse:

1. [ ] Probleme priorisieren (mit Nutzer)
2. [ ] Refactoring-Pläne erstellen
3. [ ] Pläne reviewen
4. [ ] Implementierung starten

---

*Generiert von: Architecture-Review Orchestrator*
*Datum: {Datum}*