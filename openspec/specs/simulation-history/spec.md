# simulation-history Specification

## Purpose

Macht die zeitliche Entwicklung von Tierpopulationen und gespeicherter Energie während eines Simulationslaufs in einem steuerbaren Diagramm vergleichbar.

## Requirements

### Requirement: Unabhängig aufklappbarer Verlauf
Die Oberfläche SHALL eine zunächst geschlossene Box „Verlauf“ ähnlich den Einstellungen anbieten. Beide Boxen SHALL unabhängig bedienbar sein. Öffnen und Schließen SHALL die Datenerfassung fortsetzen und Simulationszustand, Wiedergabe sowie Einstellungsentwurf erhalten.

#### Scenario: Spätes Öffnen
- **WHEN** die Simulation bei geschlossener Box läuft und „Verlauf“ später geöffnet wird
- **THEN** zeigt das Diagramm die noch aufbewahrte Historie einschließlich des aktuellen Zustands
- **AND** lassen sich Einstellungen und Verlauf gleichzeitig öffnen

### Requirement: Fünf unabhängig wählbare Messreihen
Das Diagramm SHALL Anzahl Karnivoren, Anzahl Grasfresser, Energie Karnivoren, Energie Grasfresser und Energie Gras einzeln oder gemeinsam anzeigen können. Alle fünf Reihen SHALL unabhängig von ihrer Sichtbarkeit erfasst werden. Anfangs SHALL beide Anzahlen ausgewählt sein. Ohne Auswahl SHALL ein verständlicher Hinweis erscheinen.

#### Scenario: Nachträgliche Auswahl und leere Auswahl
- **WHEN** während eines Laufs eine Energiereihe zusätzlich ausgewählt wird
- **THEN** erscheint auch deren aufbewahrter bisheriger Verlauf
- **AND** bleiben die übrigen gewählten Reihen sichtbar
- **WHEN** alle Reihen abgewählt werden
- **THEN** erscheint „Bitte mindestens eine Messreihe auswählen.“ und die Aufnahme läuft weiter

### Requirement: Messwerte aus dem tatsächlichen Weltzustand
Anzahlen SHALL vorhandene Tiere je Art zählen. Energiesummen SHALL deren aktuelle Energien beziehungsweise die Grasmengen aller Zellen summieren. Leere Tiergruppen SHALL Anzahl und Energie null liefern. Teilungsformen, Reservierungen und grafische Energieindikatoren SHALL keine zusätzlichen Tiere oder Energie erzeugen.

#### Scenario: Summen während lokaler Aktionen
- **WHEN** ein Zustand zwei Grasfresser mit Energie 3 und 7, einen Karnivoren mit Energie 5 und Graszellen mit zusammen 12 Energie enthält
- **THEN** betragen die fünf Messwerte 1 Karnivore, 2 Grasfresser, 5 Karnivorenenergie, 10 Grasfresserenergie und 12 Grasenergie
- **AND** ändern laufende Animationen oder Beutemarkierungen diese Berechnung nicht

### Requirement: Simulationszeit und Wiedergabesteuerung
Die Zeitachse SHALL Sekunden seit Laufbeginn mit 60 Ticks pro Sekunde verwenden. Anfangszustand und jeder abgeschlossene Tick SHALL in die Aufnahme eingehen, auch bei mehreren Ticks pro Bild. Pause SHALL Aufnahme und Cursor einfrieren; Einzelschritt SHALL genau einen neuen Tick ergänzen. Simulationstempo SHALL die Zeitbeschriftung nicht verfälschen.

#### Scenario: Pause, Einzelschritt und schnelle Wiedergabe
- **WHEN** bei Tick 120 pausiert und anschließend ein Einzelschritt ausgeführt wird
- **THEN** bleibt der Verlauf zunächst bei 2 Sekunden und erhält danach genau den Wert für Tick 121
- **AND** bleibt die Simulation pausiert
- **WHEN** mehrere Ticks in einem Browserbild abgeschlossen werden
- **THEN** gehen deren Messwerte in Tickreihenfolge ein und nach gleicher Tickzahl entsteht unabhängig von der Bildrate dieselbe Historie

### Requirement: Umschaltbare Diagrammbewegung
Das Diagramm SHALL „Wandernde Kurven“ und „Umlaufender Cursor“ anbieten; Standard SHALL „Wandernde Kurven“ sein. Im ersten Modus SHALL der aktuelle Zeitpunkt rechts bleiben und ältere Werte nach links wandern. Im zweiten SHALL der Cursor von links nach rechts laufen, am Rand links fortsetzen und dort ältere Werte überschreiben. Zeitbeschriftungen SHALL alte und neue Abschnitte eindeutig zuordnen.

#### Scenario: Wandernde Kurven und Beginn eines Laufs
- **WHEN** im wandernden Modus weitere Simulationszeit verstreicht
- **THEN** bleibt der aktuelle Wert am rechten Rand und ältere Werte bewegen sich nach links
- **AND** bleibt vor Laufbeginn liegende Zeit leer, ohne erfundene Messwerte

