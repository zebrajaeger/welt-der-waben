# Design

## Context

Siehe `proposal.md` für das gemeldete Problem. Die Quelltextprüfung zeigt zwei passende Mechanismen: `src/history-panel.ts` formatiert alle Werte mit `maximumFractionDigits: 2`, jedoch ohne Mindestnachkommastellen. `src/style.css` verwendet für `#history-values` und `.history-readout` umbrechende Flexzeilen, deren Elementbreiten vom Inhalt abhängen. `tabular-nums` ist bereits gesetzt; es gleicht die Breite einzelner Ziffern an, reserviert aber keinen Platz für zusätzliche Stellen.

Die Canvas-Fläche hat bereits eine feste Höhe und feste seitliche Zeichenabstände. `src/history-chart.ts` setzt Zahlen an feste Zeichenkoordinaten; diese Anker sollen erhalten bleiben. Die bestehenden Tests in `e2e/history.pw.ts` prüfen Größenanpassung und Werte, vergleichen jedoch keine Feldpositionen über gezielte Stellenwechsel. Die Ursache ist hier aus dem Quelltext eingegrenzt, noch nicht durch einen gezielten Browser-Reproduktionstest bestätigt; dieser ist der erste Umsetzungsschritt. Wegen der ausdrücklich angeforderten Planung erfolgen jetzt weder Codekorrektur noch Regressionstest im Projektcode.

## Goals / Non-Goals

**Goals:** Ein vom Inhalt unabhängiges Layout der Messwerte und Zeitangaben, feste Präzision der aktuellen Werte und ein messbarer Positionsvergleich vor und nach Stellenwechseln.

**Non-Goals:** Glätten oder Einfrieren der automatischen Y-Skalierung, Änderungen an Kurvenbewegung und Zeitprojektion, zusätzliche Einstellungen oder Änderungen der Messwerte. Responsive Umordnung nach tatsächlicher Größen- oder Auswahländerung bleibt möglich.

## Decisions

### 1. Feste Zahlenplätze und vom Inhalt unabhängige Zeilen

`#history-values` wird zu einem responsiven Raster mit gleich bemessenen Messwertgruppen. Innerhalb jeder Gruppe stehen Beschriftung und Zahl in getrennten, stabilen Bereichen; die Zahl erhält eine feste Breite, Rechtsausrichtung, `white-space: nowrap` und `font-variant-numeric: tabular-nums`. Auf schmalen Fenstern werden die Gruppen einspaltig mit der Beschriftung oberhalb des Wertes angeordnet; so passen lange deutsche Bezeichnungen und ein ausreichend breites Zahlenfeld zusammen. Anzahl der Spalten und Gruppenhöhen hängen von Containerbreite und Auswahl ab, nicht vom aktuellen Wert.

Tick, aktuelle Sekunden sowie Anfang und Ende des aufbewahrten Zeitraums erhalten jeweils eigene Zahlenelemente. Die bisher zusammengesetzten Textzeilen werden in Beschriftungen, Zahlen und Einheiten aufgeteilt. `.history-readout` erhält ein Raster mit vorhersehbaren Zeilen; im schmalen Layout darf der Textteil „Aufgezeichneter Verlauf“ eine eigene feste Zeile belegen. Zahlen werden nicht mitten im Feld umgebrochen. Der Maximalhinweis ist statischer Text.

Planungswerte: zwölf Ziffernbreiten für aktuelle Messwerte und sechzehn für Tick- und Sekundenfelder. Ein passender Monospace-Font nur in diesen Feldern macht die reservierte Zeichenkapazität zuverlässig; die übrige Oberfläche behält ihren Systemfont. Größere Abstände sind einem inhaltsabhängigen Nachrücken vorzuziehen. Nur Tabellensatzziffern oder feste Nachkommastellen würden das Wachsen von 99 auf 100 allein nicht lösen. Eine während des Laufs wachsende Mindestbreite würde beim ersten Überschreiten weiterhin einen Sprung erzeugen und wird deshalb verworfen.

### 2. Kleine, reine Formatierung nach Werttyp

Ein neues `src/history-format.ts` kapselt Zahlenausgabe für Anzahl/Tick und Energie/Sekunden. Anzahlen sind Ganzzahlen; Energien und Sekunden erhalten im normalen Format `minimumFractionDigits: 2` und `maximumFractionDigits: 2`. Die bisherigen deutschen Trennzeichen bleiben erhalten. Der Formatter liefert kurze sichtbare Ausgabe und vollständige Ausgabe getrennt; er schreibt weder Messwerte noch Historie um.

Passt die normale Ausgabe nicht in die definierte Zeichenkapazität, wird eine wissenschaftliche Darstellung mit begrenzter Mantisse verwendet. Auch diese Ausgabe wird auf die Kapazität geprüft. Der vollständige Wert entsprechend der Anzeigepräzision steht als zugänglicher Name und über ein `title` am Wert zur Verfügung. Die Kurzschreibweise bekommt dieselbe Einheit. Bloßes Abschneiden oder eine kleiner werdende Schrift würde Werte verbergen beziehungsweise neue Unruhe erzeugen.

Canvas-Achsen dürfen ihre vorhandene Präzision und automatische Skalierung behalten: die Anker müssen zahlenunabhängig bleiben. Eine Änderung der Canvas-Formatierung ist nur nötig, wenn die gezielte Reproduktion dort ebenfalls einen Stellenwechsel-bedingten Positionsfehler nachweist; eine allgemeine Neugestaltung der Achsen gehört nicht dazu.

