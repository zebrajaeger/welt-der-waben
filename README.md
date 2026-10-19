# Wabenökosystem

Mit Node.js (Version 22.12 oder neuer) im Projektverzeichnis starten:

```sh
npm install
npm run dev
```

Die von Vite angezeigte lokale Adresse im Browser öffnen. Änderungen an `src/` werden automatisch übernommen. `npm test` führt Regel- und Canvas-Zeichentests aus; `npm run build` prüft TypeScript und erstellt den Produktionsbuild in `dist/`.

Die Simulation läuft automatisch. **Pause / Weiter** hält die Wiedergabe an oder setzt sie fort; im pausierten Zustand führt **Einzelschritt** genau einen logischen Schritt aus. **Neustart** verteilt beide Arten neu. Die Statuszeile zeigt Schrittzahl und Populationen. Grüne Ovale stellen Gras dar, gelbe Sterne Grasfresser und rote Sterne Karnivoren. Nach erfolgreicher Jagd zieht ein Karnivor auf die Zelle seiner Beute; ohne Jagderfolg bleibt er stehen. Mit steigender Energie wachsen die drei Arme zum gefüllten Dreieck; die Energielegende zeigt drei Beispiele. Das gesamte Wabenfeld passt sich der Fenstergröße an. Populationen können aussterben; Neustart beginnt einen neuen Zufallslauf.

## Konfiguration

Die Simulationsparameter stehen in `src/config.ts` als `defaultConfig`. Die Datei kann vor dem Start angepasst werden. `width` und `height` sind Spalten und Reihen (Standard 30 × 20). `grassMax` ist die Grasmenge pro Zelle, `grassGrowth` deren Zuwachs **pro logischem Schritt**. `grassEfficiency` wandelt gefressenes Gras in Grasfresserenergie um; `preyEfficiency` wandelt die aktuelle Energie einer Beute in Karnivorenenergie um. Die beiden Art-Konfigurationen enthalten getrennte `initialCount`, `maxEnergy`, `energyDrain` (Verbrauch **pro Schritt**) und `divisionFraction` (Anteil am Maximalwert). Alle Zellen starten mit halbvollem Gras, beide Arten mit halber Maximalenergie. `stepsPerSecond` ändert nur die Wiedergabegeschwindigkeit, nicht die Energieregeln. Die Konfiguration wird vor dem Start geprüft; ein eingesperrter Grasfresser muss netto Energie verlieren.
