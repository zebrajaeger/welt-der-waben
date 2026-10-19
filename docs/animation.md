# Animationsdaten

`transition(state, config, random)` in `src/simulation.ts` liefert denselben Endzustand und verwendet dieselben Zufallsaufrufe wie `step`. Eingaben bleiben unverändert. `step` berechnet weiterhin nur den Regelzustand; Animationen entscheiden keine Ziele oder Konflikte.

Ein Übergang enthält unabhängige Kopien von `before`, `grown` (nach Graswachstum), `fed` (nach Grasfresseraufnahme und Verbrauch, vor Teilung), `herbivores` (nach der Grasfresserteilung), `hunted` (nach Jagd, vor Karnivorenverbrauch), `drained` (nach Karnivorenverbrauch, vor Teilung) und `after`. Diese Kopien halten auch Bewohner fest, die später verschwinden.

`events` enthält nur tatsächlich aufgelöste Aktionen in Phasenreihenfolge:

- `move`: Tier vor dem Zug und Zielzelle.
- `graze`: Grasfresser vor Aufnahme, Zellindex, Grasmenge, gekappte Energie nach Aufnahme und `afterDivision`; nur bei tatsächlich vorhandenem Gras. Die Aufzeichnung verändert weder Regeln noch Zufallsziehungen.
- `hunt`: Karnivor vor der Jagd, Beute an ihrer aktuellen Position samt aktueller Energie und `energyAfter` vor Verbrauch; die Beute-ID verknüpft Kontakt und Verschwinden eindeutig.
- `birth`: Eltern-ID, volle Ausgangsform (`parentBefore`), bisherige Hälfte nach der Verteilung (`parentAfter`), Nachwuchs mit `activeFrom` und Index der Ursprungszelle (`sourceCell`).
- `death`: Tier nach dem tödlichen Verbrauch.

Die Hälften im Geburtsereignis enthalten die gleichmäßig aufgeteilte Energie **vor** der Grasaufnahme an ihren Zielzellen. Die Snapshots `herbivores`, `hunted` und `after` enthalten anschließend die durch Zielgras erhöhte Energie. Die Darstellung zeigt zuerst die Halbierung, dann Grasaufnahme am gehaltenen Spitzenkontakt und erst danach das Nachziehen. Eine stehenbleibende Hälfte frisst nicht noch einmal; Verbrauch und Teilungsentscheidung werden nicht wiederholt. Karnivoren erhalten Beuteenergie auf Grundlage dieser bereits gefütterten Hälften.

Die Ereignisse tragen Kopien und teilen keine veränderlichen Tierobjekte mit Snapshots. Geburt und Jagd erzeugen keine zusätzlichen Zufallsziehungen für die Darstellung. Die Reihenfolge erlaubt insbesondere das Anzeigen eines Grasfressers, der erst zieht oder geboren wird und danach im selben Schritt gefressen wird.

## Geometrie und Zeit

`planAnimation` verbindet die Ereignisse mit der zuletzt sichtbaren Ausrichtung je Tier-ID. `sampleAnimation(plan, t)` liefert ein Bild für die normierte Zeit `0..1`; erneutes Abfragen verändert den Plan nicht. Spitzenkoordinaten verwenden den Hex-Radius als Einheit und werden erst beim Rendern in Pixel umgerechnet. Resize verändert damit die Projektion und erhält den Fortschritt.

| Bewegung | Erste Spitze zum Zentrum | Zweite Spitze | Dritte Spitze | Erste Spitze zur Endposition |
| --- | --- | --- | --- | --- |
| Grasfresser | 0–0,20 | 0,30–0,40 | 0,40–0,50 | 0,30–0,50 |
| Karnivor | 0,30–0,50 | 0,65–0,825 | 0,825–1 | 0,65–1 |

Erfolgreiche Jäger halten alle drei Spitzen von `t=0,50` bis `0,65` in ihrer Kontaktpose für das Aussaugen. `Motion.followStart` gibt den Beginn des Nachziehens an; bei gewöhnlichen Bewegungen entspricht er dem Spitzenkontakt. Bei anschließender Karnivorenteilung ziehen die zweite Spitze von `0,65–0,725` und die dritte von `0,725–0,80` nach; die führende Spitze bewegt sich parallel von `0,65–0,80` zur Endposition. Das Teilungsfenster `0,80–1` bleibt erhalten.

Bei `t=0,50` sind die Grasfresser angekommen. Ihre Energieabrechnung, Zielgrasaufnahme und Geburten sind abgeschlossen; dann treffen die erfolgreichen Karnivorenspitzen ein. Bis `t=0,65` wird die Beute ausgesaugt: Ihre Energie sinkt linear auf null und alle Spitzen schrumpfen relativ zu ihrem Zellzentrum auf null. Die Karnivorenenergie steigt gleichzeitig linear vom Jagdausgangswert zum bereits gekappten `energyAfter`. Wirkungsgrad und Energieobergrenze bleiben damit erhalten, auch bei Energiegewinn null. Erst bei `t=0,65` verschwindet die Beute vollständig und das Nachziehen beginnt. Energieverbrauch und Geburten der Karnivoren schließen wie bisher danach ab. `Playback.state` enthält bis `t=1` den letzten vollständig abgeschlossenen Schritt für die Statusanzeige.

