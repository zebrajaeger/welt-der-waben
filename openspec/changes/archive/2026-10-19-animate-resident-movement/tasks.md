# Tasks

## 1. Phasen und Jagdereignisse bereitstellen

- [x] 1.1 In `src/simulation.ts` einen kompatiblen Übergangsaufruf mit Endzustand, Phasensnapshots und Ereignissen für aufgelöste Bewegungen, erfolgreiche Jagden, Geburten und Tod ergänzen; Tests in `tests/simulation.test.ts` müssen identische Endzustände und Zufallsaufrufe wie `step` sowie unveränderte Eingaben nachweisen.
- [x] 1.2 Bewegte und gefressene Tiere, stehende Beute, neugeborene Beute, konkurrierende Jäger, Tod nach Bewegung und Teilung nach Jagd in den Übergangsdaten absichern; deterministische Tests müssen IDs, Quell-/Zielzellen, Beutezuordnung und Phasenreihenfolge prüfen, und die Ereignisschnittstelle muss dokumentiert sein.

## 2. Spitzengeometrie und Zeichenlogik

- [x] 2.1 In `src/animation.ts` reine Funktionen für Spitzenwahl, persistierte visuelle Ausrichtung und die drei Bewegungsabschnitte erstellen; Tests aller sechs Nachbarrichtungen auf geraden und ungeraden Reihen müssen nächste Spitze, Gleichstand, ruhende Restspitzen, exakte Abschnittsgrenzen und die endgültig vordere erste Spitze prüfen.
- [x] 2.2 `src/render.ts` für die drei verformbaren Spitzen und den zugehörigen inneren Bezugspunkt erweitern; Zeichentests müssen unveränderte Farben und Energieformen bei niedriger, mittlerer und hoher Energie sowie kontinuierliche Übergänge und zur neuen Zellmitte passende Endformen nachweisen.

## 3. Gemeinsame Zeitleiste für Bewegung und Jagd

- [x] 3.1 Aus Übergangsdaten einen Darstellungsplan mit Grasfresserankunft und Karnivorenkontakt bei `t=0,50` erstellen; Tests vor, an und nach dieser Grenze müssen die fertige Beuteposition, den Karnivorenspitzenkontakt, das erst dann erfolgende Verschwinden und das spätere Nachziehen zeigen.
- [x] 3.2 Sichtbarkeit, Energie und Belegungshintergrund anhand der Phasengrenzen darstellen; Tests für stehende und neugeborene Beute, mehrere gleichzeitige Jagden, Konfliktverlierer, verhungerte Tiere und beide Geburtsphasen müssen sicherstellen, dass keine Ereignisse erfunden oder doppelt gezeigt werden und das Endbild zum Endzustand passt.

## 4. Wiedergabe und Bedienung integrieren

- [x] 4.1 Den Intervallaufruf in `src/main.ts` durch eine mit `requestAnimationFrame` gezeichnete Steuerung mit genau einem aktiven Übergang ersetzen; Tests mit kontrollierter Zeit müssen Skalierung bei zwei Geschwindigkeiten, einen Regelaufruf pro Schritt, geordnetes Abschließen bei verspäteten Frames und unveränderte Regelergebnisse belegen.
- [x] 4.2 Pause/Weiter, animierten Einzelschritt, Sperre weiterer Einzelschritte, Neustart, Resize und HMR-Aufräumen integrieren; Steuerungstests müssen eingefrorenen Fortschritt, sprungfreie Fortsetzung, genau einen abgeschlossenen Einzelschritt und das Verwerfen alter Ereignisse nach Neustart prüfen; `README.md` muss das aktualisierte Bedienverhalten beschreiben.

## 5. Integration und sichtbare Abnahme

- [x] 5.1 `scripts/browser-check.mjs` auf das Ende animierter Einzelschritte und reproduzierbare Zwischenbilder erweitern; Browserprüfungen müssen Vorstrecken und beide Nachziehschritte, führende Endspitze, synchrones Aufpieksen, Pause mitten in der Bewegung, Neustart und Resize auf Desktop und Mobilgerät belegen.
- [x] 5.2 `npm test`, `npm run build` und `openspec validate animate-resident-movement --strict` erfolgreich ausführen; einen längeren animierten Standardlauf im Browser auf flüssige Darstellung, fehlende Doppelbelegung, ausbleibende überlappende Übergänge und Konsistenz zwischen Endbild und Schrittstatus prüfen.

## 6. Sichtbare Teilung mit Platzregel

- [x] 6.1 Teilung beider Arten bei zwei freien Nachbarn auf zwei verschiedene Zellen und bei einem freien Nachbarn mit einer stehenbleibenden Hälfte umsetzen; gemeinsame Zielkonflikte atomar zufällig lösen, Quellform und beide Zielhälften aufzeichnen und durch Tests für null/eine/zwei freie Zellen, Konflikte, halbe Energie, Belegung und anschließende Jagd absichern.
- [x] 6.2 Aus der vollen Ausgangsform zwei sichtbare Hälften mit Spitzenbewegung entwickeln und vor dem Jagdkontakt abschließen; Tests für beide Arten, beide Platzfälle, Kontinuität, Energieformen, gefressene Hälften, Endausrichtung und Pause/Weiter müssen bestehen.
- [x] 6.3 README und Animationsdokumentation aktualisieren, reproduzierbare Browserbilder beider Teilungsfälle ergänzen und einen längeren Lauf mit Teilungen auf fehlerfreie Belegung prüfen; vollständiger Testlauf, Produktionsbuild und strikte OpenSpec-Validierung müssen bestehen.

## 7. Grasaufnahme beim Ankommen nach Teilung

- [x] 7.1 Sofortige Grasaufnahme neu eingezogener Pflanzenfresserhälften mit Wirkungsgrad, Energiekappung, einmaligem Verbrauch und ohne Kaskadenteilung ergänzen; Regressionstests müssen eine/zwei neue Zielzellen, stehenbleibende Hälften, Beuteenergie sowie Gras- und Energieanzeige vor und nach der Ankunft prüfen.
- [x] 7.2 Dokumentation und Browserprüfung anpassen, eine langsam abspielbare Teilung zur Sichtprüfung bereitstellen und den Browserlauf auf Belegung und Energie prüfen; vollständiger Testlauf, Build und strikte OpenSpec-Validierung müssen bestehen.
