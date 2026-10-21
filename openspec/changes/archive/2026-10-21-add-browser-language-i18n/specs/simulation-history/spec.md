# Spec Delta

## MODIFIED Requirements

### Requirement: Einheitliches Zahlenformat für aktuelle Messwerte
Aktuelle Tierzahlen und Tickzahlen SHALL ganzzahlig erscheinen. Aktuelle Energie- und Sekundenangaben einschließlich des aufbewahrten Zeitraums SHALL im normalen Dezimalformat genau zwei Nachkommastellen verwenden: Dezimalpunkt auf Englisch, Dezimalkomma auf Deutsch. Die Rundung SHALL ausschließlich die Textausgabe betreffen und die gespeicherten Messwerte erhalten.

#### Scenario: Ganze und gebrochene Werte
- **WHEN** 10 Tiere, eine Energiesumme von 10 und eine Simulationszeit von 10 Sekunden vorliegen
- **THEN** erscheint die Tierzahl als „10“ und Energie sowie Zeit erscheinen auf Deutsch als „10,00“ und auf Englisch als „10.00“
- **WHEN** anschließend Energie 10,5 und danach 10,56 angezeigt werden
- **THEN** erscheinen „10,50“ und „10,56“ beziehungsweise „10.50“ und „10.56“ innerhalb desselben Zahlenfelds

### Requirement: Stabile Nachkommastellen der X-Achse
Die Zeitbeschriftungen der X-Achse SHALL in beiden Modi genau eine Nachkommastelle mit dem Dezimalzeichen der gewählten Anwendungssprache, gleich breite Ziffern und eine feste rechte Ausrichtung verwenden. Wechsel zwischen ganzen und gebrochenen Sekunden SHALL den Nachkomma-Anker erhalten.

#### Scenario: Ganze und gebrochene Achsenwerte
- **WHEN** die X-Achse nacheinander ganze Sekunden und Zehntelsekunden beschriftet
- **THEN** erscheinen auf Deutsch beispielsweise „10,0“ und „10,1“ und auf Englisch „10.0“ und „10.1“ am selben Beschriftungsanker
- **AND** bleibt der Nachkomma-Anker auch beim Wechsel von „9,9“ auf „10,0“ beziehungsweise „9.9“ auf „10.0“ erhalten

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
