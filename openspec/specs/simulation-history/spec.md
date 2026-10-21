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

### Requirement: Positionsstabile Zahlenanzeige im Verlaufsbereich
Bei unveränderter Fenstergröße, Messreihenauswahl und Darstellungsart SHALL eine reine Zahlenaktualisierung Position und Größe der Messwertfelder, ihrer Beschriftungen, der Zeit- und Tickfelder sowie der Diagrammfläche erhalten. Wechselnde Stellenzahlen SHALL weder benachbarte Angaben verschieben noch zusätzliche Zeilenumbrüche verursachen. Zahlen SHALL je Feld einheitlich ausgerichtet sein.

#### Scenario: Wechsel der Vor- und Nachkommastellen
- **WHEN** aktuelle Werte zwischen 9,99 und 10,00, 99,99 und 100,00 sowie 999,99 und 1.000,00 wechseln
- **THEN** bleiben die Außenkanten der Zahlenfelder und die Positionen benachbarter Beschriftungen bis auf höchstens einen CSS-Pixel unverändert
- **AND** verändern sich weder die Höhe des Messwertbereichs noch Größe und Lage der Diagrammfläche

#### Scenario: Wachsende Tickzahl und Zeitgrenzen
- **WHEN** die Tickzahl von 99 auf 100 oder die Simulationszeit von 9,99 auf 10,00 Sekunden wechselt und der Anfang des aufbewahrten Zeitraums später ebenfalls mehr Stellen benötigt
- **THEN** behalten die jeweiligen Felder und ihre Nachbarangaben ihre Position und Größe

#### Scenario: Beide Modi und schmale Fenster
- **WHEN** bei 1440 × 900, 360 × 740 oder 360 × 480 CSS-Pixel in einem der beiden Modi Zahlenwerte aktualisiert werden
- **THEN** tritt kein allein durch Zahlenlängen verursachter Umbruch und kein horizontales Seitenscrolling auf
- **AND** darf sich das Layout bei einer tatsächlichen Fensteränderung oder einer geänderten Messreihenauswahl weiterhin neu anordnen

### Requirement: Einheitliches Zahlenformat für aktuelle Messwerte
Aktuelle Tierzahlen und Tickzahlen SHALL ganzzahlig erscheinen. Aktuelle Energie- und Sekundenangaben einschließlich des aufbewahrten Zeitraums SHALL im normalen Dezimalformat genau zwei Nachkommastellen verwenden: Dezimalpunkt auf Englisch, Dezimalkomma auf Deutsch. Die Rundung SHALL ausschließlich die Textausgabe betreffen und die gespeicherten Messwerte erhalten.

#### Scenario: Ganze und gebrochene Werte
- **WHEN** 10 Tiere, eine Energiesumme von 10 und eine Simulationszeit von 10 Sekunden vorliegen
- **THEN** erscheint die Tierzahl als „10“ und Energie sowie Zeit erscheinen auf Deutsch als „10,00“ und auf Englisch als „10.00“
- **WHEN** anschließend Energie 10,5 und danach 10,56 angezeigt werden
- **THEN** erscheinen „10,50“ und „10,56“ beziehungsweise „10.50“ und „10.56“ innerhalb desselben Zahlenfelds

### Requirement: Lange Zahlen ohne Layoutsprung
Übersteigt eine Zahl die Kapazität ihres reservierten Feldes, SHALL sie darin in einer erkennbaren verkürzten Zahlenschreibweise dargestellt werden. Die vollständige, entsprechend der Anzeigepräzision formatierte Zahl SHALL zugänglich bleiben. Weder Abschneiden bedeutender Stellen noch Überdeckung anderer Angaben oder Vergrößerung des Feldes SHALL zulässig sein.

