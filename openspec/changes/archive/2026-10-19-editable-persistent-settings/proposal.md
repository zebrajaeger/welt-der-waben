# Proposal

## Why

Simulationsparameter lassen sich bisher nur in `src/config.ts` ändern. Benutzer sollen eigene Konfigurationen direkt ausprobieren, im Browser für spätere Besuche speichern und jederzeit zu den Standardwerten zurückkehren können.

## What Changes

- Eine zunächst eingeklappte Box „Einstellungen“ enthält beschriftete Eingaben für sämtliche Werte aus `Config`, gruppiert nach Feld, Nahrung, Arten und Bewegungszeiten; die feste Tickrate bleibt 60.
- Formularänderungen bleiben Entwürfe. „Übernehmen“ validiert die gesamte Konfiguration und startet einen neuen Lauf mit diesen Werten unter Beibehaltung des Pausenmodus.
- „Im Browser speichern“ speichert einen gültigen Formularentwurf ausdrücklich lokal für spätere Seitenaufrufe, ohne den laufenden Zustand zu ändern. Sichtbare Rückmeldungen unterscheiden gespeicherte und übernommene Werte.
- „Standardwerte“ ersetzt den Entwurf durch die aktuellen Programmstandards. Erst Übernehmen beziehungsweise Speichern verändert den Lauf beziehungsweise die gespeicherten Einstellungen.
- Gespeicherte gültige Werte werden beim Laden verwendet; fehlende, beschädigte oder inkompatible Daten sowie gesperrter Speicher verhindern den Simulationsstart nicht.
- Die vorhandene Tempoauswahl bleibt sofort wirksam. Ihr aktueller Wert erscheint auch im Formular und wird beim ausdrücklichen Speichern berücksichtigt; alleinige Tempowahl speichert nichts.

## Capabilities

### New Capabilities

- `simulation-settings`: Bearbeitbare Konfigurationsentwürfe, Validierung, bewusstes Übernehmen, lokale Speicherung und Wiederherstellung der Standardwerte.

### Modified Capabilities

- `simulation-presentation`: Tempoauswahl und Neustart verwenden die aktive Konfiguration; Neuladen verwendet eine gültige gespeicherte Konfiguration oder die Programmstandards.
- `ecosystem-rules`: Jede Art besitzt eine unabhängige positive Startenergie bis zur Maximalenergie (Standard jeweils 10), die bei jedem Kartenstart verwendet wird. Frühere gespeicherte Werte werden mit ihrer bisherigen halben Maximalenergie geladen.

## Impact

Betroffen sind `src/config.ts`, `src/main.ts`, `index.html`, `src/style.css`, neue Einstellungen-/Speichermodule sowie Konfigurations- und Browserprüfungen und `README.md`. Der aktuelle direkte Zugriff auf `defaultConfig` in Initialisierung, Layout und Rendering muss durch eine gemeinsame aktive Konfiguration ersetzt werden. `Playback` bindet seine Konfiguration beim Erzeugen; Übernehmen erzeugt deshalb eine neue Instanz. Speicherung erfolgt über `localStorage` ohne Backend oder neue Laufzeitabhängigkeiten. Simulationszustände, Profile, Import/Export und Synchronisation zwischen Tabs gehören nicht zum Umfang.
