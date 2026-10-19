# Tasks

## 1. Tickmodell und Zeiteinheiten

- [x] 1.1 In `src/config.ts` 60 Ticks pro Simulationssekunde festlegen, Raten mit expliziten Sekundeneinheiten, Transfergeschwindigkeit, lokale Bewegungs-/Wartezeiten und Zeitfaktor einführen. Konfigurationsprüfungen und Fixtures migrieren; Tests müssen gültige Standardwerte, ungültige Raten/Tickzahlen sowie die Verhungerungsbedingung mit identischen Einheiten prüfen. Einheiten und numerische Übernahme der bisherigen Grundraten in README dokumentieren.
- [x] 1.2 In `src/simulation.ts` Weltzustand mit ganzzahligem Tick und lokalen Aktionszuständen einführen; Wachstum und Stoffwechsel jedes Ticks unabhängig von Aktionen verbuchen. Tests müssen nach 60 und 600 Ticks exakte Grundraten, Kappung, Tod während verschiedener Aktionen, unveränderte Eingaben und gleiche Ergebnisse bei gleichem Zufallsstrom zeigen. Die Zustands- und Tickreihenfolge in `docs/animation.md` dokumentieren.

## 2. Unabhängige Aktionen und Reservierungen

- [x] 2.1 Lokale Bereitschaft, initiale Staffelung und Grasfresserbewegung mit exklusiver Zielreservierung implementieren. Tests müssen gestaffelten Beginn, Fortschritt eines Tiers während langer fremder Aktionen, maximalen Graswert, Randzellen, zufällige Gleichstände, konkurrierende Ziele und erneute Nutzung freigegebener Ursprungszellen ab dem Folgetick belegen; Aktions- und Reservierungsübergänge dokumentieren.
- [x] 2.2 Lokale Teilung mit atomarer Zielpaarreservierung, Energiehalbierung am vorgesehenen Zeitpunkt und unabhängigen Hälften implementieren. Tests müssen null/einen/zwei freie Nachbarn, Zielkonflikte ohne Energiehalbierung, Tod und Freigabe während Teilung sowie unabhängige Bereitschaft nach eigener Ankunft und Wartezeit prüfen; die geänderte Neugeborenenregel und Energieabrechnung dokumentieren.
- [x] 2.3 Lokale Jagd mit exklusiver Beutereservierung und Abstimmung auf deren tatsächliche Ankunft implementieren. Tests müssen stehende, bewegte und gerade geteilte Beute, unabhängige Jagdzeiten, konkurrierende Jäger, unerreichbare Ziele und Tod vor Kontakt ohne Phantomtransfer prüfen; Partner- und Abbruchregeln dokumentieren.

## 3. Zeitabhängiger Transfer und erhaltene Nahrung

- [x] 3.1 Begrenztes Kontaktbudget und konstanten tickweisen Gras-/Beutetransfer implementieren. Tests müssen halb/doppelt so große Mahlzeiten, letzten Teilmengentick, Effizienz null/kleiner/größer eins, Sättigung, parallelen Verbrauch, Nachwachsen und Budgetende ohne unbegrenzte Verlängerung belegen. Formeln und Beispiele zu Bruttoaufnahme, Verbrauch und Restnahrung in README und `docs/animation.md` dokumentieren.
- [x] 3.2 Teilweise Jagd mit lebender Restbeute und Rückzug sowie vollständiges Aufzehren mit nachfolgendem Zellwechsel abschließen. Tests müssen erhaltene Beute-ID/Restenergie, unveränderte Belegung bei Rückzug, Energieverlust ausschließlich durch Verbrauch/Transfer, Tod beider Partner während Transfer und rückstandsfreie Freigabe aller Sperren prüfen; die Abweichung vom bisherigen vollständigen Verzehr dokumentieren.

## 4. Individuelle Darstellung und Wiedergabe

- [x] 4.1 `src/animation.ts` auf lokale Tickzeitachsen umstellen und Weltphasensnapshots aus dem produktiven Darstellungsweg entfernen. Geometrie- und Rendertests müssen alle Nachbarrichtungen, gehaltene Kontaktspitzen, unterschiedlich lange Mahlzeiten, unabhängige Teilungshälften, kontinuierlichen Rückzug mit Restbeute sowie Entfernen bei null ohne Restlinien zeigen. Die frühere normierte Welttabelle durch lokale Dauern und Ablaufbeschreibungen ersetzen.
- [x] 4.2 `src/playback.ts` auf feste Tickakkumulation mit Restbruchteilen, Zeitfaktor und begrenzter Nachholarbeit umstellen. Tests mit kontrollierten Zeitstempeln müssen Bildratenunabhängigkeit nach gleicher Tickzahl, 60 Ticks bei 1× pro aktiver Sekunde, Pause/Fortsetzen, faktorübergreifende Kontinuität, Tabpause, Überlastgrenzen, exakten Einzeltick und Neustart samt Aktions-/Reservierungsbereinigung belegen; Zeit- und Bedienvertrag dokumentieren.
- [x] 4.3 In `src/main.ts` und `index.html` Tempoeinheiten auf ×, Status auf Tick/Simulationszeit/Population und Einzelschritt auf einen Tick umstellen. Browserprüfungen müssen alle sechs Faktoren, abweichenden Startfaktor, Tastatur-/Mobilbedienung, erhaltene Auswahl nach Neustart, Startwert nach Reload und Listenerbereinigung bei HMR belegen; README-Bedienhinweise anpassen.
- [x] 4.4 `scripts/browser-check.mjs`, Transfer-/Tempofixtures und `scripts/grass-division-demo.html` auf denselben Tickkern migrieren. Vergleichsbilder müssen kurze/lange Mahlzeiten neben paralleler Teilung, tickweises Graswachstum, erhaltenes Restgras und Rückzug mit lebender Beute zeigen. Pause, Tempoänderung und Resize bei 0,25× und 8× prüfen und die reproduzierbaren Browserbefehle dokumentieren.

## 5. Integration und Laufzeitprüfung

- [x] 5.1 Mindestens 36.000 Ticks mit reproduzierbaren Seeds und unterschiedlichen Framefolgen prüfen: keine Doppelbelegung, keine mehrfach beanspruchte Beute, gültige Energien/Grasmengen und keine verwaisten Reservierungen. Dieselben Seeds müssen nach gleicher Tickzahl dieselben vollständigen Weltzustände liefern; Messwerte für Standardfeld, hohe Population und 8× einschließlich begrenzter Nachholarbeit festhalten.
- [x] 5.2 `npm test`, `npm run build`, `openspec validate asynchronous-resident-simulation --strict` und die vollständigen Browserprüfungen erfolgreich ausführen. Sicherstellen, dass globale Runden, alte Schritte/s-Einheiten und veraltete Diagnoseannahmen aus dem produktiven Pfad entfernt sind und sämtliche neuen Zwischenbilder visuell den Spezifikationen entsprechen.
