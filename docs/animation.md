# Tickzustand und Animation

Die Simulation hat eine einzige Regeluhr: `tick(state, config, random)` rechnet exakt 1/60 Simulationssekunde weiter. Der Aufruf verändert die Eingabe nicht. `initialize` erzeugt eindeutige Startpositionen, die konfigurierte Startenergie jeder Art und über mehrere Ticks verteilte Bereitschaften. Eine Bildabfrage zieht keine Zufallszahlen.

## Tickreihenfolge

1. Gras wächst um seine Sekunderate / 60; alle lebenden Tiere verlieren ihre Verbrauchsrate / 60. Tote und ihre Reservierungen werden entfernt.
2. Laufende Transfers verbuchen höchstens die Transferrate / 60. Das feste Kontaktbudget, freie Kapazität und verbleibende Quelle begrenzen die letzte Teilmenge.
3. Fällige Kontakte, Ankünfte und Geburten schließen lokal ab. Freigegebene Zellen sind erst im Folgetick neu verfügbar.
4. Bereite Bewohner machen Vorschläge aus demselben Belegungsbild. Ein injizierter Zufallsstrom entscheidet Gleichstände und Konflikte; neugeborene Hälften starten nicht erneut im selben Tick.

## Zustände und Reservierungen

`State.tick` ist ganzzahlig. Bewohner führen `readyAt`, Ausrichtung und optional eine lokale Aktion. `reservations` ordnet Ziel- und Teilungsursprungszellen ihren lebenden Besitzern zu. Normale Züge halten den Ursprung bis zur Ankunft belegt. Nach einer Teilung sind die Zielzellen je einer Hälfte zugeordnet; ein gemeinsamer Herkunftsverschluss bleibt bis zum letzten Hinausziehen erhalten. Das ist keine doppelte logische Belegung.

Lokale Teilung reserviert zuerst atomar sämtliche Ziele. Nach dem Anschwellen wird die dann verbleibende Energie exakt halbiert. Ab Geburt verbrauchen beide Hälften Zeitenergie; jede kann nach ihrer eigenen Ankunft und Wartezeit weiterhandeln. Tod vor Geburt erzeugt keinen Nachwuchs; ein verlorener Konflikt halbiert keine Energie.

`capturedBy` bezeichnet einen exklusiven Jäger. Eine beanspruchte Beute vollendet ihren laufenden Zug, beginnt danach jedoch keinen neuen. Der Vorstoß richtet sich nach ihrer geplanten lokalen Ankunft. Stirbt ein Partner, werden Sperren bereinigt. Nach einer teilweisen Mahlzeit wird die Beute freigegeben und der Jäger zieht zurück.

## Energieübertragung

Bei Kontakt gilt das feste Budget `Q = min(Nahrung * Wirkungsgrad, Maximum - Energie)`. Pro Tick werden höchstens `energyTransferPerSecond / 60` Energie übertragen und dafür `q / Wirkungsgrad` Nahrung entnommen. Wirkungsgrad null entnimmt nichts. Verbrauch ist separat; neue Kapazität durch Verbrauch erhöht das Budget nicht. Wachstum läuft weiter und vergrößert die Mahlzeit nicht. Überschüssiges Gras und überlebende Restbeute bleiben erhalten.

Bruttotransfer 4 bei Rate 8 braucht 30 Ticks; 8 braucht 60 Ticks. Der letzte Tick überträgt nur die Restmenge. Bei Tod oder fehlender Quelle endet eine Interaktion früher; es gibt keinen pauschalen Restbonus.

## Lokale Geometrie und Wiedergabe

`sampleAnimation(state)` ist eine reine Projektion. Jede Travel-Aktion besitzt absolute Kontakt-, Transfer- und Nachziehticks. Beim Transfer halten alle Spitzen. Nach vollständiger Aufnahme ziehen die beiden anderen einzeln nach, während die erste zur Endposition geht. Teilungshälften haben eigene Aktionen und können unterschiedlich lange saugen. Stirbt Beute vor Kontakt, speichert der Rückzug die exakt erreichte Spitzenform. Überlebende Restbeute wächst während des Rückzugs kontinuierlich zur normalen Radiusform zurück; ihre reduzierte Energie bleibt erhalten.

`Playback` akkumuliert aktive Realzeit × Zeitfaktor × 60. Bruchteile bleiben erhalten. Ein Frame rechnet höchstens 30 Ticks, ein Delta höchstens 250 ms Realzeit und der Akkumulator hält höchstens 120 offene Ticks. Tabpausen erzeugen keine unbeschränkte Nachholschleife. Unter Last darf die Realzeitwiedergabe langsamer werden, aber nach gleicher Tickzahl ist der Regelzustand identisch. Einzelschritt rechnet einen Tick und bleibt pausiert; Neustart verwirft Welt, Aktionen und Reservierungen, behält Pausemodus und Zeitfaktor.

## Browserprüfung

Bei laufendem Vite-Server:

```sh
node scripts/browser-check.mjs /pfad/zu/playwright/index.mjs /pfad/zu/chromium
```

Ein optionales viertes Argument ersetzt die lokale Basisadresse. Der Lauf prüft Tempooptionen, Tastatur/Mobilansicht, Einzeltick, Pause, Neustart und eigene Startkonfiguration. Die vier Zeitlupenfälle zeigen kurze/lange Grasaufnahme, gleichzeitige Teilung und überlebende Restbeute. Bilder stehen unter `.browser-check/local-actions-*.png`. Der Browserlauf prüft 36.000 Ticks, zeichnet 1.200 Zwischenbilder, misst 8×-Frames und schreibt `.browser-check/async-metrics.json`. CSS- und JS-Hot-Reload werden geprüft und die vorübergehenden Änderungen im finally-Block zurückgenommen. Eine einzelne Klickaktion nach JS-Aktualisierung muss weiterhin genau einen Tick erzeugen.

## Referenzmessung der Tickumstellung

Lokaler Prüflauf vom 19.10.2026, jeweils 36.000 Ticks mit Invariantenprüfung und zusätzlicher identischer Wiedergabe bei 1× und 8×:

| Fall | Startpopulation | Maximale Population | Mittlere Tickzeit einschließlich Invariantenprüfung |
| --- | --- | --- | --- |
| Standardfeld 30 × 20 | 10 + 10 | 383 | 0,46 ms |
| Dichtes Feld 30 × 20 | 100 + 80 | 405 | 0,58 ms |

Der separate Browserlauf erreichte 408 Bewohner und zeichnete 1.200 Zwischenbilder in 24,36 Sekunden Gesamtprüfzeit. Mittlere Zeichenzeit: 7,23 ms; längster gemessener Zeichenaufruf: 58,9 ms. Im kurzen 8×-Stresstest lag der längste kombinierte Tick-/Zeichenaufruf bei 72,4 ms. Das sind Messwerte dieses Rechners unter paralleler Testlast, keine garantierte Bildrate. Die feste Nachholgrenze schützt weiterhin vor unbeschränkter Arbeit pro Frame. Rohwerte stehen in `.browser-check/async-metrics.json`; `tests/long-run.test.ts` protokolliert beide Kernläufe mit reproduzierbaren Seeds.
