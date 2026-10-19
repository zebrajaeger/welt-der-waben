# Proposal

## Why

Einstellungen sind bislang an den Browserspeicher einer Adresse gebunden. Als JSON-Dateien lassen sich bewährte Konfigurationen sichern, mit anderen teilen und zwischen Geräten oder lokaler und veröffentlichter Simulation übertragen.

## What Changes

- Die eingeklappte Einstellungsbox erhält Aktionen „Als JSON exportieren“ und „JSON importieren“ mit lokalem Dateidownload beziehungsweise Dateiauswahl.
- Exportiert wird der vollständige gültige Formularentwurf, einschließlich Startenergien und Starttempo, in einem lesbaren, versionierten JSON-Format.
- Importierte Einstellungen werden vollständig geprüft und als Formularentwurf geladen. Aktivieren mit Neustart und dauerhaftes Speichern bleiben ausdrückliche separate Aktionen.
- Ungültige oder inkompatible Dateien werden mit verständlichem Hinweis abgewiesen, ohne vorhandene Werte zu überschreiben. Abbrechen der Dateiauswahl verändert nichts.
- Das Dateiformat entspricht dem vorhandenen Speicherformat; dessen ältere Version ohne Startenergien bleibt lesbar. Beide READMEs erklären den Ablauf und ein Formatbeispiel.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `simulation-settings`: Portabler JSON-Export und validierter Dateiimport ergänzen den bestehenden Ablauf aus Entwurf, Übernehmen und Speichern.

## Impact

- `src/settings-panel.ts`, `index.html` und gegebenenfalls `src/style.css`: Dateiaktionen und zugängliche Rückmeldungen in der vorhandenen Box.
- `src/settings-storage.ts` und ein gemeinsames Formatmodul: vorhandene Versionierung und Migration wiederverwenden; `src/settings.ts` bleibt Grundlage der vollständigen Parameterprüfung.
- Einstellungen-Unit-Tests sowie `e2e/production.pw.ts`: Dateirundlauf, Fehlerfälle und unveränderte aktive/gespeicherte Werte nachweisen.
- `README.md` und `README.de.md`: Bedienung und Dateiformat dokumentieren.
- Keine zusätzlichen Pakete, Server oder Änderungen an Simulationsregeln. Laufende Welten, Tiere, Zufallszustände und Tickstände sind nicht Teil der Dateien.
