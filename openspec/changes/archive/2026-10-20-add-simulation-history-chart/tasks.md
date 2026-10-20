# Tasks

## 1. Messwerte und begrenzte Historie

- [x] 1.1 `src/history.ts` mit fünf Aggregaten aus dem tatsächlichen `State` erstellen; in `tests/history.test.ts` bekannte Summen, leere Populationen, gefangene Beute und Teilungsaktionen ohne Doppelzählung prüfen.
- [x] 1.2 Numerischen Ringpuffer mit Anfangszustand, chronologischer Abfrage und maximal 18.001 Messpunkten umsetzen; über mehr als 18.001 Ticks prüfen, dass Randwerte stimmen, ältere Werte entfallen und keine Weltzustandsreferenzen gespeichert werden.
- [x] 1.3 Optionalen Tickbeobachter in `src/playback.ts` ergänzen, normale Schritte und Einzelschritt darüber führen; `tests/playback.test.ts` um Mehrfachticks pro Bild, Nachholen bei Pause/Tempowechsel, Pause ohne Duplikate sowie identische Historien bei gleicher Tickzahl und Zufallsfolge erweitern. Mit `npm test -- tests/history.test.ts tests/playback.test.ts` verifizieren.

## 2. Diagrammprojektion und Zeichnen

- [x] 2.1 In `src/history-chart.ts` wanderndes Zeitfenster und beide Segmente des Cursorumlaufs berechnen; mit `tests/history-chart.test.ts` Beginn bei null, exakte Umlaufgrenzen, alten rechten Abschnitt, fehlende Verbindungen über Grenzen und Moduswechsel aus denselben Daten prüfen.
- [x] 2.2 Zeitspannen 10/30/60/120/300, relative Bewegung und Skalen für Anzahl/Energie umsetzen; Tests müssen doppelte Bewegung bei 60 → 30, unveränderte Rohdaten, getrennte Maxima, abgewählte Reihen und ausschließlich Nullwerte abdecken.
- [x] 2.3 Canvas-Darstellung mit Zeitlabels je Umlaufabschnitt, Cursor, Linienmustern und Verdichtung je Pixelspalte implementieren; Tests müssen Reihenfolge und Erhalt von Min/Max-Peaks auch an Umlaufgrenzen prüfen. `npm test -- tests/history-chart.test.ts` ausführen.

## 3. Verlaufsbox und Anbindung

- [x] 3.1 In `index.html`, `src/style.css` und `src/history-panel.ts` native Verlaufsbox, fünf Checkboxen, Modus- und Zeitspannenauswahl, Legende, Textwerte und leeren Auswahlhinweis erstellen. Playwright-Prüfungen in `e2e/history.pw.ts` für Standards, Tastaturbedienung, Mehrfachauswahl und beide gleichzeitig geöffneten Boxen ergänzen.
- [x] 3.2 Historie und Panel in `src/main.ts` verbinden: Aufnahme auch geschlossen, Anfangswert bei Start, Reset bei Neustart/erfolgreicher Übernahme und Erhalt der Diagrammoptionen. Browserprüfungen für spätes Öffnen, Pause, Einzelschritt, beide Modi, Zeitspannenwechsel, Neustart sowie Konfigurationsübernahme ergänzen; Speichern und Formularimport dürfen keinen Reset verursachen.
- [x] 3.3 ResizeObserver, Pixeldichte und Aufräumen bei HMR anbinden; bei 1440 × 900, 360 × 740 und 360 × 480 beide Panels einschließlich Pause prüfen. Playwright muss positive Canvasgrößen, mindestens 160 Pixel Spielfeldhöhe, erreichbare Optionen und fehlendes horizontales Seitenscrolling bestätigen; Screenshots beider Modi visuell auf Labels und Segmentgrenzen prüfen.
- [x] 3.4 Bedienung und Zeitbasis in `README.md` und `README.de.md` ergänzen: Messreihen, zwei Modi, kürzere Zeitspanne bedeutet schnellere Bewegung, 300 Sekunden Aufbewahrung sowie Verhalten bei neuem Lauf und Reload. Dokumentierte Labels und Standardwerte mit der Oberfläche abgleichen.

## 4. Gesamtprüfung

- [x] 4.1 `npm test`, `npm run build` und `npm run test:production` ausführen; vorhandene Wiedergabe-, Einstellungen-, Quellcode-Link- und Pages-Prüfungen müssen zusammen mit den neuen Verlaufsprüfungen bestehen.
- [x] 4.2 Einen Standardlauf bei 8× über mindestens 300 Simulationssekunden mit geöffnetem Verlauf prüfen: Speicherzahl bleibt begrenzt, Moduswechsel bleibt bedienbar, nach Schließen und Wiederöffnen stimmt der aktuelle Verlauf. Ergebnis und visuelle Prüfung beider Modi dokumentieren.
