---
name: feature
description: Strukturierte Feature-Entwicklung in zwei Phasen. Phase 1 erstellt einen Masterplan (Ziele, Architektur, Beachtenswertes). Phase 2 recherchiert Best Practices und erstellt konkrete Implementierungspläne. Verwende diesen Skill wenn der Nutzer ein neues Feature planen will, "neues Feature", "Feature hinzufügen", oder "/feature" sagt.
allowed-tools: Read, Write, Glob, Grep, Task, WebSearch, WebFetch, AskUserQuestion
---

# Feature Planning Workflow

## Kontext

- **Wichtig:** Refactoring erwünscht, alter Code löschen, nicht umgehen

## Workflow (5 Phasen)

1. **Phase 1: Masterplan** → Ziele, Architektur, Sektionen 1-8 erstellen
2. **Phase 1b: Impact-Analyse** → `impact-analyzer` Agent findet zu löschenden Code + Aufrufer
3. **Phase 2: Implementierungspläne** → Konkrete Pläne erstellen, Größen-Check pro Plan
4. **Phase 2b: Sub-Pläne** → Wenn Plan zu groß: `subplan-creator` Agent teilt auf
5. **Phase 2c: Kohärenz-Check** → Prüft ob alle Pläne zusammenpassen

---

## Phase 1: Masterplan

1. Feature-Ordner erstellen: `docs/features/{feature-name}/`
2. Mit Nutzer Ziele brainstormen
3. Bestehenden Code analysieren (Task/Explore)
4. `Masterplan.md` erstellen mit Sektionen 1-8 (siehe MASTERPLAN_TEMPLATE.md)
5. Review mit Nutzer → Freigabe

---

## Phase 1b: Impact-Analyse

**Trigger:** Nutzer gibt Masterplan frei → explizit fragen:
> "Masterplan steht. Soll ich jetzt die Impact-Analyse starten? (Findet zu löschenden Code + alle Aufrufer)"

Erst nach Bestätigung starten.

> Siehe [IMPACT_ANALYZER_PROMPT.md](IMPACT_ANALYZER_PROMPT.md) für vollständigen Prompt.

---

## Phase 2: Implementierungspläne

1. Plans-Ordner erstellen: `docs/features/{feature}/plans/`
2. Recherche (Best Practices, Patterns)
3. Pläne erstellen: `01_Foundation.md`, `02_Backend.md`, etc.
4. **Größen-Check pro Plan** (siehe unten)

### Größen-Check Schwellwerte

| Metrik | Schwellwert | Wenn überschritten |
|--------|-------------|-------------------|
| Implementierungsschritte | >8 | Sub-Pläne erstellen |
| Neue Dateien | >5 | Sub-Pläne erstellen |
| Zu ändernde Dateien | >10 | Sub-Pläne erstellen |

> Siehe [SUBPLAN_CREATOR_PROMPT.md](SUBPLAN_CREATOR_PROMPT.md) für vollständigen Prompt.

---

## Phase 2c: Kohärenz-Check

Nachdem ALLE Pläne erstellt sind (inkl. Sub-Pläne), IMMER ausführen.

Prüft:
1. Schnittstellen-Validierung (Inputs/Outputs zwischen Plänen)
2. Architektur-Konsistenz
3. Vollständigkeit

**Bei Problemen:**
- Kleine Inkonsistenzen: Direkt in betroffenen Plänen fixen
- Größere Widersprüche: Mit Nutzer besprechen

---

## Datei-Struktur

```
docs/features/{feature}/
├── Masterplan.md        # Sektionen 1-11
├── plans/
│   ├── 01_Foundation.md
│   ├── 02_Backend.md
│   ├── 03.1_Frontend_Types.md   # Sub-Plan
│   ├── 03.2_Frontend_UI.md      # Sub-Plan
│   └── ...
└── notes/               # Optional: Recherche
```

---

## Checkliste

### Phase 1
- [ ] Feature-Ordner erstellt
- [ ] Ziele mit Nutzer besprochen
- [ ] Masterplan Sektionen 1-8 fertig
- [ ] Review mit Nutzer

### Phase 1b
- [ ] Impact-Analyzer ausgeführt
- [ ] Sektion 9 (Was muss weg) befüllt
- [ ] Sektion 10 (Aufrufer) befüllt
- [ ] Sektion 11 (Akzeptanzkriterien) definiert

### Phase 2
- [ ] Recherche durchgeführt
- [ ] Pläne erstellt (mit Schnittstellen-Sektion!)
- [ ] Größen-Check für jeden Plan
- [ ] Sub-Pläne erstellt (falls nötig)
- [ ] **Kohärenz-Check bestanden**
- [ ] Bereit für `/execute`

---

## Templates

- [MASTERPLAN_TEMPLATE.md](MASTERPLAN_TEMPLATE.md)
- [PLAN_TEMPLATE.md](PLAN_TEMPLATE.md)
- [IMPACT_ANALYZER_PROMPT.md](IMPACT_ANALYZER_PROMPT.md)
- [SUBPLAN_CREATOR_PROMPT.md](SUBPLAN_CREATOR_PROMPT.md)
