# Proposal

## Why

Beim Jagdkontakt verschwindet der Grasfresser derzeit sofort, während der Karnivor seine gesamte Beuteenergie auf einmal erhält. Ein sichtbares Aussaugen soll den Übergang vom Kontakt zur Energieaufnahme nachvollziehbar machen.

## What Changes

- Beim Erreichen des Beutezentrums beginnt eine eigene Aussaugphase: Die Beute wird kontinuierlich leerer und zieht sich bis zum vollständigen Verschwinden zum Kontaktpunkt zusammen.
- Gleichzeitig steigt die dargestellte Energie des Karnivoren kontinuierlich bis zum bereits berechneten Jagdergebnis.
- Während dieser Phase bleibt die führende Spitze im Beutezentrum; auch die beiden anderen Spitzen warten. Erst nach vollständigem Aussaugen folgen die bisherigen Nachziehbewegungen und die führende Spitze erreicht ihre Endposition.
- Bewegte, stehende und gerade geteilte Beute sowie parallele Jagden verwenden denselben Ablauf. Pause, Tempoänderung und Größenwechsel erhalten den Fortschritt.
- Die Phase passt in das bestehende Schrittintervall; Energieeffizienz, Obergrenze, Verbrauch, Teilungsregeln und Zufallsfolge bleiben erhalten.
- Auch Gras wird beim Spitzenkontakt kontinuierlich ausgesaugt. Der Grasfresser erhält die Energie während der Haltephase und vollendet anschließend den Schritt; das gilt ebenfalls für hinausziehende Teilungshälften.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `simulation-presentation`: Gras- und Jagdkontakt starten kontinuierliches Aussaugen; die weitere Spitzenbewegung wartet auf den Abschluss der Energieübertragung.

## Impact

- `src/animation.ts`: Kontakt-Haltephase, Rekonstruktion noch sichtbarer Beute und zeitabhängige Energie-/Formdarstellung aus bestehenden Jagdereignissen.
- `src/simulation.ts`: Grasaufnahme als zusätzliches Ereignis mit Ausgangsenergie, Grasmenge und gekapptem Zielwert aufzeichnen; identische Regelresultate und Zufallsfolge erhalten.
- `src/render.ts`: Darstellung bis auf null schrumpfender Beute mit vorhandenen Spitzenkoordinaten prüfen; zusätzliche Effekte sind nicht erforderlich.
- `tests/animation.test.ts`, `tests/playback.test.ts`, `scripts/browser-check.mjs` und `scripts/check-speed.mjs`: bisherige Annahmen zum sofortigen Verschwinden ersetzen und Phasenübergänge absichern.
- `docs/animation.md` und bei Bedarf README: neue Zeitleiste und sichtbarer Ablauf.
- Keine neuen Abhängigkeiten, Bedienelemente oder Änderungen an den Simulationsregeln.
