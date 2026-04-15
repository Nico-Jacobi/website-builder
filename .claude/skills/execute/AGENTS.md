# Agent-Delegation Templates

Diese Datei enthält die vollständigen Prompts für die spezialisierten Agenten.

## Backend-Executor

```
Task(subagent_type="backend-executor", prompt="
AUFGABE: Implementiere Plan '{plan-name}'

PLAN_PATH: docs/features/{feature}/plans/{plan}.md
CONTEXT_PATH: docs/features/{feature}/context.json
MASTERPLAN_PATH: docs/features/{feature}/Masterplan.md

## Anweisungen

1. Lies MASTERPLAN komplett:
   - Sektion 9: Was muss gelöscht werden
   - Sektion 10: Welche Aufrufer umstellen
   - Sektion 11: Akzeptanzkriterien

2. Lies PLAN für konkrete Schritte

3. Implementiere:
   - Neuen Code erstellen
   - ALTEN CODE LÖSCHEN (nicht umgehen!)
   - AUFRUFER UMSTELLEN (alle aus dem Plan!)

4. Validiere: Build/Lint Check

5. Gib kompaktes Ergebnis zurück (siehe Output-Format)
")
```

## Frontend-Executor

```
Task(subagent_type="frontend-executor", prompt="
AUFGABE: Implementiere Plan '{plan-name}'

PLAN_PATH: docs/features/{feature}/plans/{plan}.md
CONTEXT_PATH: docs/features/{feature}/context.json
MASTERPLAN_PATH: docs/features/{feature}/Masterplan.md

## Anweisungen

1. Lies MASTERPLAN (Sektion 9, 10, 11)
2. Lies PLAN für konkrete Schritte
3. Implementiere UI Components/Views
4. ALTEN CODE LÖSCHEN, AUFRUFER UMSTELLEN
5. Validiere: Build/Lint Check
")
```

## Shared-Executor

```
Task(subagent_type="shared-executor", prompt="
AUFGABE: Implementiere Plan '{plan-name}'

PLAN_PATH: docs/features/{feature}/plans/{plan}.md
CONTEXT_PATH: docs/features/{feature}/context.json
MASTERPLAN_PATH: docs/features/{feature}/Masterplan.md

Erstelle Shared Types/Utils.
Lies Masterplan Sektion 9+10!
Validiere: Build Check
")
```

## Test-Executor

```
Task(subagent_type="test-executor", prompt="
AUFGABE: Implementiere Plan '{plan-name}'

PLAN_PATH: docs/features/{feature}/plans/{plan}.md
CONTEXT_PATH: docs/features/{feature}/context.json
MASTERPLAN_PATH: docs/features/{feature}/Masterplan.md

Schreibe und führe Tests aus.
Lies Masterplan Sektion 10.3 für betroffene Tests!
")
```

## Agent Output-Format

Alle Agenten geben zurück:

```
STATUS: SUCCESS | FAILED

FILES_CREATED:
- path/to/new-file

FILES_DELETED:
- path/to/old-file

FILES_CHANGED:
- path/to/existing-file

NEW_EXPORTS:
services: [ServiceName.method()]
types: [TypeName]

CALLERS_UPDATED:
- path/to/caller:42

VALIDATION: PASSED | FAILED (reason)
```
