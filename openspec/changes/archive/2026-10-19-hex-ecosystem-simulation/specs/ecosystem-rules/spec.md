# Spec Delta

## Purpose

Definiert die nachvollziehbaren Regeln und konfigurierbaren Anfangsbedingungen des Ökosystems auf einem begrenzten Sechseckraster.

## ADDED Requirements

### Requirement: Konfigurierbares Wabenfeld
Die Simulation SHALL ein Feld aus konfigurierbar vielen Spalten und Reihen erzeugen (Standard 30 x 20). Jede Zelle SHALL nur die innerhalb der festen Feldgrenzen liegenden, höchstens sechs geometrisch benachbarten Zellen kennen; gegenüberliegende Ränder SHALL nicht verbunden sein.

#### Scenario: Nachbarschaft am Rand
- **WHEN** eine Zelle am Außenrand betrachtet wird
- **THEN** gehören nur tatsächlich innerhalb des Felds liegende Zellen zu ihren Nachbarn

### Requirement: Konfigurierbares lineares Graswachstum
Jede Zelle SHALL eine Grasmenge besitzen, die zu Beginn jedes Simulationsschritts um die konfigurierte Wachstumsmenge pro Schritt bis höchstens zum konfigurierten Grasmaximum steigt. Beim Start SHALL jede Zelle 50 % des Maximums besitzen.

#### Scenario: Wachstumsgrenze
- **WHEN** die Summe aus vorhandenem Gras und Wachstumsmenge das Maximum überschreitet
- **THEN** beträgt die Grasmenge nach der Grasphase genau das Maximum

### Requirement: Getrennte Startpopulationen
Die Simulation SHALL die konfigurierte Anzahl beider Arten (Standard jeweils zehn) zufällig auf unterschiedliche Zellen verteilen und jeder Art initial 50 % ihrer separat konfigurierten Maximalenergie zuweisen. Gras unter einem initialen Grasfresser SHALL auf null gesetzt werden, ohne dessen Startenergie zu erhöhen.

#### Scenario: Startzustand
- **WHEN** eine Simulation mit Standardanzahlen startet
- **THEN** existieren zehn Grasfresser und zehn Karnivoren auf 20 verschiedenen Zellen mit jeweils halber artspezifischer Maximalenergie
- **AND** auf jeder initial von einem Grasfresser besetzten Zelle ist das Gras null

### Requirement: Validierte Konfiguration
Die Simulation SHALL Konfigurationsfehler verständlich melden: Abmessungen und Abspieltempo sind positiv, Populationen ganzzahlig und nicht negativ; ihre Summe überschreitet die Zellenzahl nicht. Maxima und Energieverbrauch sind positiv, Wachstum und Wirkungsgrade nicht negativ; Teilungsanteile liegen strikt zwischen null und eins. Alle Zahlen sind endlich.

#### Scenario: Eingesperrter Grasfresser könnte überleben
- **WHEN** Graswachstum mal Graswirkungsgrad mindestens so groß wie der Energieverbrauch des Grasfressers ist
- **THEN** wird die Konfiguration mit einer Erklärung dieser Bedingung abgewiesen

#### Scenario: Zu viele Startlebewesen
- **WHEN** die Summe der Startpopulationen größer als die Anzahl der Zellen ist
- **THEN** startet die Simulation nicht und meldet den Belegungsfehler

### Requirement: Eingeschlossene Grasfresser verhungern
Die Simulation SHALL nur Konfigurationen akzeptieren, in denen Graswachstum pro Schritt mal Graswirkungsgrad strikt kleiner als der Energieverbrauch eines Grasfressers pro Schritt ist.

#### Scenario: Gleich großer Energiegewinn und Verbrauch
- **WHEN** Wachstum mal Graswirkungsgrad genau dem Energieverbrauch entspricht
- **THEN** wird die Konfiguration zurückgewiesen

### Requirement: Feste Phasen und Belegung
Jeder Simulationsschritt SHALL genau in der Reihenfolge Gras, Grasfresser und Karnivoren verlaufen. Eine Zelle SHALL niemals gleichzeitig zwei Lebewesen enthalten. Jedes Lebewesen SHALL pro Schritt höchstens eine Zelle weit ziehen; Karnivoren SHALL bei erfolgreicher Jagd auf die Zelle der gefressenen Beute ziehen und andernfalls auf ihrer Ausgangszelle bleiben. Neugeborene SHALL ihren ersten eigenen Zug erst im nächsten Schritt erhalten.

#### Scenario: Eintritt in Jagdreichweite
- **WHEN** ein Grasfresser in der Grasfresserphase in eine freie Nachbarzelle eines Karnivoren zieht
- **THEN** kann dieser Karnivor ihn in der anschließenden Karnivorenphase desselben Schritts fressen

### Requirement: Grasfresser wählen Gras statt Sicherheit
Jeder lebende Grasfresser SHALL anhand der Belegung zu Beginn seiner Phase genau ein freies Nachbarfeld mit maximalem Graswert als Ziel wählen, unabhängig von benachbarten Karnivoren. Von Lebewesen besetzte sowie erst im selben Schritt frei werdende Zellen SHALL nicht als Ziele gelten. Gleichstände SHALL zufällig entschieden werden.

