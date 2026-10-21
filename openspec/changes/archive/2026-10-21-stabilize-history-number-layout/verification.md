# Prüfung vom 21.10.2026

## Fehlernachweis und Korrektur

`node scripts/check-history-layout.mjs` führte vor der Korrektur reproduzierbar zu 462 Positions-/Größenabweichungen. Beispiel bei 1440 × 900 im Modus „Wandernde Kurven“: Energiegruppen verschoben sich beim Wechsel von 10 zu 10,56 um 15,55 beziehungsweise 31,09 CSS-Pixel. Der Check verwendete das tatsächliche Panel, Stylesheet und Historienmodul auf einer isolierten Browserroute.

Nach der Korrektur besteht derselbe Check mit **0 Abweichungen und 0 Browserfehlern**. Getestet werden beide Modi bei 1440 × 900, 360 × 740 und 360 × 480, alle fünf Messreihen, vier Zeit-/Tickfelder und Stellenwechsel bei 10, 100, 1.000 sowie sehr großen Werten und dem Rückwechsel. Zusätzliche Prüfungen sichern Textbreite, Tooltip mit vollständigem Wert, zugängliche Langfassung und fehlende horizontale Seitenüberbreite. Der gezielte Check startet und beendet seinen eigenen lokalen Server und Browser.

Die Ursache lag in vom Inhalt abhängigen Flexzeilen sowie wechselnder Nachkommastellenzahl. Ein responsives Raster, feste rechtsbündige Zahlenfelder und getrennte Zeit-/Tickfelder verhindern die Positionswechsel. Automatische Kurvenskalierung und Canvas-Projektion bleiben erhalten; Rohdaten werden nicht gerundet.

## Vergleichsbilder

Die Bilder zeigen Stellenwechsel **innerhalb der korrigierten Oberfläche**, jeweils bei unverändertem Layout. Die Scrollbegrenzung des Panels wurde ausschließlich für die Aufnahme aufgehoben, damit sämtliche Werte sichtbar sind. Die Pixelvergleiche laufen mit den regulären Scrollbegrenzungen.

- Desktop, vor Stellenwechsel: [999,99](verification/history-stable-1440-scroll-before.png)
- Desktop, nach Stellenwechsel: [1.000,00](verification/history-stable-1440-scroll-after.png)
- Smartphone mit umlaufendem Cursor, vor Stellenwechsel: [999,99](verification/history-stable-360-sweep-before.png)
- Smartphone mit umlaufendem Cursor, nach Stellenwechsel: [1.000,00](verification/history-stable-360-sweep-after.png)

Alle vier Bilder wurden visuell geprüft: Beschriftungen und Zahlen sind lesbar; Zahlenfelder, Zeitraumangaben und Nachbarn bleiben an derselben Stelle.

## Gesamtprüfungen

- `npm test`: 119 Tests in 15 Dateien bestanden, einschließlich 20 neuer Formatierungsfälle und bestehender Langzeitprüfungen.
- `npm run build`: TypeScript und Vite-Produktionsbuild bestanden.
- `npm run test:production`: 13 Chromium-Prüfungen bestanden, einschließlich Verlaufsaufnahme über 300 Simulationssekunden bei 8×, Pause, Einzelschritt, Neustart, Modus-/Auswahlwechsel, Resize, hoher Pixeldichte und bestehender Einstellungs-/Pages-Prüfungen.
- `openspec validate stabilize-history-number-layout --strict`: bestanden.
- `git diff --check`: keine Whitespace-Fehler.

## Korrektur nach Rückmeldung zum Platzbedarf und zur X-Achse

Der ergänzte Browsercheck schlug vor der zweiten Korrektur auf dem tatsächlichen Canvas-Pfad fehl: Bei ganzen Sekunden lauteten die Achsenwerte beispielsweise „960“, bei gebrochenen Sekunden war eine Nachkommastelle vorhanden; die Schrift war proportional und zentriert. Jetzt werden genau eine Nachkommastelle, Monospace-Ziffern, rechter Textanker und gleiche Zeichenpositionen für Tick 59.999, 60.000 und 60.006 in beiden Modi geprüft. Alle Prüfungen bestehen.

