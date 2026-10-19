# Tasks

## 1. Laufzeittempo in der Wiedergabesteuerung

- [x] 1.1 `Playback` um eine vom Konfigurationsobjekt getrennte Laufzeitgeschwindigkeit, Getter und validierte Setzmethode erweitern; normierten Fortschritt mit dem zum jeweiligen Zeitabschnitt gültigen Tempo akkumulieren. Tests mit kontrollierter Zeit müssen Beschleunigen, Verlangsamen, mehrere Änderungen, ungültige Werte, Grenzzeitpunkte sowie unveränderte Konfiguration und Anzahl der Regelberechnungen prüfen.
- [x] 1.2 Pause, Fortsetzen, Einzelschritt und Neustart mit der Laufzeitgeschwindigkeit absichern und die Schnittstelle in `docs/animation.md` dokumentieren; Tests müssen eingefrorene Zwischenformen bei pausierter Tempowahl, genau einen Einzelschritt auch bei Tempoänderung, erhaltenes Tempo nach Neustart und weiterhin identische Regelresultate bei gleicher Zufallsfolge belegen.

## 2. Tempoauswahl in der Oberfläche

- [x] 2.1 In `index.html`, `src/style.css` und `src/main.ts` eine zugeordnete Beschriftung „Tempo“ und Auswahl für 0,25, 0,5, 1, 2, 4 und 8 Schritte/s ergänzen; einen abweichenden gültigen Konfigurationswert zusätzlich anbieten. Browserprüfungen müssen Startauswahl, Einheit, alle Optionen, Tastaturbedienung und Erreichbarkeit auf schmalen Bildschirmen belegen; `README.md` muss Auswahl und Werte erklären.
- [x] 2.2 Die Auswahl an dieselbe `Playback`-Instanz und Frame-Schleife anbinden, während Pause und Einzelschritt bedienbar halten und Listener beim Aufräumen entfernen; Browserprüfungen in `scripts/browser-check.mjs` müssen Wechsel im laufenden Betrieb, bei Pause und Einzelschritt, unveränderte Schrittanzahl durch bloße Auswahl, erhaltene Wahl nach Neustart und Rückkehr zum Startwert nach Neuladen prüfen.

## 3. Integration

- [x] 3.1 `npm test`, `npm run build` und `openspec validate user-controlled-simulation-speed --strict` erfolgreich ausführen; im Browser langsamste und schnellste Auswahl sowie Wechsel während Teilung und vor Jagdkontakt prüfen und mit Desktop-/Mobilbildern festhalten, dass Formen ohne Sprung weiterlaufen und Ereignisreihenfolge, Grasaufnahme und Jagdsynchronisierung erhalten bleiben.
