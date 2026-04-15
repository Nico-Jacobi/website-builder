# Subplan Creator Agent Prompt

> **Verwendung:** Wenn Plan Größen-Schwellwerte überschreitet.
> **Subagent Type:** `general-purpose`

## Schwellwerte

| Metrik | Schwellwert |
|--------|-------------|
| Implementierungsschritte | >8 |
| Neue Dateien | >5 |
| Zu ändernde Dateien | >10 |

## Aufruf

```
Task(subagent_type="general-purpose", prompt="
Teile Plan '{plan}' in Sub-Pläne auf

PLAN_PATH: docs/features/{feature}/plans/{XX}_{name}.md
MASTERPLAN_PATH: docs/features/{feature}/Masterplan.md

## Schritte

1. Masterplan lesen (Kontext verstehen)
2. Original-Plan analysieren
3. Logische Gruppierungen identifizieren
4. 2-4 Sub-Pläne erstellen

## Namenskonvention

{XX}.1_{name}.md, {XX}.2_{name}.md, etc.

Beispiel für Plan 04:
- 04.1_Types.md
- 04.2_Service.md
- 04.3_Controller.md

## Jeder Sub-Plan enthält

- Klares Teilziel
- 3-6 Schritte (unter Schwellwert!)
- Abhängigkeiten zu anderen Sub-Plänen
- Betroffene Dateien

## Original-Plan aktualisieren

Ersetze Inhalt mit:
# Plan {XX}: {Name}
> Aufgeteilt in Sub-Pläne.

| Sub-Plan | Beschreibung |
|----------|--------------|
| {XX}.1 | ... |
| {XX}.2 | ... |

Abhängigkeiten: {XX}.1 → {XX}.2 → {XX}.3

## Output

SUB_PLANS_CREATED:
- {XX}.1_{name}.md (N Schritte)
- {XX}.2_{name}.md (N Schritte)

DEPENDENCY_ORDER: {XX}.1 → {XX}.2 → {XX}.3
")
```

## Wichtige Regeln

1. **Logische Gruppierung** - Nach Sinn teilen, nicht nach Anzahl
2. **Klare Abhängigkeiten** - Was muss vorher fertig sein?
3. **Unter Schwellwerten** - Jeder Sub-Plan muss kleiner sein
4. **Keine Überlappung** - Jede Datei nur in einem Sub-Plan
