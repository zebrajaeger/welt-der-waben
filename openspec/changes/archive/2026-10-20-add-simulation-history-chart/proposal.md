# Proposal

## Why

Die momentane Statuszeile zeigt Populationen, aber keine zeitlichen Zusammenhänge zwischen Wachstum, Jagd und Energieverbrauch. Ein zuschaltbares Verlaufsdiagramm macht diese Entwicklung während eines Laufs sichtbar.

## What Changes

- Eine unabhängig von den Einstellungen aufklappbare Box „Verlauf“ enthält ein gemeinsames Liniendiagramm.
- Fünf Kurven sind einzeln und gemeinsam wählbar: Anzahl Karnivoren, Anzahl Grasfresser sowie Energiesummen von Karnivoren, Grasfressern und Gras.
- Zwei umschaltbare Modi: wandernde Kurven mit aktuellem Zeitpunkt rechts oder ein umlaufender Cursor, der ältere Kurven überschreibt.
- Eine einstellbare Zeitspanne pro Diagrammbreite steuert die Bewegung in beiden Modi unabhängig vom Simulationstempo.
- Zeitbasis sind Simulationssekunden; Aufnahme läuft auch bei geschlossener Box weiter. Pause, Einzelschritt und neuer Lauf werden korrekt berücksichtigt.
- Begrenzte Historie und responsive Darstellung erhalten die Nutzbarkeit bei langen Läufen und kleinen Fenstern.

## Capabilities

### New Capabilities

- `simulation-history`: Erfassung und Darstellung zeitlicher Populations- und Energieverläufe mit Kurvenauswahl, Darstellungsmodi und einstellbarer Zeitspanne.

### Modified Capabilities

Keine. Die bestehenden Regeln für Simulation, Einstellungen und proportionale Spielfelddarstellung bleiben gültig; das zusätzliche Panel hält diese Layoutregeln ein.

## Impact

Betroffen sind `index.html`, `src/main.ts`, `src/playback.ts` und `src/style.css`; neue Module kapseln Historie, Diagrammprojektion und Panel. Ergänzt werden Vitest- und Playwright-Prüfungen sowie die Bedienungsdokumentation in beiden READMEs. Canvas 2D und vorhandene Werkzeuge reichen aus; zusätzliche Laufzeitabhängigkeiten sind nicht vorgesehen. Historienexport, dauerhafte Speicherung und Rückwärtsnavigation gehören nicht zum Umfang.
