# Proposal

## Why

Die gemeinsame Schrittfolge bündelt Bewegungen, Mahlzeiten und Teilungen in synchronen Wellen. Unabhängige Aktionsabläufe auf einer feinen Simulationszeit sollen das Geschehen gleichmäßiger verteilen und Gras sichtbar stetiger wachsen lassen.

## What Changes

- **BREAKING:** Globale Gras-/Grasfresser-/Karnivorenrunden durch 60 feste Ticks pro Simulationssekunde und individuelle Aktionen je Bewohner ersetzen. Teilungen und lange Mahlzeiten halten nur die beteiligten Tiere auf.
- Gras wächst und beide Arten verbrauchen Energie in jedem Tick, auch während Bewegung, Aussaugen und Teilung. Raten werden pro Simulationssekunde konfiguriert und auf 60 Ticks verteilt.
- Gras und Beuteenergie werden mit einer konfigurierten konstanten Übertragungsrate aufgenommen. Doppelte übertragene Energie benötigt doppelte Aussaugzeit, bis auf die Rundung auf vollständige Ticks.
- Überschüssige Nahrung bleibt erhalten. Ein nur teilweise ausgesaugter Grasfresser überlebt; der Jäger zieht dann seine Spitze zurück und bleibt in seiner bisherigen Zelle. Nur nach vollständigem Aufzehren zieht er in die Beutezelle.
- Zell- und Beutereservierungen verhindern konkurrierende Belegung und doppelte Energieentnahme. Startzeiten werden gestaffelt; ein Tier setzt seinen eigenen Ablauf nach dessen Abschluss fort.
- Dreispitzenbewegung und Kontakt-Haltephase erhalten; Animationen aus den individuellen Aktionen statt aus einem vorausberechneten Welt-Endzustand zeichnen.
- **BREAKING:** Tempo als Zeitfaktor anzeigen, Status auf Tickzahl/Simulationszeit umstellen und Einzelschritt als genau einen Tick definieren. Pause, Fortsetzen, Neustart, Tastaturbedienung und Resize bleiben nutzbar.

## Capabilities

### New Capabilities

Keine; die vorhandenen Fähigkeiten besitzen bereits Regeln und Darstellung der Simulation.

### Modified Capabilities

- `ecosystem-rules`: Tickbasierte Stoffwechsel- und Wachstumsraten, unabhängige Aktionen, Reservierungen, partielle Aufnahme und lokale Teilung.
- `simulation-presentation`: Individuelle Zeitachsen, energieabhängige Aussaugdauer, erhaltene Nahrungsreste und Wiedergabesteuerung für die feine Simulationszeit.

## Impact

- `src/simulation.ts`: Zustandsmodell und Weiterentwicklung je Tick ersetzen die weltweiten Phasensnapshots; laufende Aktionen und Reservierungen werden Teil des Regelzustands.
- `src/config.ts`: Einheiten explizit machen und Transfer-/Bewegungszeiten ergänzen; bisherige Werte für Wachstum und Verbrauch als Raten pro Simulationssekunde übernehmen.
- `src/animation.ts`, `src/playback.ts`, `src/main.ts`, `index.html`: Individuelle Aktionen darstellen, feste Tickakkumulation, Tempo als Multiplikator und Einzelticksteuerung.
- Regel-, Animations-, Konfigurations-, Wiedergabe- und Browserprüfungen an das neue Modell anpassen; geometrische Grundfunktionen weiterverwenden.
- README, `docs/animation.md` und Zeitlupenansichten auf die neuen Einheiten und Abläufe umstellen. Keine zusätzlichen Laufzeitabhängigkeiten oder Speicherung alter Simulationsstände.
