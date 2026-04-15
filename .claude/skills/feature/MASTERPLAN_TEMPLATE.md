# Masterplan Template

Verwende dieses Template für `docs/features/{feature}/Masterplan.md`

---

# {Feature-Name} - Masterplan

## Status
- [ ] Phase 1: Masterplan (in Arbeit)
- [ ] Phase 1b: Impact-Analyse
- [ ] Phase 2: Implementierungspläne
- [ ] Phase 2b: Sub-Pläne (falls nötig)
- [ ] Implementierung gestartet
- [ ] Cleanup-Validierung
- [ ] Feature abgeschlossen

## 1. Ziel

**Was soll erreicht werden?**
<!-- 2-3 Sätze die das Feature beschreiben -->

**Anwendungsfall:**
<!-- Konkrete Beispiele wie ein Nutzer das Feature verwenden würde -->

## 2. Ist-Zustand

**Aktuelle Implementierung:**
<!-- Falls vorhanden: Wie funktioniert es aktuell? Welche Dateien sind betroffen? -->

**Probleme mit aktuellem Ansatz:**
<!-- Was funktioniert nicht gut? Was fehlt? -->

**Relevante Dateien:**
- `path/to/file` - Beschreibung
- ...

## 3. Soll-Zustand

**Gewünschtes Verhalten:**
<!-- Detaillierte Beschreibung wie es funktionieren soll -->

**User Flow:**
1. Nutzer macht X
2. System reagiert mit Y
3. ...

**Technische Anforderungen:**
- Performance: <!-- z.B. < 100ms Response Time -->
- Skalierbarkeit: <!-- z.B. viele gleichzeitige Nutzer -->

## 4. Architektur-Entscheidungen

### Datenmodell
<!-- Neue Entities? Änderungen an bestehenden? -->

### Kommunikation Frontend-Backend
<!-- REST? WebSocket? GraphQL? Beides? -->

### Caching-Strategie
<!-- Falls relevant: Wie wird gecacht? -->

## 5. Beachtenswertes

### Performance
<!-- Kritische Performance-Aspekte -->

### Sicherheit
<!-- Berechtigungen, Validierung, Injection-Prevention -->

### Migration
<!-- Falls bestehende Daten betroffen: Migrations-Strategie -->

## 6. Abhängigkeiten

**Voraussetzungen:**
<!-- Was muss vorher existieren/funktionieren? -->

**Betroffene Features:**
<!-- Welche anderen Features sind betroffen? -->

**Externe Abhängigkeiten:**
<!-- Neue Packages? Externe Services? -->

## 7. Nicht-Ziele

**Explizit NICHT Teil dieses Features:**
- ...

**Spätere Erweiterungen (out of scope):**
- ...

## 8. Offene Fragen

- [ ] Frage 1?
- [ ] Frage 2?

---

## 9. Was muss weg (Impact-Analyse)

> **Hinweis:** Diese Sektion wird vom `impact-analyzer` Agent automatisch befüllt.

### 9.1 Zu löschende Dateien
| Datei | Grund für Löschung |
|-------|-------------------|
| <!-- vom impact-analyzer befüllt --> | |

### 9.2 Zu löschender Code (Methoden, Klassen, Funktionen)
| Datei | Element | Grund |
|-------|---------|-------|
| <!-- vom impact-analyzer befüllt --> | | |

### 9.3 Veraltete Patterns die ersetzt werden
| Altes Pattern | Neues Pattern | Betroffene Stellen |
|---------------|---------------|-------------------|
| <!-- vom impact-analyzer befüllt --> | | |

---

## 10. Betroffene Aufrufer (Impact-Analyse)

> **Hinweis:** Vom `impact-analyzer` Agent befüllt.

### 10.1 Direkte Aufrufer
| Datei | Zeile | Aktueller Aufruf | Muss geändert zu |
|-------|-------|------------------|------------------|
| <!-- vom impact-analyzer befüllt --> | | | |

### 10.2 Transitive Aufrufer
| Datei | Aufrufkette | Muss geändert werden? |
|-------|-------------|----------------------|
| <!-- vom impact-analyzer befüllt --> | | |

### 10.3 Betroffene Tests
| Test-Datei | Beschreibung | Anpassung nötig |
|------------|--------------|-----------------|
| <!-- vom impact-analyzer befüllt --> | | |

---

## 11. Akzeptanzkriterien

> **Wichtig:** Das Feature ist erst fertig wenn ALLE Kriterien erfüllt sind.
> Der `cleanup-validator` prüft diese am Ende automatisch.

### Funktionale Kriterien
- [ ] {Kriterium 1 - vom Nutzer definiert}
- [ ] {Kriterium 2 - vom Nutzer definiert}

### Technische Kriterien (automatisch geprüft)
- [ ] Kein alter Code mehr vorhanden (alle Einträge aus Sektion 9 gelöscht)
- [ ] Alle Aufrufer umgestellt (alle Einträge aus Sektion 10 erledigt)
- [ ] Build läuft fehlerfrei
- [ ] Keine `// TODO` Kommentare im neuen Code
- [ ] Keine auskommentierten Code-Blöcke
- [ ] Alle neuen Dateien haben korrekte Imports

### Qualitätskriterien
- [ ] Code folgt bestehenden Patterns im Codebase
- [ ] Keine Duplikation eingeführt
- [ ] Performance-Anforderungen erfüllt

---

## 12. Nächste Schritte

Nach Freigabe dieses Masterplans:
1. `impact-analyzer` ausführen → Sektionen 9 + 10 befüllen
2. Recherche zu Best Practices
3. Erstellung der Implementierungspläne in `plans/`
4. Plan-Größe prüfen → ggf. Sub-Pläne erstellen
5. Review der Pläne
6. Start der Implementierung
7. `cleanup-validator` am Ende

---

*Erstellt am: {Datum}*
*Letzte Aktualisierung: {Datum}*