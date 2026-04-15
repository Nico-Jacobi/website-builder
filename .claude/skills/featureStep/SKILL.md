---
name: featureStep
description: Ergänzt ein bestehendes Feature um kleine Anpassungen/Erweiterungen im Gesamtkontext. Lädt Masterplan + alle Pläne, erstellt Mini-Plan, setzt direkt um. Verwende wenn der Nutzer "Feature erweitern", "kleiner Step", "Anpassung an Feature", oder "/featureStep" sagt.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task, AskUserQuestion
---

# Feature Step - Kleine Feature-Erweiterungen

Ergänzt ein bestehendes Feature um kleine Anpassungen/Erweiterungen im Gesamtkontext.

## Verwendung

```
/featureStep <feature-name>
<deine Beschreibung was du noch haben willst>
```

## Workflow

```
1. KONTEXT LADEN
   ├─ Masterplan.md lesen (Ziele, Architektur)
   ├─ Alle bisherigen Plans lesen (was wurde gemacht)
   ├─ progress.json laden (Entscheidungen, Status)
   └─ Aktuellen Code-Stand verstehen

2. ANFORDERUNG ANALYSIEREN
   ├─ Was will der Nutzer?
   ├─ Passt es zum Masterplan? (Ziele vs. Nicht-Ziele)
   ├─ Welche Bereiche betroffen? (Backend/Frontend/etc.)
   └─ Abhängigkeiten zu bestehendem Code?

3. MINI-PLAN ERSTELLEN
   ├─ Nächste freie Nummer finden
   ├─ Fokussierten Plan schreiben
   ├─ Plan zur Bestätigung zeigen
   └─ Bei OK: Plan speichern unter plans/

4. DIREKT UMSETZEN
   ├─ Passenden Agent delegieren
   ├─ Bei Architektur-Fragen: PAUSE
   ├─ progress.json aktualisieren
   └─ Ergebnis zusammenfassen
```

## Nummerierung

Der Skill findet automatisch die nächste freie Nummer:

```
Bestehend:           Neu:
01_Foundation.md
02_Backend.md
03_Frontend.md
04_Testing.md
                     → 05_NewFeature.md (neue Hauptnummer)

ODER bei Sub-Feature zu bestehendem Plan:

01_Foundation.md
01.1_Utils.md        (existiert schon)
                     → 01.2_ResetButton.md (Sub-Nummer)
```

## Warnung bei Scope-Creep

Wenn die Anforderung zu groß wird:
```
"Diese Anforderung ist umfangreicher als ein einzelner Step.
Empfehlung: Nutze /feature {name} um einen neuen Masterplan zu erstellen.
Oder teile in mehrere /featureStep Aufrufe auf."
```

## Instruktionen

1. **IMMER zuerst Kontext laden:**
   - `docs/features/{feature}/Masterplan.md`
   - Alle `docs/features/{feature}/plans/*.md`
   - `docs/features/{feature}/progress.json`

2. **Anforderung gegen Masterplan prüfen:**
   - Passt zu Zielen? → Weitermachen
   - Ist explizit in Nicht-Zielen? → Warnen, nachfragen
   - Zu groß für einen Step? → /feature empfehlen

3. **Mini-Plan erstellen:**
   - Kurz und fokussiert (max 5-6 Schritte)
   - Konkrete Dateien benennen
   - Zur Bestätigung zeigen

4. **Nach Bestätigung umsetzen:**
   - Passenden Agent nutzen
   - progress.json aktualisieren
   - Plan-Datei speichern

5. **Bei mehreren Wünschen in einer Anfrage:**
   - In separate Steps aufteilen
   - Nacheinander abarbeiten
