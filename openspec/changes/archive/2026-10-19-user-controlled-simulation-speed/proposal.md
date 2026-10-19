# Proposal

## Why

Die Simulationsgeschwindigkeit ist derzeit nur vor dem Start in der Konfiguration einstellbar. Benutzer sollen laufende Bewegung, Teilung und Grasaufnahme direkt in der Oberfläche verlangsamen oder längere Entwicklungen beschleunigen können.

## What Changes

- Eine beschriftete Tempoauswahl neben Pause, Einzelschritt und Neustart bietet 0,25, 0,5, 1, 2, 4 und 8 Schritte pro Sekunde und zeigt den gewählten Wert mit Einheit an.
- Der Startwert kommt weiterhin aus `defaultConfig.stepsPerSecond`; ein abweichender gültiger Konfigurationswert wird zusätzlich zur Auswahl angeboten.
- Änderungen wirken sofort auf die verbleibende Animationszeit, ohne Positionssprung, neue Zufallsentscheidung oder Neustart eines laufenden Schritts.
- Die Auswahl ist auch während einer Pause und eines Einzelschritts bedienbar. Pause bleibt eine Pause; Einzelschritt bleibt genau ein Schritt. Neustart erhält das gewählte Tempo, Neuladen stellt den konfigurierten Startwert wieder her.
- Alle Phasen und Animationen werden gemeinsam skaliert, einschließlich Teilung und exakt abgestimmtem Jagdkontakt. Die Regeln und Energiemengen pro Schritt bleiben unverändert.

## Capabilities

### New Capabilities

Keine; die Einstellung gehört zur bestehenden Simulationsdarstellung.

### Modified Capabilities

- `simulation-presentation`: Benutzer wählt das Tempo zur Laufzeit; laufende Animationen und bestehende Bedienelemente reagieren konsistent.

## Impact

- `index.html`, `src/style.css` und `src/main.ts`: zugängliche Tempoauswahl, Beschriftung und Anbindung an die Wiedergabe, auch bei schmalen Fenstern.
- `src/playback.ts`: validierte Tempoänderung mit Erhalt des normierten Fortschritts, getrennt von der Regelkonfiguration.
- `tests/playback.test.ts`, `scripts/browser-check.mjs`, `README.md` und `docs/animation.md`: Regressionstests und Bedien-/Entwicklerhinweise.
- Keine Änderung an `src/simulation.ts`, keine zusätzliche Laufzeitabhängigkeit und keine Speicherung der Einstellung über ein Neuladen hinaus.