#### Scenario: Übergang zu sehr großen Werten
- **WHEN** eine gültige Energiesumme oder eine lange Laufzeit mehr Zeichen benötigt als das feste Zahlenfeld aufnehmen kann
- **THEN** wechselt nur die Zahlenschreibweise innerhalb des bestehenden Feldes
- **AND** bleiben vollständiger Wert und Einheit für Hilfstechnologien sowie über eine zusätzliche Wertauskunft verfügbar
- **AND** gilt dieselbe Layoutstabilität beim Zurückwechseln zu kleineren Werten

### Requirement: Stabile Nachkommastellen der X-Achse
Die Zeitbeschriftungen der X-Achse SHALL in beiden Modi genau eine Nachkommastelle mit dem Dezimalzeichen der gewählten Anwendungssprache, gleich breite Ziffern und eine feste rechte Ausrichtung verwenden. Wechsel zwischen ganzen und gebrochenen Sekunden SHALL den Nachkomma-Anker erhalten.

#### Scenario: Ganze und gebrochene Achsenwerte
- **WHEN** die X-Achse nacheinander ganze Sekunden und Zehntelsekunden beschriftet
- **THEN** erscheinen auf Deutsch beispielsweise „10,0“ und „10,1“ und auf Englisch „10.0“ und „10.1“ am selben Beschriftungsanker
- **AND** bleibt der Nachkomma-Anker auch beim Wechsel von „9,9“ auf „10,0“ beziehungsweise „9.9“ auf „10.0“ erhalten

### Requirement: Kompakte Standardansicht des Verlaufs
Die Standardansicht SHALL keine dauerhafte Messwertzeile unter dem Diagramm belegen. Tickzahl, ausführlicher Zeitbereich und Erklärtexte SHALL in einem anfangs geschlossenen Unterbereich „Details“ zugänglich sein. Die Diagrammfläche SHALL 160 CSS-Pixel hoch sein; der Panelinhalt SHALL höchstens 320 CSS-Pixel beziehungsweise 38 Prozent der Fensterhöhe belegen und bei Bedarf intern scrollen.

#### Scenario: Platz für die Simulation
- **WHEN** der Verlauf bei 1440 × 900 CSS-Pixel geöffnet wird
- **THEN** belegt sein Inhalt höchstens 320 CSS-Pixel Höhe und „Details“ ist geschlossen
- **AND** bleiben die Messwerte und alle Darstellungsoptionen erreichbar

### Requirement: Positionsbezogenes Messwert-Tooltip
Ein schwebendes Tooltip SHALL über der Zeichenfläche Zeit, Tick und alle fünf Messwerte der horizontalen Mausposition anzeigen, auch für ausgeblendete Kurven. Es SHALL den nächstgelegenen aufgezeichneten Tick verwenden und leere Zeitbereiche aussparen. Bei stillstehender Maus SHALL es mit jeder Diagrammaktualisierung neu zugeordnet werden. Es SHALL ohne zusätzlichen Layoutplatz innerhalb des Fensters erscheinen und beim Verlassen verschwinden.

#### Scenario: Kurven unter stillstehender Maus
- **WHEN** die Maus an derselben Position bleibt und die Kurven weiter nach links wandern
- **THEN** zeigt das Tooltip fortlaufend die neu unter dieser Position liegenden Zeitpunkte und Werte
- **AND** bleibt es bei pausierter Simulation unverändert

#### Scenario: Umlaufender Cursor
- **WHEN** im Umlaufmodus links oder rechts vom Cursor Werte abgefragt werden
- **THEN** stammen Zeit und Werte aus dem jeweils dargestellten aktuellen oder vorherigen Umlauf
- **AND** erzeugt der Sprung am Diagrammrand keine Zuordnung zum falschen Umlauf

#### Scenario: Energiesummen erkennen
- **WHEN** das Tooltip seine Messwerte anzeigt
- **THEN** beginnen die drei Energiezeilen auf Deutsch mit „Σ Energie“ und auf Englisch mit „Σ Energy“, gefolgt von den jeweils übersetzten Bezeichnungen für Karnivoren, Grasfresser beziehungsweise Gras