#### Scenario: Umlauf und Wechsel
- **WHEN** der laufende Cursor das Ende der gewählten Zeitspanne erreicht
- **THEN** setzt er links fort und ersetzt die älteren Werte hinter seiner neuen Position
- **AND** bleiben noch nicht überschriebene Werte aus dem vorherigen Umlauf erkennbar älter
- **AND** verbindet keine Linie das rechte Ende mit dem linken Anfang oder verschiedene Umläufe über die Cursorgrenze
- **WHEN** der Modus gewechselt wird
- **THEN** werden vorhandene Werte neu dargestellt, ohne Historie oder Lauf neu zu starten

### Requirement: Einstellbare Bewegungsgeschwindigkeit
Eine mit „Zeitspanne“ beschriftete Auswahl SHALL 10, 30, 60, 120 und 300 Simulationssekunden pro Diagrammbreite anbieten; Standard SHALL 60 sein. Kürzere Spannen SHALL in beiden Modi eine schnellere horizontale Bewegung bewirken. Änderungen SHALL sofort die Darstellung anpassen und weder Simulationstempo noch Historie verändern.

#### Scenario: Geschwindigkeit bei gleichem Simulationstempo
- **WHEN** bei unverändertem Simulationstempo die Zeitspanne von 60 auf 30 Sekunden geändert wird
- **THEN** legen Cursor beziehungsweise Kurven pro Simulationssekunde die doppelte Diagrammbreite zurück
- **AND** bleiben Tickzahl, Messwerte und Pausenmodus erhalten
- **AND** ist die Auswahl auch in der Pause bedienbar

### Requirement: Lesbare und zugängliche Darstellung
Das Diagramm SHALL beschriftete Zeit-, Anzahl- und Energieachsen verwenden. Anzahl und Energie SHALL getrennte Skalen ab null erhalten; nur gewählte Reihen SHALL die jeweilige Skalierung bestimmen. Farben und unterscheidbare Linienmuster sowie eine benannte Legende SHALL die Reihen zuordnen. Aktuelle gewählte Messwerte SHALL zusätzlich als Text verfügbar sein.

#### Scenario: Gemeinsame Darstellung und Nullwerte
- **WHEN** Anzahlen und deutlich größere Energiesummen gleichzeitig ausgewählt sind
- **THEN** bleiben beide Größen über getrennt beschriftete Skalen lesbar
- **AND** sind auch bei ausschließlich nullwertigen Reihen alle Achsen und Werte gültig
- **AND** lassen sich Auswahl, Modus und Zeitspanne per Tastatur mit sichtbarem Fokus bedienen

### Requirement: Begrenzte Historie und neuer Lauf
Die Aufnahme SHALL höchstens die letzten 300 Simulationssekunden einschließlich ihrer Randwerte aufbewahren. Neustart und Übernehmen von Einstellungen SHALL die alte Historie durch den Anfangszustand des neuen Laufs ersetzen. Kurvenauswahl, Modus und Zeitspanne SHALL dabei erhalten bleiben. Neuladen SHALL eine neue Historie mit den Diagrammstandards beginnen.

#### Scenario: Langer Lauf und Reset
- **WHEN** ein Lauf länger als 300 Simulationssekunden dauert
- **THEN** verwirft die Aufnahme ältere Werte und bleibt unabhängig von der Gesamtlaufdauer begrenzt
- **WHEN** neu gestartet oder eine gültige Konfiguration übernommen wird
- **THEN** enthält die Historie ausschließlich den neuen Anfangszustand bei Zeit null und erhält die gewählten Diagrammoptionen
- **AND** lösen Speichern, Import ins Formular, Export oder ungültiges Übernehmen keinen Historienreset aus

### Requirement: Responsive Einbindung in das Simulationsfenster
Die Verlaufsbox SHALL in das vorhandene Layout passen, ohne horizontales Seitenscrolling oder überdeckte Bedienung. Bei geöffneten Boxen SHALL das Spielfeld vollständig proportional innerhalb einer Zeichenfläche von mindestens 160 CSS-Pixel Höhe bleiben. Größenänderungen SHALL das Diagramm auch in der Pause neu zeichnen und seine Daten erhalten.

#### Scenario: Kleines Fenster mit beiden Boxen
- **WHEN** bei 360 × 480 CSS-Pixel beide Boxen geöffnet und alle Diagrammoptionen aufgerufen werden
- **THEN** bleiben Optionen und Spielfeld durch vertikales Scrollen erreichbar
- **AND** bleiben Diagramm und Spielfeld gültig dimensioniert, ohne horizontales Seitenscrolling
- **WHEN** das Fenster in der Pause vergrößert oder eine Box geschlossen wird
- **THEN** passen sich beide Zeichenflächen an, ohne Tick, Historie oder Einstellungsentwurf zu verändern
