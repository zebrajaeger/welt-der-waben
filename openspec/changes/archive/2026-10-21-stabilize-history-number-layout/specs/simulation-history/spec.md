# Spec Delta

## ADDED Requirements

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
Aktuelle Tierzahlen und Tickzahlen SHALL ganzzahlig erscheinen. Aktuelle Energie- und Sekundenangaben einschließlich des aufbewahrten Zeitraums SHALL im normalen Dezimalformat genau zwei Nachkommastellen und ein deutsches Dezimalkomma verwenden. Die Rundung SHALL ausschließlich die Textausgabe betreffen und die gespeicherten Messwerte erhalten.

#### Scenario: Ganze und gebrochene Werte
- **WHEN** 10 Tiere, eine Energiesumme von 10 und eine Simulationszeit von 10 Sekunden vorliegen
- **THEN** erscheint die Tierzahl als „10“ und Energie sowie Zeit erscheinen als „10,00“
- **WHEN** anschließend Energie 10,5 und danach 10,56 angezeigt werden
- **THEN** erscheinen „10,50“ und „10,56“ innerhalb desselben Zahlenfelds

### Requirement: Lange Zahlen ohne Layoutsprung
Übersteigt eine Zahl die Kapazität ihres reservierten Feldes, SHALL sie darin in einer erkennbaren verkürzten Zahlenschreibweise dargestellt werden. Die vollständige, entsprechend der Anzeigepräzision formatierte Zahl SHALL zugänglich bleiben. Weder Abschneiden bedeutender Stellen noch Überdeckung anderer Angaben oder Vergrößerung des Feldes SHALL zulässig sein.

#### Scenario: Übergang zu sehr großen Werten
- **WHEN** eine gültige Energiesumme oder eine lange Laufzeit mehr Zeichen benötigt als das feste Zahlenfeld aufnehmen kann
- **THEN** wechselt nur die Zahlenschreibweise innerhalb des bestehenden Feldes
- **AND** bleiben vollständiger Wert und Einheit für Hilfstechnologien sowie über eine zusätzliche Wertauskunft verfügbar
- **AND** gilt dieselbe Layoutstabilität beim Zurückwechseln zu kleineren Werten

### Requirement: Stabile Nachkommastellen der X-Achse
Die Zeitbeschriftungen der X-Achse SHALL in beiden Modi genau eine Nachkommastelle mit deutschem Komma, gleich breite Ziffern und eine feste rechte Ausrichtung verwenden. Wechsel zwischen ganzen und gebrochenen Sekunden SHALL den Nachkomma-Anker erhalten.

#### Scenario: Ganze und gebrochene Achsenwerte
- **WHEN** die X-Achse nacheinander ganze Sekunden und Zehntelsekunden beschriftet
- **THEN** erscheinen beispielsweise „10,0“ und „10,1“ am selben Beschriftungsanker
- **AND** bleibt der Nachkomma-Anker auch beim Wechsel von „9,9“ auf „10,0“ erhalten

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
- **THEN** beginnen die drei Energiezeilen mit „Σ Energie“, gefolgt von Karnivoren, Grasfressern beziehungsweise Gras
