# Design

## Context

Siehe `proposal.md` zur Motivation. `Config` in `src/config.ts` besitzt nach Ergänzung der Startenergie 24 numerische Blattwerte einschließlich zweier verschachtelter Artenkonfigurationen; `ticksPerSecond` ist separat konstant. `validateConfig` prüft Zahlenbereiche und gekoppelte Regeln. `src/main.ts` nutzt überall direkt `defaultConfig`; `Playback` hält eine beim Konstruktor gebundene Konfiguration und bietet keinen Konfigurationswechsel. Ein Neustart setzt aktuell nur den Zustand zurück. Es gibt weder Formular noch Persistenz. HTML, CSS und TypeScript verwenden native Browserfunktionen, Browserprüfungen liegen unter `scripts/`.

## Goals / Non-Goals

**Goals:** Eine konsistente aktive Konfiguration für Kern, Darstellung und Wiedergabe; unabhängiger Formularentwurf; getestete Validierung und Speichergrenze; Einstellungen ohne neue Laufzeitabhängigkeit.

**Non-Goals:** Veränderung laufender Aktionen durch Regelparameter, Speichern der Welt, mehrere Profile, Import/Export, Tab-Synchronisation oder Änderung der 60-Hz-Zeitbasis.

## Decisions

### Drei getrennte Zustände und ausdrückliche Aktionen

Aktive Konfiguration, Formularentwurf und zuletzt erfolgreich gespeicherte Konfiguration werden getrennt geführt und tief kopiert. `defaultConfig` bleibt unverändert. Übernehmen validiert und startet neu; Speichern validiert und schreibt nur den Entwurf; Standardwerte füllt nur den Entwurf. Hinweise erklären diese Folgen direkt bei den Schaltflächen. Vergleich mit aktivem und gespeichertem Stand zeigt offene Änderungen. Automatisches Übernehmen oder Speichern bei jeder Eingabe wurde verworfen: Zwischeneingaben können ungültig sein und Feldänderungen laufende Aktionen unbrauchbar machen.

Die vorhandene Tempoauswahl ist die bewusste Ausnahme für sofortige Änderungen: Sie aktualisiert Wiedergabefaktor, aktive Konfiguration und ausschließlich das Tempofeld im Entwurf. Ein im Formular bearbeiteter Zeitfaktor bleibt dagegen Entwurf bis zum Übernehmen. Programmgesteuerte Formularaktualisierungen lösen kein Übernehmen aus.

### Vollständiges Formular mit nativen Elementen

`details`/`summary` bildet die zunächst geschlossene Box. `fieldset`/`legend` gruppieren Feld und Nahrung, Grasfresser, Karnivoren und Aktionszeiten. Beschriftete Zahleneingaben mit passenden Schritten und Grenzen zeigen die vorhandenen Config-Werte; die 60 Ticks/s werden erklärt. Definitionen für Feldpfade, deutsche Labels und Einheiten können in einem kleinen Einstellungsmodul zentral gepflegt werden. Leere Eingaben werden nicht zu null konvertiert. Neben nativer Eingabeprüfung bleibt `validateConfig` die gemeinsame maßgebliche Bereichs- und Kombinationsprüfung. Ein zugänglicher Meldungsbereich zeigt Validierungsfehler und Speicherstatus, ohne den Populationsstatus zu überladen. Fehlerhafte Eingaben erhalten Fokus oder eine eindeutig erreichbare Fehlerzuordnung.

Ein responsives Raster verhindert Überbreite. Aufklappen verändert nur das Layout; bestehende Resize-Behandlung projiziert das Feld neu. Kein UI-Framework ist nötig.

### Eine aktive Konfiguration in der Browserintegration

`src/main.ts` lädt die Anfangskonfiguration vor Initialisierung und hält danach `activeConfig`. Initialisierung, Layout, Rendering und Wiedergabe nutzen denselben Stand. Eine zentrale Funktion erzeugt beim Übernehmen einen neuen Zustand und eine neue `Playback`-Instanz, setzt den Zeitanker auf den aktuellen Zeitpunkt und erhält den Pausenmodus. Sie aktualisiert die Tempooptionen einschließlich gültiger Sonderwerte und zeichnet neu. Der bestehende rAF-Zyklus liest die jeweils aktuelle Instanz; es werden keine zusätzlichen Listener oder Animationsschleifen angelegt. Neustart verwendet aktive Werte und aktuelles Tempo, lässt den Entwurf aber bestehen. HMR-Abmeldung räumt auch neue Formularlistener auf.

