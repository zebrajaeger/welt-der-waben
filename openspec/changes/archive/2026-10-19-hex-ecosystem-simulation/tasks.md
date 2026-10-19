# Tasks

## 1. Browserprojekt und Konfiguration

- [x] 1.1 TypeScript-, Vite- und Test-Setup aus dem vorhandenen `package.json`-Grundgerüst erstellen; mit `npm run build` und `npm test` prüfen, dass beide Skripte ausführbar sind.
- [x] 1.2 Standardkonfiguration für 30 x 20 Zellen, zehn Tiere je Art, 50-%-Startenergie/-Gras, 75-%-Teilungsschwelle und separat konfigurierbare weitere Parameter anlegen; Konfigurationsschema und Bedeutung von Werten pro Schritt dokumentieren und mit einem Test auf Standardwerte prüfen.
- [x] 1.3 Konfigurationsprüfung einschließlich Überbelegung, endlichen Zahlen, Grenzwerten und `grassGrowth * grassEfficiency < herbivoreDrain` implementieren; gültige und ungültige Kombinationen in automatisierten Tests verifizieren.

## 2. Raster, Initialisierung und Gras

- [x] 2.1 Sechseck-Nachbarschaft und feste Ränder für gerade/ungerade Reihen implementieren; Tests für Innen-, Eck- und Randzellen sowie alternative Feldgrößen ausführen.
- [x] 2.2 Simulationszustand und zufallsinjizierte Initialisierung ohne doppelte Belegung bauen; per Tests Startzahlen, artspezifische halbe Energie, halbes Gras und null Gras nur unter initialen Grasfressern prüfen.
- [x] 2.3 Grasphase mit linearem Wachstum und Maximum umsetzen; Grenz- und Nullzuwachstests ausführen.

## 3. Grasfresserphase

- [x] 3.1 Gleichzeitige Zielwahl anhand des Belegungssnapshots samt Grasmaxima, Zufall bei Gleichstand, Zielkonflikten und genau einem Feld Bewegungsweite umsetzen; Tests für besetzte Zellen, verlassene Zellen, riskante Nachbarzellen und unterlegene Tiere ausführen.
- [x] 3.2 Grasaufnahme mit Wirkungsgrad, Kappung, Energieverbrauch und Tod implementieren; Tests für verbleibende Tiere, vollständig geleerte Graszellen und Nettoverlust eingesperrter Tiere ausführen.
- [x] 3.3 Teilung bei Energie oberhalb 75 % mit zufälliger freier Nachbarzelle, halbierter Energie und Geburtskonflikten umsetzen; Tests für fehlenden Platz, Maximalenergie und inaktiven Nachwuchs ausführen.

## 4. Karnivorenphase und Gesamtstep

- [x] 4.1 Zufällige Beutewahl mit höchstens einer Beute je Karnivor, Konfliktauflösung und energieabhängigem Beutewirkungsgrad umsetzen; Tests für gemeinsame und mehrere Beuten sowie Höchstenergie ausführen.
- [x] 4.2 Energieverbrauch, Tod und Teilung der Karnivoren an ihrer aktuellen Position ergänzen; Tests für Platzmangel, Geburtskonflikte und erst im Folgeschritt aktiven Nachwuchs ausführen.
- [x] 4.3 Gras, Grasfresser und Karnivoren zu einem Simulationsschritt verbinden; Integrationstests für Phasenfolge, Belegungsinvariante und in Jagdreichweite gezogenen bzw. neugeborenen Grasfresser ausführen.

## 5. Browserdarstellung und Entwicklungserlebnis

- [x] 5.1 Canvas-Ansicht für responsives Sechseckfeld, Zellgrenzen und nach Grasmenge skalierte zentrale Ovale bauen; Darstellung in Browser und/oder Canvas-Zeichentests für Randzellen und verschiedene Grasmengen verifizieren.
- [x] 5.2 Unterschiedlich gefärbte dreizackige Tiere mit energiebasiertem Übergang von drei Strichen zu gefülltem Dreieck zeichnen; Zustände mit geringer, mittlerer und hoher Energie im Browser prüfen.
- [x] 5.3 Wiedergabetakt und Anzeige von Schrittzahl und Populationen integrieren; bei zwei konfigurierten Geschwindigkeiten prüfen, dass ein Einzelschritt identische Wachstums-/Verbrauchswerte verwendet.
- [x] 5.4 Entwicklungsstart und Bedienanleitung dokumentieren; bei laufendem Dev-Server eine Quelltextänderung vornehmen und automatische Browser-Aktualisierung ohne manuelles Neuladen prüfen.

## 6. Integration

- [x] 6.1 Vollständigen Testlauf und Produktions-Build ausführen; eine längere Simulation mit Standardkonfiguration im Browser auf Belegungsfehler, Größenanpassung und flüssige Darstellung prüfen.