`AnimationPlan.hunts` enthält ausschließlich aufgelöste Jagdereignisse. Zwischen Kontakt und Aussaugende ergänzt `sampleAnimation` sichtbare Beutekopien und interpoliert Jägerenergien, ohne Ereignisse oder Snapshots zu verändern. Wiederholtes, rückwärts gerichtetes oder ausgelassenes Sampling überträgt keine Energie zusätzlich. Die endgültige Beuteform aus Bewegung oder Teilung bleibt bis Kontakt erhalten und wird danach zum Kontaktzentrum skaliert. Am Aussaugende wird sie aus Zustand und Shapes des Frames entfernt, sodass auch die bei Nullenergie sonst üblichen Striche nicht übrig bleiben. Der vorhandene Renderer verwendet diese Spitzen unverändert.

Für teilende Tiere wird die normale Bewegung verkürzt: Grasfresser kommen bei `t=0,30` an und teilen bis `0,50`; Karnivoren saugen nach dem Jagdkontakt bis `0,65` aus, ziehen bis `0,80` nach und teilen bis `1`. Das Teilungsfenster beginnt mit kurzem Anschwellen der vollen Form, danach entstehen überlagert die beiden Formen und schreiten nacheinander mit ihren Spitzen hinaus. Bei Grasfressern sinkt die angezeigte Energie bis zum Spitzenkontakt zum halben Wert und steigt während der Grasaufnahme wieder; Karnivoren teilen ihre Energie wie bisher während der gesamten Teilung auf. Die Endausrichtung beider Hälften bleibt erhalten. Bei einer einzigen freien Zelle bleibt die bisherige Hälfte stehen; bei mindestens zwei ziehen beide aus dem Ursprung hinaus. Die Zielpaare werden zufällig und atomar ohne erneuten Versuch bei Konflikten aufgelöst.

`Playback.tick(timestamp)` benötigt monotone Zeitstempel in Millisekunden. Pause und Fortsetzen rechnen nur aktive Zeit an. Pro Takt entsteht genau ein Plan; ein verspätetes Bild schließt höchstens einen Takt ab und erzeugt keine Nachholwarteschlange. `frame` und `progress` sind lesend abfragbar. Die Browseranbindung verwaltet einen Frame-Callback, entsorgt ihn bei HMR und entfernt ihre Event-Listener.

`Playback.stepsPerSecond` zeigt das aktuelle Laufzeittempo. `setStepsPerSecond(value, timestamp)` akzeptiert positive endliche Werte: Bis zum Änderungszeitpunkt wird aktive Zeit mit dem bisherigen Tempo abgerechnet, anschließend nur neue Zeit mit dem neuen Tempo. Der normierte Fortschritt wird akkumuliert und springt beim Setzen nicht. Die Methode startet keinen neuen Übergang und verändert weder Regelkonfiguration noch Zufallsfolge. Ungültige Werte werden vor jeder Zeitabrechnung abgewiesen. Pause und Einzelschritt behalten ihren Modus; `reset` behält das gewählte Tempo. Eine neu konstruierte Steuerung beginnt wieder mit dem Konfigurationswert.

## Prüfung im Browser

Bei laufendem Vite-Server kann eine vorhandene Playwright-Installation verwendet werden:

```sh
node scripts/browser-check.mjs /pfad/zu/playwright/index.mjs /pfad/zu/chromium
```

Der Browserpfad ist optional, wenn die zur Playwright-Version passende Browserinstallation vorhanden ist. Ein optionales viertes Argument ersetzt `http://localhost:5173`. Der Check prüft Bedienung und Größenwechsel, erzeugt reproduzierbare Zwischenbilder in `.browser-check/animation-poses.png` sowie `.browser-check/division-poses.png` und zeichnet 600 vollständige Übergänge mit insgesamt 4.200 Zwischenbildern. Er prüft dabei Teilungen, Belegung, Energie, abgeschlossene Schrittzahlen und die Übereinstimmung von Endbild und Statuszustand. Eine kurzzeitige CSS-Änderung prüft Hot Reload und wird anschließend wiederhergestellt. `.browser-check/` ist von Git ausgeschlossen.

Der Browsercheck prüft zusätzlich Aussaugen bei 0,25 und 8 Schritten/s, pausierte und laufende Tempoänderungen sowie Größenwechsel während der Haltephase. Die Bilder in `.browser-check/predation-phases.png` und `.browser-check/predation-mobile.png` zeigen Kontakt, halbe Übertragung, restloses Aufzehren und Nachziehen einschließlich gejagter Teilungshälften.

Grasfresser halten ihre erste Spitze von `0,20–0,30` im Graszentrum. Das Grassymbol schrumpft währenddessen kontinuierlich und die Energie steigt bis zum aufgezeichneten Aufnahmewert. Vor einer Teilung ist die Bewegung auf `0–0,30` verkürzt: Kontakt `0,12`, Aussaugende `0,18`, zweite Spitze `0,24`. Hinausziehende Hälften halten von `0,398–0,432` und ziehen anschließend bis `0,50` nach. Die verbleibende Hälfte frisst nicht erneut. Stationäre Grasfresser nehmen in ihrer eigenen Zelle von `0,20–0,30` auf. Verbrauch bleibt am regulären Phasenabschluss; alle Endzustände bleiben identisch. `AnimationPlan.grazing` enthält die aus Ereignissen und Bewegungen bestimmten Aufnahmefenster.

Die Zeitlupenansicht unter `/scripts/grass-division-demo.html` zeigt über den Regler auch halbe Grasaufnahme. Die Browserbilder `grass-before-arrival.png`, `grass-suction-middle.png` und `grass-after-arrival.png` dokumentieren Kontakt, kontinuierliche Übertragung und vollständige Aufnahme vor dem Nachziehen.