Eine Veränderung der vom bestehenden Playback gehaltenen Konfiguration wurde verworfen: laufende Aktionen und deren Zeitpunkte wären dann mit neuen Regeln vermischt. Eine neue Instanz bildet die ohnehin erforderliche Neustartgrenze ab.

### Versionierter lokaler Datensatz mit vollständiger Prüfung

Ein kleines Speichermodul kapselt `localStorage` hinter einer injizierbaren Schnittstelle. Ein eigener Schlüssel, etwa `carnivore-sim.settings`, enthält `{ version: 2, config: ... }`. Lesen erfolgt vor dem Start mit getrennten Ergebnissen für fehlende Daten, Erfolg und Fehler. Erst JSON parsen, Version und vollständige bekannte Struktur samt numerischen Typen prüfen, dann `validateConfig` anwenden. Kein Zusammenführen beschädigter Teilwerte mit Standards und keine automatische Migration unbekannter Versionen. Unbekannte Zusatzfelder werden nicht als Konfiguration übernommen.

Auch der Zugriff auf `window.localStorage` kann werfen und gehört in die Fehlerbehandlung. Lesen scheitert auf aktuelle Standards mit Hinweis zurück; Schreibfehler lassen die aktive Simulation und den letzten erfolgreichen Speicherstatus bestehen. Erfolg wird erst nach erfolgreichem `setItem` gemeldet. Standardwerte werden auf Wunsch wie jede andere gültige Konfiguration gespeichert. Andere Browserdaten bleiben unberührt. Eine Datenbank oder ein Backend wäre für einen einzelnen kleinen lokalen Datensatz unnötig.

## Risks / Trade-offs

- [Speicher kann blockiert oder später gelöscht werden] → Lokale Speicherung klar benennen, Fehler anzeigen, Simulation ohne Persistenz nutzbar halten.
- [Entwurf, aktiv und gespeichert können auseinanderliegen] → Eindeutige Aktionslabels, sichtbare Änderungszustände und getrennte Tests für Übernehmen, Speichern und Standardwerte.
- [Gültige große Felder können langsam sein] → Bestehende Grenzen unverändert übernehmen; keine neue Performancegarantie oder willkürlichen Obergrenzen in diesem Change.
- [Startwerte ändern sich in späteren Versionen] → Standardwerte immer aus aktuellem `defaultConfig`; gespeicherte vollständige Werte gelten weiter, solange Version und Validierung passen.
- [Browserprüfungen setzen leeren Speicher voraus] → Jede Testumgebung isolieren; vorhandene Tempo-, HMR-, Pausen- und Mobilprüfungen weiterhin durchführen.

## Migration Plan

Bestehende Version-1-Daten werden mit der bisherigen halben Maximalenergie ergänzt, neue Speicherungen verwenden Version 2. Ohne eigenen Speicherschlüssel bleibt das bisherige Startverhalten erhalten. Nach Auslieferung werden gültige gespeicherte Einstellungen bevorzugt. Bei Rücknahme der Funktion bleibt der isolierte Datensatz ungenutzt und die Anwendung startet wieder mit Quellcodestandards. Die Startpopulation erhält ihre konfigurierte Energie; die Delta-Spezifikation der Ökosystemregeln beschreibt diesen neuen Parameter. Die Präsentationsspezifikation wird an den gespeicherten Startwert angepasst.

### Ergänzung: Startenergie und bestehende Speicherung

Jede SpeciesConfig erhält initialEnergy (Standard 10, endlich und > 0 sowie <= maxEnergy). initialize verwendet diesen Wert bei jedem Kartenstart. Die Startenergie beeinflusst keine Energiehalbierung bei Teilung. Das Formular zeigt je Art ein eigenes Startenergie-Feld. Version 1 des gespeicherten Formats wird ausdrücklich unterstützt: ausschließlich die damals nicht vorhandene Startenergie wird als halbe gespeicherte Maximalenergie ergänzt, alle übrigen Werte werden vollständig geprüft. Version 2 erfordert beide Startenergien und wird bei neuen Speicherungen geschrieben. Andere unvollständige Daten und unbekannte Versionen werden weiterhin abgewiesen.