Der Panelinhalt ist bei 1440 × 900 nur noch **304 Pixel** hoch (vorher maximal 396 Pixel); bei 360 × 480 sind es **182 Pixel**. Das Diagramm ist 160 Pixel hoch. Tick/Zeitraum und Erklärungen sind unter „Details“ erreichbar und anfangs eingeklappt. Messwertnamen und ihre festen Zahlenfelder stehen in einer gemeinsamen Zeile. Auf schmalen Fenstern erscheint das Diagramm vor den weiteren Optionen; seine vollständige Sichtbarkeit in der kompakten Ausgangsansicht ist automatisiert geprüft.

Aktuelle Standardansichten wurden zusätzlich visuell geprüft:

- [Kompakte Desktopansicht](verification/history-compact-1440.png)
- [Kompakte Smartphoneansicht](verification/history-compact-360.png)

Der Positionscheck meldet weiterhin null Abweichungen und null Browserfehler. Die vier gezielten Produktionsprüfungen für Werte/Bedienung, Wiedergabe, responsive Größenanpassung und Pixeldichte bestehen auch mit geschlossenem beziehungsweise geöffnetem Detailbereich.

Abschließend erneut geprüft: 119 Unit-Tests und Produktionsbuild bestanden. Von den 13 Produktions-Browserprüfungen bestanden zunächst zwölf; der Langzeittest las den jetzt eingeklappten Zeitbereich noch als sichtbaren Text. Nach Ergänzung des tatsächlichen Bedienschritts „Details öffnen“ bestand auch dieser Test erneut über mehr als 300 Simulationssekunden bei 8× (44,7 Sekunden Testlaufzeit). Alle 13 Browserprüfungen sind damit erfolgreich geprüft.

## Positionsbezogenes Tooltip nach erneuter Rückmeldung

Die Messwertzeile ist vollständig entfernt. Ein Tooltip zeigt am Mauszeiger Zeit, Tick und alle fünf Messwerte der zugehörigen horizontalen Diagrammposition. Die Werte werden aus der ursprünglichen Historie gelesen, auch bei ausgeblendeten Kurven. Der Zeigerstand wird bei jeder neuen Zeichnung erneut auf die aktuelle Zeitprojektion abgebildet. Im Umlaufmodus werden aktueller und vorheriger Umlauf getrennt zugeordnet; leere Zeitbereiche liefern kein Tooltip.

Der neue Produktionstest hält die Maus ohne weitere Mausereignisse fest und lässt eine weitere Realzeitsekunde bei 2× verstreichen: Der angezeigte Tick erhöht sich entsprechend um rund 120, während das Overlay an derselben Fensterposition bleibt. Zusätzlich geprüft: Pause hält die Anzeige fest, beide Seiten des Umlaufcursors liefern ihre jeweiligen historischen Ticks, Verlassen blendet aus, Neustart erfindet keine Historie. Tastaturfokus und Escape sind ebenfalls geprüft. Die Tooltip-Position bleibt im Fenster. [Visuell geprüfte Tooltip-Ansicht](verification/history-tooltip.png).

Abschließender Stand: **121 Unit-Tests**, **14 Produktions-Browserprüfungen**, TypeScript-/Vite-Build und strenge OpenSpec-Validierung erfolgreich. Der Layoutcheck hat weiterhin null Abweichungen; ohne Messwertzeile liegt die Desktop-Inhaltshöhe jetzt bei **284 Pixeln**.

Die abschließende Ergänzung „Σ“ vor allen drei Energiezeilen wurde mit einem erneuten Produktionsbuild und dem gezielten Tooltip-Browsercheck geprüft; beide erfolgreich.
