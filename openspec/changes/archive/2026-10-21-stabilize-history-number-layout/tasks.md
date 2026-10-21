# Tasks

## 1. Gezielte Reproduktion und Zahlenformat

- [x] 1.1 Einen deterministischen Browsercheck mit echtem `createHistoryPanel`, echtem Stylesheet und kontrollierten Historienzuständen nach dem Muster der vorhandenen `scripts/check-*.mjs` ergänzen. Vor der Korrektur einen gemessenen Positions- oder Größensprung an Stellenwechseln nachweisen; die Ausgabe muss betroffene Felder und Pixelabweichung nennen. Den ausführbaren Befehl bei den Entwicklungshinweisen dokumentieren.
- [x] 1.2 `src/history-format.ts` für ganzzahlige Anzahl-/Tickwerte, Energie-/Sekundenwerte mit genau zwei Nachkommastellen und kapazitätsbegrenzte wissenschaftliche Kurzschreibweise erstellen. Mit `tests/history-format.test.ts` Null, 9,99/10,00, 99,99/100,00, 999,99/1.000,00, ganze/ein-/zweistellige Nachkommanteile und große endliche Werte prüfen; vollständige Ausgabe muss erhalten bleiben und alle Kurztexte müssen in die jeweilige Kapazität passen.

## 2. Stabiles Panel-Layout

- [x] 2.1 Messwertgruppen in `src/style.css` auf ein inhaltsunabhängiges responsives Raster mit festen, rechts ausgerichteten Zahlenplätzen umstellen; Beschriftungen müssen auf schmalen Fenstern vorhersehbare eigene Zeilen erhalten. Den Browsercheck aus 1.1 für alle fünf Reihen bei 1440 × 900, 360 × 740 und 360 × 480 erweitern und höchstens einen CSS-Pixel Abweichung vor/nach Stellenwechseln nachweisen.
- [x] 2.2 In `src/history-panel.ts` und bei Bedarf `index.html` Tick, aktuelle Sekunden und beide Zeitraumgrenzen in getrennte feste Felder zerlegen und den Formatter einbinden. Vollständige Werte zugänglich und per zusätzlicher Wertauskunft bereitstellen. Den Browsercheck auf Zeit-/Tickgrenzen, lange Zahlen, Rückwechsel sowie beide Darstellungsmodi erweitern; Nachbarn und Diagrammfläche dürfen sich bei bloßer Werteänderung nicht bewegen.
- [x] 2.3 `e2e/history.pw.ts` an feste Nachkommastellen und neue Textstruktur anpassen, ohne bestehende Verhaltensprüfungen abzuschwächen. Reale Aktualisierungen, Pause, Einzelschritt, Modus-/Auswahlwechsel und Resize prüfen. Screenshots vor/nach Stellenwechseln bei breitem und schmalem Fenster visuell prüfen; Werte und Beschriftungen müssen vollständig lesbar und ohne horizontales Seitenscrolling erreichbar bleiben. `README.md` und `README.de.md` um die feste Anzeigepräzision und mögliche Kurzschreibweise ergänzen.

## 3. Gesamtprüfung

- [x] 3.1 Den dokumentierten Browsercheck, `npm test`, `npm run build` und `npm run test:production` ausführen. Die ursprüngliche Sprungreproduktion muss nach der Korrektur bestehen, und alle bestehenden Verlaufs-, Wiedergabe- und Einstellungsprüfungen müssen grün bleiben; Ergebnis und Vergleichsbilder im Change dokumentieren.

## 4. Korrektur nach Rückmeldung

- [x] 4.1 Standardansicht mit einzeiligen Messwertgruppen, 160 Pixel Diagrammhöhe und geschlossenem Detailbereich kompakter gestalten; X-Achse mit einer festen Nachkommastelle und rechtem Monospace-Anker korrigieren. Mit aufgezeichneten Canvas-Textaufrufen, Höhenbudget, Größenvergleich und bestehenden Produktions-Browserprüfungen verifizieren; kompakte Ansicht visuell prüfen und Ergebnisse aktualisieren.

## 5. Positionsbezogenes Tooltip

- [x] 5.1 Messwertzeile durch schwebendes Tooltip mit Zeit, Tick und allen fünf Originalwerten ersetzen; Zuordnung in beiden Modi, leere Bereiche und Aktualisierung bei stillstehender Maus prüfen. Fensterbegrenzung, Pause, Verlassen, Escape und Tastaturbedienung berücksichtigen; Layoutcheck, Unit-Tests und Produktionsprüfungen ausführen und Dokumentation aktualisieren.
