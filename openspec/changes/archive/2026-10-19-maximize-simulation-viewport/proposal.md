# Proposal

## Why

Beim Verbreitern des Browsers begrenzen eine feste Seitenbreite und eine pauschal berechnete Zeichenhöhe die Spielfeldgröße. Das Spielfeld soll die verfügbare Browserfläche bestmöglich nutzen und dabei vollständig und unverzerrt sichtbar bleiben.

## What Changes

- Die Oberfläche nutzt die Fensterbreite ohne die bisherige 1500-Pixel-Obergrenze; kompakte Außenabstände bleiben für die Bedienung erhalten.
- Das Spielfeld erhält die verbleibende Fläche nach den tatsächlich benötigten Höhen von Kopf, Einstellungen, Meldungen, Status und Legende.
- Das gesamte Feld wird mit einem gemeinsamen Maßstab für beide Achsen maximal in diese Fläche eingepasst und zentriert. Nur durch das Seitenverhältnis bedingte Restflächen bleiben bestehen.
- Fensteränderungen, umgebrochene Bedienelemente, Einstellungsbox und Meldungen lösen eine neue Größenanpassung aus, auch bei pausierter Simulation.
- Auf sehr niedrigen Fenstern bleibt das Spielfeld mindestens 160 CSS-Pixel hoch; notwendiges vertikales Scrollen hält die Bedienung erreichbar. Lange offene Einstellungen erhalten eine begrenzte, intern scrollbar nutzbare Höhe.
- Die reine Größenanpassung erhält Simulation, Pause, Tempo und laufende Animationen.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `simulation-presentation`: Maximale proportionale Einpassung in die tatsächlich verfügbare Browserfläche sowie Neuprojektion bei Layoutänderungen.

## Impact

Betroffen sind das Seitenlayout in `src/style.css`, die Größenmessung und Beobachter in `src/main.ts`, gegebenenfalls die Flächenberechnung in `src/render.ts` sowie `tests/render.test.ts`, Browserprüfungen unter `scripts/` und `README.md`. Die vorhandene Layoutfunktion verwendet bereits einen gemeinsamen Radius; neu ist insbesondere ihre verlässliche verfügbare Breite und Höhe. Es werden keine neuen Abhängigkeiten benötigt. Automatische Änderungen der Zellanzahl, Beschneiden, Zoom/Pan und ein Vollbildmodus sind nicht Bestandteil dieses Vorschlags.
