---
name: refactor
description: Orchestrator für Code-Analyse und Refactoring. Untersucht Funktionsbereiche mit spezialisierten Agenten, identifiziert Duplikation und Anti-Patterns, erstellt strukturierte Refactoring-Pläne. Verwende wenn der Nutzer "Code analysieren", "Refactoring", "Duplikation finden", "Architektur verbessern", oder "/refactor" sagt.
allowed-tools: Read, Write, Edit, Glob, Grep, Task, WebSearch, WebFetch, AskUserQuestion, TodoWrite
---

# Architecture Review - Orchestrator

Dieser Skill koordiniert die systematische Analyse und Verbesserung von Code-Bereichen.

## Workflow-Übersicht

```
PHASE 1: ANALYSE
1. Bereich vom Nutzer erfragen
2. Code-Analyzer Agent → Struktur-Übersicht
3. Pattern-Detector Agent → Duplikation & Anti-Patterns
4. Dependency-Mapper Agent → Abhängigkeiten
5. Analyse-Report erstellen
6. PAUSE → Mit Nutzer besprechen

PHASE 2: REFACTORING-PLÄNE
7. Probleme priorisieren (mit Nutzer)
8. Refactoring-Pläne erstellen
9. Review mit Nutzer
```

## Phase 1: Analyse

### Schritt 1: Bereich definieren

Frage den Nutzer nach dem zu analysierenden Bereich.

### Schritt 2: Code-Analyzer Agent

Delegiere an `code-analyzer` Agent für Struktur-Übersicht.

### Schritt 3: Pattern-Detector Agent

Delegiere an `pattern-detector` Agent für Duplikation & Anti-Patterns.

### Schritt 4: Dependency-Mapper Agent

Delegiere an `dependency-mapper` Agent für Abhängigkeiten.

### Schritt 5: Analyse-Report erstellen

Erstelle `docs/refactoring/{bereich}/Analysis.md`

### Schritt 6: Mit Nutzer besprechen

```
ANALYSE ABGESCHLOSSEN für Bereich "{bereich}"

Gefundene Probleme:
- {X} kritisch
- {Y} mittel
- {Z} niedrig

Soll ich:
a) Details zu einem Problem zeigen?
b) Mit Phase 2 (Refactoring-Pläne) fortfahren?
c) Anderen Bereich analysieren?
```

## Phase 2: Refactoring-Pläne

### Schritt 7: Probleme priorisieren

Nutzer wählt welche Probleme behoben werden sollen.

### Schritt 8: Refactoring-Pläne erstellen

Jeder Plan folgt dem REFACTOR_PLAN_TEMPLATE.md

### Schritt 9: Review mit Nutzer

## Wichtige Regeln

1. **IMMER Agenten für Detail-Analyse nutzen** - Halte den Orchestrator-Kontext frei
2. **IMMER nach Analyse pausieren** - Nutzer entscheidet über nächste Schritte
3. **IMMER Probleme priorisieren lassen** - Nicht alles auf einmal
4. **IMMER Risiko einschätzen** - Bei jedem Refactoring-Plan
5. **NIE direkt Code ändern** - Dieser Skill erstellt nur Pläne
6. **NIE Annahmen über Priorität** - Nutzer entscheidet was wichtig ist

## Templates

Siehe [ANALYSIS_TEMPLATE.md](ANALYSIS_TEMPLATE.md) für das Analyse-Report-Template.
Siehe [REFACTOR_PLAN_TEMPLATE.md](REFACTOR_PLAN_TEMPLATE.md) für das Refactoring-Plan-Template.