### 3. Deterministische Browserprüfung statt Zufallslauf

Ein gezielter Check nach dem Muster der vorhandenen `scripts/check-*.mjs` lädt im Entwicklungsserver eine isolierte Testseite mit dem echten Panel, echtem Stylesheet und echter `History`. Über kontrollierte Zustände und `refresh()` entstehen nacheinander kurze und lange Zahlen. Kein öffentliches Debug-API und keine zusätzlichen Bedienelemente werden dafür eingeführt. Die produktive Simulation wird für diese Prüfung nicht umgeschrieben.

Vor der Korrektur müssen `getBoundingClientRect()`-Vergleiche der Zahlenfelder und Nachbarbeschriftungen einen Sprung nachweisen. Nachher müssen Positionen und Abmessungen bei gleichem Viewport und gleicher Auswahl innerhalb eines CSS-Pixels gleich bleiben. Neben 9,99/10,00 und 999,99/1.000,00 werden ganze, ein- und zweistellige Nachkommanteile, Tickgrenzen und der Überlauf in die Kurzschreibweise geprüft. Die Messung erfolgt relativ zum Panel, damit Scrollbewegungen das Ergebnis nicht verfälschen. Screenshots ergänzen diese Prüfung, ersetzen sie aber nicht.

Bestehende produktionsbezogene Prüfungen in `e2e/history.pw.ts` werden auf die neue Präzision und DOM-Struktur angepasst. Ihre Aussagen zu Pause, Neustart und Datenaufnahme bleiben erhalten. Ein kurzer dokumentierter Befehl muss den neuen Check wiederholbar ausführen können.

## Risks / Trade-offs

- Mehr reservierter Platz → Einspaltige Messwertgruppen und begrenztes Scrollen im Panel bei kleinen Fenstern; keine Breitenberechnung aus laufenden Zahlen.
- Neue Nachkommastellen ändern bisherige Textassertionen wie „0 s“ → Browserprüfungen gezielt auf „0,00 s“ anpassen und echte Werte weiterhin prüfen.
- Sehr große Konfigurationswerte oder Laufzeiten überschreiten übliche Stellenzahlen → Getestete Kurzschreibweise in derselben Feldbreite; vollständiger Wert bleibt zugänglich.
- Verwechslung von Layoutsprung und beabsichtigter Y-Autoskalierung → Reproduktion misst Feldgeometrie und Beschriftungsanker; Kurven dürfen sich mit Daten und Skala weiterhin bewegen.

## Migration Plan

Keine Datenmigration. Auslieferung über den vorhandenen statischen Build; Rücknahme betrifft nur Formatierung und Darstellung. Gespeicherte Einstellungen und laufbezogene Rohdaten behalten ihr Format.

## Korrektur nach Rückmeldung

Die Rückmeldung nach der ersten Umsetzung ersetzt die oben vorgeschlagene mehrzeilige Standardanordnung: Messwertbezeichnung und festes Zahlenfeld stehen nun in derselben Zeile; zusätzliche Zeitangaben und Erklärtexte liegen im standardmäßig geschlossenen Unterbereich „Details“. Die Diagrammhöhe sinkt von 220 auf 160 Pixel, die Inhaltsgrenze von 44 Prozent Fensterhöhe auf das Minimum aus 320 Pixel und 38 Prozent Fensterhöhe. Dies erhält die festen Zahlenbreiten und gibt der Simulation wieder mehr Platz.

Die X-Achse gehört ausdrücklich zur Korrektur: mindestens und höchstens eine Nachkommastelle, Monospace-Schrift und rechter Textanker. Der Browsercheck zeichnet die tatsächlichen Canvas-Textaufrufe auf und prüft ganze sowie gebrochene Sekunden in beiden Modi. Zusätzlich prüft er das Höhenbudget der geschlossenen Detailansicht.

## Positionsbezogene Werte statt Messwertzeile

Auf erneute Rückmeldung entfällt die Messwertzeile vollständig. Das Panel erzeugt ein außerhalb des scrollenden Panels am Dokumentkörper befestigtes Tooltip mit Zeit, Tick und sämtlichen fünf Reihen. Feste Positionierung und `pointer-events: none` verhindern zusätzlichen Layoutplatz, Abschneiden im Panel und das Abfangen der Maus. Die Position wird am Fensterrand gespiegelt beziehungsweise begrenzt.

`historySampleAt` rechnet die horizontale Plotposition in einen Tick um und sucht diesen binär in den numerischen Originaldaten. Im Umlaufmodus entscheidet die Cursorposition über aktuellen oder vorherigen Umlauf; auf der rechten Randposition wird der letzte Tick des vorherigen Umlaufs verwendet. Vorhandene Lücken und Zeit vor Laufbeginn liefern keine Werte. `historyPlot` teilt die Geometrie zwischen Zeichnung und Trefferprüfung.

Das Panel speichert die letzte Mausposition in Fensterkoordinaten. Bei jedem neu gezeichneten Zustand wird die Zuordnung auch ohne Mausereignis neu berechnet; Pointerbewegung, Modus-/Spannenwechsel, Resize und Scrollen berücksichtigen dieselbe Abfrage. Bei Pause bleibt die Abfrage stabil. Verlassen, Schließen, Escape und Aufräumen entfernen das Tooltip; Tastaturfokus und Pfeiltasten erlauben zusätzlich das Erkunden ohne Maus.
