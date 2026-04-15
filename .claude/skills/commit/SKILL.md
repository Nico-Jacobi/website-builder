---
name: commit
description: Schaut sich alle uncommitteten Änderungen an und erstellt daraus einen oder mehrere thematisch gruppierte Commits. Schnell, pragmatisch – keine perfekte Trennung nötig. Verwende wenn der Nutzer "committen", "commit machen", oder "/commit" sagt.
allowed-tools: Bash
---

# Auto-Commit Workflow

Schau dir alle Änderungen an und committe sie thematisch gruppiert. Schnell und pragmatisch – keine perfekte Trennung nötig.

## Workflow

1. **Status holen:**
   ```bash
   git status
   git diff --stat HEAD
   ```

2. **Änderungen grob verstehen:**
   ```bash
   git diff --name-only HEAD
   ```
   Überblick verschaffen: Welche Bereiche wurden angefasst?

3. **Themen identifizieren** (schnell, pragmatisch):
   - Dateipfade nach Bereich gruppieren
   - Wenn alles zum gleichen Thema gehört → ein Commit
   - Wenn klar unterschiedliche Bereiche → mehrere Commits
   - Nicht übertreiben: Lieber einen Commit zu viel zusammenfassen als 10 mini Commits

4. **Commits erstellen:**
   - Dateien zum Thema stagen: `git add <files>`
   - Commit mit kurzem, treffendem Message: `git commit -m "..."`
   - Message-Format: `<typ>: <kurze Beschreibung>` (feat / fix / refactor / chore / docs)
   - Kein Co-Author-Tag nötig

5. **Rest committen:**
   - Wenn noch unstaged Änderungen → weiterer Commit für verbleibenden Bereich
   - Am Ende: `git status` prüfen ob alles committed

6. **Statistik ausgeben:**
   - Nach dem letzten Commit: Für jeden erstellten Commit `git show --stat <hash>` ausführen
   - Format:
     ```
     Commit-Statistik:
     --------------------
     <commit-msg> — <N> files, +<ins> -<del>
     --------------------
     Gesamt: <N> commits, <N> files changed, +<ins> -<del>
     ```

## Regeln

- **Kein Push** ohne explizite Aufforderung
- **Nicht fragen** bevor committed wird – einfach machen
- Lieber pragmatisch als perfekt – ein "misc fixes" Commit ist okay
- Neue/unbekannte Dateien (.env, Secrets, Binary-Dateien) **überspringen** und erwähnen
- Bei nur wenigen Änderungen ohne klare Trennung: **ein einziger Commit** ist völlig fine

## Beispiel-Messages

```
feat: relation view-selector und aggregate rendering
fix: sidebar navigation und misc ui fixes
refactor: field-type-consolidation
chore: dependency updates
docs: architecture docs aktualisiert
```
