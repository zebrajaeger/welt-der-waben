# Wabenökosystem

Mit Node.js (Version 22.12 oder neuer) im Projektverzeichnis starten:

```sh
npm install
npm run dev
```

Die von Vite angezeigte lokale Adresse im Browser öffnen. Änderungen an `src/` werden automatisch übernommen. `npm test` führt Regel- und Canvas-Zeichentests aus; `npm run build` prüft TypeScript und erstellt den Produktionsbuild in `dist/`.

Die Simulation läuft automatisch. **Pause / Weiter** hält die Wiedergabe an oder setzt sie fort; im pausierten Zustand führt **Einzelschritt** genau einen logischen Schritt aus. **Neustart** verteilt beide Arten neu. Die Statuszeile zeigt Schrittzahl und Populationen. Grüne Ovale stellen Gras dar, gelbe Sterne Grasfresser und rote Sterne Karnivoren. Nach erfolgreicher Jagd zieht ein Karnivor auf die Zelle seiner Beute; ohne Jagderfolg bleibt er stehen. Mit steigender Energie wachsen die drei Arme zum gefüllten Dreieck; die Energielegende zeigt drei Beispiele. Das gesamte Wabenfeld passt sich der Fenstergröße an. Populationen können aussterben; Neustart beginnt einen neuen Zufallslauf.

## Animation und Bedienung

Zellwechsel laufen über die drei Spitzen: Eine Spitze streckt sich zum Zentrum des Nachbarfelds, dann folgen die beiden anderen nacheinander. Ein erfolgreicher Karnivor erreicht den Grasfresser mit seiner Spitze genau bei dessen Ankunft und zieht anschließend nach. **Pause** friert auch eine laufende Bewegung ein, **Weiter** setzt sie fort. **Einzelschritt** spielt einen vollständigen animierten Schritt ab und pausiert danach; während eines laufenden Übergangs ist die Taste gesperrt. **Neustart** verwirft einen laufenden Übergang. Schrittzahl und Populationen beziehen sich stets auf den letzten abgeschlossenen Schritt. Die Fenstergröße darf auch während einer Bewegung geändert werden.

Die Animation skaliert mit `stepsPerSecond` und ändert keine Regeln pro Schritt. Entwicklerhinweise zu Phasenzuständen und Ereignissen stehen in [docs/animation.md](docs/animation.md).

Bei einer Teilung schwillt die volle Form kurz an und geht sichtbar in zwei Hälften über. Sind mindestens zwei Nachbarzellen frei, schreiten beide Hälften in unterschiedliche freie Zellen; bei nur einer freien Nachbarzelle bleibt eine Hälfte am Ursprung. Ohne freie Zelle fällt die Teilung aus. Beide Hälften erhalten dieselbe halbe Energie. Die Grasfresserteilung ist vor dem Jagdkontakt abgeschlossen, Karnivoren teilen erst nach dem Nachziehen ihres Körpers. Auch Teilungsbewegungen lassen sich pausieren und fortsetzen.

Eine hinausziehende Grasfresserhälfte frisst bei Ankunft sofort das Gras ihrer neuen Zelle und gewinnt daraus Energie bis zum Maximum. Daher können die Hälften nach ihrer zunächst gleichmäßigen Energieaufteilung unterschiedliche Energie besitzen. Das Gras bleibt während des Hinausschreitens sichtbar und verschwindet beim Ankommen. Es entstehen weder ein zweiter Energieverbrauch noch eine weitere Teilung im selben Schritt.

Zum gezielten Beobachten gibt es bei laufendem Entwicklungsserver die [Teilung in Zeitlupe](http://localhost:5173/scripts/grass-division-demo.html): sechs Sekunden pro Schritt, manuell einstellbarer Fortschritt und direkte Sprünge vor beziehungsweise nach die Ankunft. Sie zeigt beide Platzfälle mit Gras- und Energiewerten.

## Konfiguration

Die Simulationsparameter stehen in `src/config.ts` als `defaultConfig`. Die Datei kann vor dem Start angepasst werden. `width` und `height` sind Spalten und Reihen (Standard 30 × 20). `grassMax` ist die Grasmenge pro Zelle, `grassGrowth` deren Zuwachs **pro logischem Schritt**. `grassEfficiency` wandelt gefressenes Gras in Grasfresserenergie um; `preyEfficiency` wandelt die aktuelle Energie einer Beute in Karnivorenenergie um. Die beiden Art-Konfigurationen enthalten getrennte `initialCount`, `maxEnergy`, `energyDrain` (Verbrauch **pro Schritt**) und `divisionFraction` (Anteil am Maximalwert). Alle Zellen starten mit halbvollem Gras, beide Arten mit halber Maximalenergie. `stepsPerSecond` ändert nur die Wiedergabegeschwindigkeit, nicht die Energieregeln. Die Konfiguration wird vor dem Start geprüft; ein eingesperrter Grasfresser muss netto Energie verlieren.
