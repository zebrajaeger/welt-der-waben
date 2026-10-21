# Proposal

## Why

Wechselnde Vor- und Nachkommastellen lassen Zahlen und benachbarte Angaben im Verlaufsbereich springen. Das erschwert das Ablesen und kann bei knapper Breite sogar Zeilenumbrüche auslösen.

## What Changes

- Messwerte, Tickzahl und Zeitangaben erhalten feste Plätze, deren Abmessungen nicht mit dem angezeigten Zahlenwert wechseln.
- Anzahlwerte bleiben ganzzahlig; aktuelle Energie- und Zeitwerte werden einheitlich mit zwei Nachkommastellen angezeigt, mit deutschem Dezimalkomma und ausgerichteten Ziffern.
- Beschriftungen, Zahlenfelder und Diagrammfläche bleiben beim Wechsel der Stellenzahl stabil. Die Anordnung passt sich weiterhin an die Fensterbreite und die ausgewählten Reihen an.
- Auch sehr lange Zahlen werden innerhalb ihres reservierten Platzes lesbar dargestellt, statt Nachbarn zu verschieben oder abgeschnitten zu werden.
- Gezielte Browserprüfungen erfassen Positions- und Größenänderungen an Dezimal-, Zehner- und Tausenderübergängen.
- Nach Rückmeldung: Die X-Achse erhält eine feste Nachkommastelle und einen rechten Monospace-Anker. Kompakte Messwertzeilen, 160 Pixel Diagrammhöhe und ein geschlossener Detailbereich reduzieren den Platzbedarf; auf schmalen Fenstern steht das Diagramm vor den Optionen.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `simulation-history`: Zusätzlicher Vertrag für stabile Zahlenpositionen und konsistente Formatierung im bestehenden Verlaufsbereich.

## Impact

Betroffen sind primär `src/history-panel.ts`, `src/style.css` und gegebenenfalls die Struktur des Verlaufsbereichs in `index.html`. Ein kleines Formatierungsmodul sowie gezielte Tests ergänzen die Umsetzung. Die bestehenden Canvas-Anker in `src/history-chart.ts` werden auf Stabilität geprüft. Es sind keine neuen Abhängigkeiten oder Änderungen an Simulation, Historienaufnahme und gespeicherten Einstellungen vorgesehen.
