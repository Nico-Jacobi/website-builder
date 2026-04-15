---
name: execute
description: Orchestrator für die Umsetzung von Feature-Plänen. Liest Masterplan und Implementierungspläne, delegiert an spezialisierte Agenten (Backend, Frontend, Shared, Test), pausiert nach jedem Plan-Schritt, fragt bei Architektur-Entscheidungen nach. Verwende wenn der Nutzer "Plan umsetzen", "Feature implementieren", "execute plans", oder "/execute" sagt.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task, AskUserQuestion, TodoWrite
---

# Plan Executor - Orchestrator

## Kern-Prinzipien

1. **VOLLEN MASTERPLAN LESEN** - Nicht nur Summary, kompletter Kontext
2. **AGENTEN BEKOMMEN MASTERPLAN_PATH** - Sie lesen selbst
3. **ALTEN CODE LÖSCHEN** - Nicht umgehen, LÖSCHEN
4. **CLEANUP AM ENDE** - Immer cleanup-validator starten

---

## Workflow

### 1. Init

```
Read: docs/features/{feature}/Masterplan.md  # KOMPLETT lesen!
Glob: docs/features/{feature}/plans/*.md     # Alle Pläne finden
```

Wichtige Masterplan-Sektionen:
- **Sektion 9:** Was muss weg (alter Code)
- **Sektion 10:** Aufrufer die umgestellt werden müssen
- **Sektion 11:** Akzeptanzkriterien

**Progress + Context initialisieren:**

Falls `progress.json` nicht existiert → erstellen.
Falls `context.json` nicht existiert → erstellen.
Falls Dateien existieren → laden und fortsetzen (Resume-Support).

### 2. Pro Plan

**a) Größen-Check:** Wenn >8 Schritte / >5 neue Dateien / >10 Änderungen → `subplan-creator`

**b) Agent bestimmen (Prioritätsreihenfolge):**

| Prio | Plan enthält | Agent |
|------|--------------|-------|
| 1 | Entity, DB-Schema, Migration | `backend-executor` |
| 2 | Controller, API-Endpoint | `backend-executor` |
| 3 | Service, Business-Logik | `backend-executor` |
| 4 | NUR Components, Hooks, Pages | `frontend-executor` |
| 5 | NUR Shared Types/Utils | `shared-executor` |
| 6 | NUR Tests | `test-executor` |

Bei gemischten Plänen: Höhere Priorität gewinnt.

**c) Agent aufrufen:**
```
Task(subagent_type="{agent}", prompt="
PLAN_PATH: docs/features/{feature}/plans/{plan}.md
CONTEXT_PATH: docs/features/{feature}/context.json
MASTERPLAN_PATH: docs/features/{feature}/Masterplan.md
Implementiere den Plan. Lies Masterplan Sektion 9+10!
")
```

> Vollständige Prompts siehe [AGENTS.md](AGENTS.md)

**d) Ergebnis verarbeiten:**
- context.json aktualisieren (files, exports, breaking_changes)
- progress.json aktualisieren
- Weiter zum nächsten Plan (nur pausieren bei FAILED)

### 3. Cleanup-Validierung (PFLICHT!)

Nach letztem Plan IMMER starten.

> Vollständiger Prompt siehe [CLEANUP_VALIDATOR_PROMPT.md](CLEANUP_VALIDATOR_PROMPT.md)

### 4. Abschluss

Bei Erfolg:
```
mv docs/features/{feature} docs/features/0_completed/{feature}
```

Bei Problemen: Mit Nutzer besprechen.

---

## Fehlerbehandlung

**Agent meldet FAILED:**
1. Agent erneut versuchen
2. Manuell eingreifen
3. Plan überspringen (nicht empfohlen)
4. Abbrechen

**Plan zu groß zur Laufzeit:**
→ `subplan-creator` starten → Sub-Pläne abarbeiten

---

## Wichtige Regeln

1. Masterplan KOMPLETT lesen (Tokens sind es wert)
2. Alten Code LÖSCHEN (nicht auskommentieren)
3. ALLE Aufrufer umstellen (Sektion 10 = Checkliste)
4. Cleanup-Validator am Ende (IMMER)
5. Kleinigkeiten direkt fixen, Architektur-Probleme melden

---

## Templates

- [AGENTS.md](AGENTS.md) - Agent-Prompts
- [CONTEXT_TEMPLATE.json](CONTEXT_TEMPLATE.json)
- [PROGRESS_TEMPLATE.json](PROGRESS_TEMPLATE.json)
- [CLEANUP_VALIDATOR_PROMPT.md](CLEANUP_VALIDATOR_PROMPT.md)
