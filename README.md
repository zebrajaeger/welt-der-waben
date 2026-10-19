# Wabenökosystem

Mit Node.js ab 22.12 im Projektverzeichnis `npm install` und `npm run dev` ausführen. Die von Vite angezeigte Adresse öffnen. `npm test` prüft Regeln, Geometrie und Wiedergabe; `npm run build` prüft TypeScript und erstellt `dist/`.

Die Simulation arbeitet mit **60 Ticks pro Simulationssekunde**. Jeder Bewohner hat seinen eigenen Ablauf. Eine lange Mahlzeit oder Teilung hält andere Tiere und das Graswachstum nicht an. Grüne Ovale zeigen Gras, gelbe Sterne Grasfresser und rote Sterne Karnivoren. Die Energie füllt die Sterne zu Dreiecken auf.

**Pause / Weiter** friert sämtliche Vorgänge ein oder setzt sie fort. **Einzelschritt** führt genau einen Tick weiter, auch mitten in einer Bewegung. **Neustart** verteilt beide Arten neu und verwirft laufende Aktionen. **Tempo** bietet 0,25× bis 8×: Bei 1× verstreichen 60 Ticks pro Realzeitsekunde, bei 2× sind es 120. Neustart behält die Auswahl; Neuladen verwendet den konfigurierten Startfaktor. Der Status zeigt Tick, Simulationszeit und aktuelle Populationen.

Eine Spitze streckt sich zum Zielzentrum. Während des Aussaugens halten die Spitzen; anschließend ziehen die beiden anderen nacheinander nach. Die Aussaugdauer hängt von der tatsächlich übertragenen Energie ab. Überschüssiges und neu gewachsenes Gras bleibt erhalten. Überlebt eine teilweise ausgesaugte Beute, zieht der Karnivor seine Spitze zurück und die Beute bleibt in ihrer Zelle. Erst nach vollständigem Aufzehren zieht der Jäger auf die Beutezelle.

Bei Teilung entstehen zwei Hälften mit gleicher Energie. Sind zwei Nachbarn frei, ziehen beide hinaus; bei einem bleibt eine Hälfte am Ursprung. Jede Hälfte nimmt lokal Gras auf und beendet ihre eigene Bewegung. Populationen können aussterben; Neustart beginnt einen neuen Zufallslauf.

## Konfiguration und Einheiten

`src/config.ts` enthält `defaultConfig`. `grassGrowthPerSecond` ist Gras je Zelle und Simulationssekunde; `energyDrainPerSecond` ist Verbrauch je lebendem Tier und Simulationssekunde. Beide Raten werden auf 60 Ticks verteilt, auch während Bewegung, Warten, Transfer und Teilung. Die bisherigen numerischen Grundwerte werden als Sekunderaten übernommen: Wachstum 1 und Verbrauch 2. `energyTransferPerSecond` ist Bruttoenergie je Simulationssekunde (Standard 8), getrennt vom Verbrauch. 4 übertragene Energie benötigt damit 30 Ticks, 8 benötigt 60 Ticks. Wirkungsgrade bestimmen, wie viel Nahrung dafür entnommen wird. Das bei Kontakt festgelegte Aufnahmebudget wird durch laufenden Verbrauch nicht nachträglich erhöht.

`speedMultiplier` (Standard 2) ändert die Realzeitgeschwindigkeit. Bewegungs- und Wartezeiten sind positive ganze Tickzahlen. `width`/`height` bestimmen das begrenzte Wabenfeld, `grassMax` das Grasmaximum. Jede Art hat `initialCount`, `maxEnergy`, `energyDrainPerSecond` und `divisionFraction`. Ein eingeschlossener Grasfresser muss langfristig netto Energie verlieren: Wachstum mal Graswirkungsgrad muss kleiner als sein Verbrauch sein.

Entwicklerhinweise und Browserprüfungen stehen in [docs/animation.md](docs/animation.md). Die [Zeitlupenansicht](http://localhost:5173/scripts/grass-division-demo.html) zeigt reproduzierbare lokale Bewegungen mit Tickregler.