#### Scenario: Beste Zelle grenzt an Karnivor
- **WHEN** die freie Nachbarzelle mit dem höchsten Graswert neben einem Karnivoren liegt
- **THEN** bleibt sie ohne Gefahrenabschlag als Ziel wählbar

#### Scenario: Zielkonflikt
- **WHEN** mehrere Grasfresser dieselbe Zielzelle wählen
- **THEN** zieht genau einer, zufällig ausgewählt, dorthin und alle anderen bleiben in ihren Ausgangszellen

#### Scenario: Verlassene Zelle
- **WHEN** ein Grasfresser im selben Schritt seine Ausgangszelle verlässt
- **THEN** kann kein anderer Grasfresser in diesem Schritt in diese Ausgangszelle ziehen

### Requirement: Grasfresser wandeln Gras in Energie um
Nach ihrer Bewegungsentscheidung SHALL jeder überlebende Grasfresser das gesamte Gras seiner Aufenthaltszelle aufnehmen, die Grasmenge auf null setzen und Energie in Höhe der aufgenommenen Grasmenge mal konfiguriertem Graswirkungsgrad gewinnen, begrenzt durch seine Maximalenergie. Kann er nicht ziehen oder verliert einen Zielkonflikt, SHALL er in seiner eigenen Zelle fressen.

#### Scenario: Dauerhaft eingeschlossen
- **WHEN** ein Grasfresser dauerhaft keine freie Nachbarzelle hat
- **THEN** nimmt er je Schritt höchstens das nachgewachsene Gras seiner eigenen Zelle auf und verliert netto Energie

### Requirement: Karnivoren jagen höchstens eine Beute
Jeder aktive Karnivor SHALL pro Phase höchstens einen benachbarten Grasfresser fressen und dessen Zelle einnehmen. Er SHALL dessen aktuelle Energie mal Beutewirkungsgrad bis zur Maximalenergie erhalten. Beutewahl und Konflikte SHALL zufällig aufgelöst werden; jede Beute SHALL höchstens einmal gefressen werden. Ohne Jagderfolg SHALL der Karnivor stehen bleiben und keinen weiteren Jagdversuch unternehmen.

#### Scenario: Erfolgreiche Jagd mit Bewegung
- **WHEN** ein Karnivor einen Grasfresser in einer Nachbarzelle frisst
- **THEN** belegt der Karnivor anschließend die bisherige Beutezelle und seine Ausgangszelle wird frei
- **AND** das Gras auf der Beutezelle bleibt unverändert

#### Scenario: Teilung nach erfolgreicher Jagd
- **WHEN** ein Karnivor nach dem Fressen und Energieverbrauch die Teilungsschwelle überschreitet
- **THEN** werden freie Nachbarzellen seiner neuen Position für die Geburt berücksichtigt, einschließlich der verlassenen Ausgangszelle

#### Scenario: Jagd ohne Erfolg
- **WHEN** ein Karnivor keine Beute findet oder einen Konflikt um eine Beute verliert
- **THEN** bleibt er auf seiner Ausgangszelle

#### Scenario: Gemeinsame Beute
- **WHEN** zwei Karnivoren denselben einzigen Grasfresser als Beute wählen
- **THEN** frisst genau einer von ihnen den Grasfresser, erhält Beuteenergie und zieht auf die Beutezelle; der andere bleibt auf seiner Ausgangszelle

### Requirement: Energieverlust, Tod und Teilung
Beide Arten SHALL in ihrer jeweiligen Phase den konfigurierten artspezifischen Energieverbrauch pro Schritt erleiden. Bei Energie von null oder weniger SHALL das Lebewesen sterben. Übersteigt die Energie nach dem Verbrauch die artspezifische Teilungsschwelle (Standard 75 % der Maximalenergie), SHALL es bei freier Nachbarzelle teilen und seine Energie gleichmäßig mit dem Nachwuchs aufteilen. Geburtskonflikte SHALL zufällig ohne Doppelbelegung aufgelöst werden.

#### Scenario: Kein Platz für Nachwuchs
- **WHEN** ein Lebewesen über seiner Teilungsschwelle liegt, aber keine freie Nachbarzelle für Nachwuchs zur Verfügung steht
- **THEN** teilt es sich nicht und seine Energie bleibt auf das Maximum begrenzt

#### Scenario: Geburt nach Grasfresserphase
- **WHEN** ein Grasfresser Nachwuchs erzeugt
- **THEN** belegt das Jungtier unmittelbar eine freie Nachbarzelle und kann im aktuellen Schritt von einem Karnivoren gefressen werden, handelt aber erst im nächsten Schritt selbst

#### Scenario: Aufgebrauchte Energie
- **WHEN** die Energie eines Lebewesens nach den Operationen seiner Phase null oder geringer ist
- **THEN** wird es entfernt und kann sich nicht mehr teilen
