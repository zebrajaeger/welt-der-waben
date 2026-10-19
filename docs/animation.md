# Animationsdaten

`transition(state, config, random)` in `src/simulation.ts` liefert denselben Endzustand und verwendet dieselben Zufallsaufrufe wie `step`. Eingaben bleiben unverändert. `step` berechnet weiterhin nur den Regelzustand; Animationen entscheiden keine Ziele oder Konflikte.

Ein Übergang enthält unabhängige Kopien von `before`, `grown` (nach Graswachstum), `fed` (nach Grasfresseraufnahme und Verbrauch, vor Teilung), `herbivores` (nach der Grasfresserteilung), `hunted` (nach Jagd, vor Karnivorenverbrauch), `drained` (nach Karnivorenverbrauch, vor Teilung) und `after`. Diese Kopien halten auch Bewohner fest, die später verschwinden.

`events` enthält nur tatsächlich aufgelöste Aktionen in Phasenreihenfolge:

- `move`: Tier vor dem Zug und Zielzelle.
- `hunt`: Karnivor vor der Jagd, Beute an ihrer aktuellen Position samt aktueller Energie und `energyAfter` vor Verbrauch; die Beute-ID verknüpft Kontakt und Verschwinden eindeutig.
- `birth`: Eltern-ID, volle Ausgangsform (`parentBefore`), bisherige Hälfte nach der Verteilung (`parentAfter`), Nachwuchs mit `activeFrom` und Index der Ursprungszelle (`sourceCell`).
- `death`: Tier nach dem tödlichen Verbrauch.

Die Hälften im Geburtsereignis enthalten die gleichmäßig aufgeteilte Energie **vor** der Grasaufnahme an ihren Zielzellen. Die Snapshots `herbivores`, `hunted` und `after` enthalten anschließend die durch Zielgras erhöhte Energie. Auf diese Weise zeigt die Darstellung zuerst die Halbierung und erst beim Ankommen den Energiegewinn sowie das Verschwinden des Grases. Eine stehenbleibende Hälfte frisst nicht noch einmal; Verbrauch und Teilungsentscheidung werden nicht wiederholt. Karnivoren erhalten Beuteenergie auf Grundlage dieser bereits gefütterten Hälften.

Die Ereignisse tragen Kopien und teilen keine veränderlichen Tierobjekte mit Snapshots. Geburt und Jagd erzeugen keine zusätzlichen Zufallsziehungen für die Darstellung. Die Reihenfolge erlaubt insbesondere das Anzeigen eines Grasfressers, der erst zieht oder geboren wird und danach im selben Schritt gefressen wird.

## Geometrie und Zeit

`planAnimation` verbindet die Ereignisse mit der zuletzt sichtbaren Ausrichtung je Tier-ID. `sampleAnimation(plan, t)` liefert ein Bild für die normierte Zeit `0..1`; erneutes Abfragen verändert den Plan nicht. Spitzenkoordinaten verwenden den Hex-Radius als Einheit und werden erst beim Rendern in Pixel umgerechnet. Resize verändert damit die Projektion und erhält den Fortschritt.

| Bewegung | Erste Spitze zum Zentrum | Zweite Spitze | Dritte Spitze | Erste Spitze zur Endposition |
| --- | --- | --- | --- | --- |
| Grasfresser | 0–0,20 | 0,20–0,35 | 0,35–0,50 | 0,20–0,50 |
| Karnivor | 0,30–0,50 | 0,50–0,75 | 0,75–1 | 0,50–1 |

Bei `t=0,50` sind die Grasfresser angekommen. Ihre Energieabrechnung und Geburten sind abgeschlossen, dann treffen die erfolgreichen Karnivorenspitzen ein und die jeweilige Beute verschwindet. Karnivoren folgen mit ihrem Körper; ihre Energieabrechnung und Geburten schließen bei `t=1` ab. `Playback.state` enthält bis dahin den letzten vollständig abgeschlossenen Schritt für die Statusanzeige.

Für teilende Tiere wird die normale Bewegung verkürzt: Grasfresser kommen bei `t=0,30` an und teilen bis `0,50`; Karnivoren ziehen nach dem Jagdkontakt bis `0,80` nach und teilen bis `1`. Das Teilungsfenster beginnt mit kurzem Anschwellen der vollen Form, danach entstehen überlagert die beiden Formen und schreiten nacheinander mit ihren Spitzen hinaus. Die angezeigte Energie sinkt dabei kontinuierlich zum halben Wert. Die Endausrichtung beider Hälften bleibt erhalten. Bei einer einzigen freien Zelle bleibt die bisherige Hälfte stehen; bei mindestens zwei ziehen beide aus dem Ursprung hinaus. Die Zielpaare werden zufällig und atomar ohne erneuten Versuch bei Konflikten aufgelöst.

`Playback.tick(timestamp)` benötigt monotone Zeitstempel in Millisekunden. Pause und Fortsetzen rechnen nur aktive Zeit an. Pro Takt entsteht genau ein Plan; ein verspätetes Bild schließt höchstens einen Takt ab und erzeugt keine Nachholwarteschlange. `frame` und `progress` sind lesend abfragbar. Die Browseranbindung verwaltet einen Frame-Callback, entsorgt ihn bei HMR und entfernt ihre Event-Listener.

## Prüfung im Browser

Bei laufendem Vite-Server kann eine vorhandene Playwright-Installation verwendet werden:

```sh
node scripts/browser-check.mjs /pfad/zu/playwright/index.mjs /pfad/zu/chromium
```

Der Browserpfad ist optional, wenn die zur Playwright-Version passende Browserinstallation vorhanden ist. Ein optionales viertes Argument ersetzt `http://localhost:5173`. Der Check prüft Bedienung und Größenwechsel, erzeugt reproduzierbare Zwischenbilder in `.browser-check/animation-poses.png` sowie `.browser-check/division-poses.png` und zeichnet 600 vollständige Übergänge mit insgesamt 4.200 Zwischenbildern. Er prüft dabei Teilungen, Belegung, Energie, abgeschlossene Schrittzahlen und die Übereinstimmung von Endbild und Statuszustand. Eine kurzzeitige CSS-Änderung prüft Hot Reload und wird anschließend wiederhergestellt. `.browser-check/` ist von Git ausgeschlossen.
