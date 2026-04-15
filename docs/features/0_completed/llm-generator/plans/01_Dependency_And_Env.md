# LLM Generator — Plan 01: Dependency & Env

## Übersicht

| Aspekt | Details |
|--------|---------|
| **Ziel** | `@anthropic-ai/sdk` installieren. `.env.example` + `.gitignore`-Eintrag für `VITE_ANTHROPIC_API_KEY` anlegen. Reine Infra-Setup, kein TS-Code. |
| **Abhängig von** | — (erster Plan) |
| **Betroffene Bereiche** | Build-Config / Dependencies |
| **Geschätzte Komplexität** | Niedrig |

### Größen-Check

| Metrik | Wert | Schwellwert | OK? |
|--------|------|-------------|-----|
| Implementierungsschritte | 3 | >8 | ✓ |
| Neue Dateien | 1 (.env.example) | >5 | ✓ |
| Zu ändernde Dateien | 2 (package.json, .gitignore) | >10 | ✓ |

## Schnittstellen (Kohärenz-Vertrag)

### Inputs

Keine (erster Plan).

### Outputs

| Für Plan | Was wird geliefert |
|----------|---------------------|
| Plan 02 | `@anthropic-ai/sdk` als installierte Dependency — importierbar via `import Anthropic from '@anthropic-ai/sdk';` |
| Plan 02 | `import.meta.env.VITE_ANTHROPIC_API_KEY` liefert den Key (falls in `.env` gesetzt), sonst `undefined` |
| Plan 03 | `.env.example` als Onboarding-Hinweis für Entwickler |

### Architektur-Entscheidungen

- SDK-Version-Pin: **zum Implementierungszeitpunkt latest stabil** (aktuell `^0.50.x` oder höher). Tool-Use + typed messages sind stabil.
- `.env` selbst wird **nicht** committed und **nicht** in diesem Plan angelegt — jeder Entwickler kopiert `.env.example` lokal.

## Voraussetzungen

- [x] `llm-foundation` abgeschlossen.
- [x] `npm` verfügbar.

## Betroffene Dateien

### Neue Dateien

| Datei | Beschreibung |
|-------|--------------|
| `.env.example` | Vorlage mit `VITE_ANTHROPIC_API_KEY=` (leerer Wert) + Kommentar |

### Zu ändernde Dateien

| Datei | Art der Änderung |
|-------|------------------|
| `package.json` | `@anthropic-ai/sdk` unter `dependencies` via `npm install` |
| `.gitignore` | `.env` als zu ignorieren eintragen (falls noch nicht drin) |

### Zu löschende Dateien/Code

Keine.

## Implementierung

### Schritt 1: SDK installieren

```bash
cd c:\Users\Nico\WebstormProjects\website_builder
npm install @anthropic-ai/sdk
```

**Erklärung:** Fügt den offiziellen Anthropic-SDK-Package zu `dependencies` hinzu. `npm` pinnt automatisch mit `^`-Prefix in `package.json`. Nach Abschluss prüfen: `package.json` enthält `"@anthropic-ai/sdk": "^<version>"` und `package-lock.json` wurde aktualisiert.

### Schritt 2: `.env.example` anlegen

**Datei:** `.env.example` (neu, im Projekt-Root)

**Inhalt:**

```
# Anthropic API key for the LLM generator.
# Create one at https://console.anthropic.com/ and paste it here.
# This file (.env) is NOT committed. Copy .env.example to .env and fill in.
#
# ⚠️  Security note: This key is bundled into the client-side build (prefixed
# with VITE_ so Vite exposes it to the browser). Only safe for local dev demos —
# anyone with access to the built bundle can read the key. Do not deploy this
# setup publicly.

VITE_ANTHROPIC_API_KEY=
```

**Erklärung:** Dokumentiert den erwarteten Env-Namen und das Sicherheits-Caveat an der einzigen Stelle, die ein Neuentwickler zuerst sieht.

### Schritt 3: `.gitignore` um `.env` ergänzen

**Datei:** `.gitignore`

Lies die aktuelle Datei. Wenn `.env` noch nicht enthalten ist (weder als Zeile `.env` noch über ein Glob wie `.env*`), füge am Ende eine Zeile hinzu:

```
.env
```

Falls `.env` bereits abgedeckt ist (typischerweise mit `.env*.local` aus Vite-Templates — aber NUR wenn `.env` selbst matcht), keine Änderung nötig. Im Zweifel zusätzlich `.env` explizit eintragen, Dopplung ist harmlos.

**Erklärung:** Verhindert, dass der lokal gesetzte API-Key in git landet.

---

## Aufrufer umstellen

Keine. Reine Infra.

---

## Validierung

### Manuelle Tests

- [ ] `cat package.json` zeigt `@anthropic-ai/sdk` unter `dependencies`.
- [ ] `.env.example` existiert im Projekt-Root, ist committed-ready.
- [ ] `git check-ignore .env` gibt `.env` zurück (oder äquivalent: `.env` wird ignoriert).
- [ ] `npm run build` läuft weiter grün (Dependency-Install sollte keinen Code betreffen).

### Automatisierte Tests

```bash
cd c:\Users\Nico\WebstormProjects\website_builder
npm run build
npm run test
```

Beide müssen grün bleiben. Keine neuen Tests in diesem Plan.

### Erwartetes Verhalten

Keine Verhaltensänderung im Projekt. Die App läuft weiter wie bisher. Der SDK ist verfügbar für Plan 02.

## Rollback-Plan

1. `npm uninstall @anthropic-ai/sdk`
2. `.env.example` löschen.
3. `.gitignore`-Eintrag rückgängig machen (nur wenn wir ihn neu gesetzt haben).

---

*Status: Ausstehend*
*Erstellt am: 2026-04-14*
