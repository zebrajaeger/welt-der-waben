# Spec Delta

## MODIFIED Requirements

### Requirement: Grasfresser wandeln Gras in Energie um
Nach der Bewegung SHALL jeder überlebende Grasfresser das gesamte Gras seiner Zelle aufnehmen und auf null setzen; Grasmenge mal Graswirkungsgrad erhöht seine Energie bis zum Maximum. Eingesperrte Tiere und Zielkonfliktverlierer SHALL an ihrem Standort fressen. Bei Teilung SHALL jede in eine neue Zelle ziehende Hälfte deren Gras bei Ankunft aufnehmen. Das SHALL weder zusätzlichen Verbrauch noch erneute Teilung im selben Schritt auslösen.

#### Scenario: Dauerhaft eingeschlossen
- **WHEN** ein Grasfresser dauerhaft keine freie Nachbarzelle hat
- **THEN** nimmt er je Schritt höchstens das nachgewachsene Gras seiner eigenen Zelle auf und verliert netto Energie

#### Scenario: Grasaufnahme nach Teilung
- **WHEN** eine oder beide Hälften bei einer Teilung in freie Nachbarzellen ziehen
- **THEN** nehmen sie bei Ankunft das gesamte dortige Gras mit dem konfigurierten Wirkungsgrad bis zur Maximalenergie auf
- **AND** bleibt der Energieverbrauch auf einmal pro Schritt begrenzt und wird keine weitere Teilung ausgelöst
- **AND** wird eine stehenbleibende Hälfte nicht erneut gefüttert

#### Scenario: Beuteenergie nach Teilung und Grasaufnahme
- **WHEN** ein Karnivor eine gerade in eine Teilungszelle gezogene Hälfte frisst
- **THEN** verwendet der Beutewirkungsgrad deren Energie nach der sofortigen Grasaufnahme

### Requirement: Feste Phasen und Belegung
Jeder Simulationsschritt SHALL genau in der Reihenfolge Gras, Grasfresser und Karnivoren verlaufen. Eine Zelle SHALL niemals gleichzeitig zwei Lebewesen enthalten. Jeder normale Zug SHALL höchstens eine Nachbarzelle weit führen. Teilung SHALL zusätzlich beide Hälften nach der Platzregel verteilen dürfen. Karnivoren SHALL bei erfolgreicher Jagd auf die Beutezelle ziehen, andernfalls außer zur Teilung stehen bleiben. Neugeborene SHALL erst im Folgeschritt selbst aktiv handeln.

#### Scenario: Eintritt in Jagdreichweite
- **WHEN** ein Grasfresser in der Grasfresserphase in eine freie Nachbarzelle eines Karnivoren zieht
- **THEN** kann dieser Karnivor ihn in der anschließenden Karnivorenphase desselben Schritts fressen

### Requirement: Karnivoren jagen höchstens eine Beute
Jeder aktive Karnivor SHALL pro Phase höchstens einen benachbarten Grasfresser fressen und dessen Zelle einnehmen. Er SHALL dessen aktuelle Energie mal Beutewirkungsgrad bis zur Maximalenergie erhalten. Beutewahl und Konflikte SHALL zufällig aufgelöst werden; jede Beute SHALL höchstens einmal gefressen werden. Ohne Jagderfolg SHALL der Karnivor bis zu einer möglichen anschließenden Teilung stehen bleiben und keinen weiteren Jagdversuch unternehmen.

#### Scenario: Erfolgreiche Jagd mit Bewegung
- **WHEN** ein Karnivor einen Grasfresser in einer Nachbarzelle frisst
- **THEN** belegt der Karnivor vor einer möglichen Teilung die bisherige Beutezelle und seine Ausgangszelle wird frei
- **AND** das Gras auf der Beutezelle bleibt unverändert

#### Scenario: Teilung nach erfolgreicher Jagd
- **WHEN** ein Karnivor nach dem Fressen und Energieverbrauch die Teilungsschwelle überschreitet
- **THEN** werden freie Nachbarzellen seiner neuen Position für beide Hälften berücksichtigt, einschließlich der verlassenen Ausgangszelle

#### Scenario: Jagd ohne Erfolg
- **WHEN** ein Karnivor keine Beute findet oder einen Konflikt um eine Beute verliert
- **THEN** bleibt er bis zu einer möglichen Teilung auf seiner Ausgangszelle

#### Scenario: Gemeinsame Beute
- **WHEN** zwei Karnivoren denselben einzigen Grasfresser als Beute wählen
- **THEN** frisst genau einer den Grasfresser, erhält Beuteenergie und zieht auf die Beutezelle; der andere bleibt bis zu einer möglichen Teilung stehen

### Requirement: Energieverlust, Tod und Teilung
Beide Arten SHALL in ihrer Phase artspezifischen Energieverbrauch erleiden und bei Energie <= 0 sterben. Oberhalb der artspezifischen Teilungsschwelle (Standard 75 %) SHALL bei freiem Nachbarn die Energie gleichmäßig geteilt werden. Bei einem freien Nachbarn SHALL eine Hälfte bleiben; bei mindestens zwei SHALL beide unterschiedliche freie Nachbarn belegen. Konkurrierende Teilungen SHALL zufällig und vollständig ohne Doppelbelegung aufgelöst werden; nur erfolgreiche Teilungen halbieren die Energie.

#### Scenario: Kein Platz für Nachwuchs
- **WHEN** ein Lebewesen über seiner Teilungsschwelle liegt, aber keine freie Nachbarzelle für Nachwuchs zur Verfügung steht
- **THEN** teilt es sich nicht und seine Energie bleibt auf das Maximum begrenzt

#### Scenario: Geburt nach Grasfresserphase
- **WHEN** ein Grasfresser Nachwuchs erzeugt
- **THEN** belegen beide Hälften nach der Platzregel ihre Zellen und können im aktuellen Schritt von Karnivoren gefressen werden
- **AND** führt die neue Hälfte außer ihrer Teilungsbewegung erst im nächsten Schritt eigene Aktionen aus

#### Scenario: Aufgebrauchte Energie
- **WHEN** die Energie eines Lebewesens nach den Operationen seiner Phase null oder geringer ist
- **THEN** wird es entfernt und kann sich nicht mehr teilen

#### Scenario: Nur eine freie Zelle
- **WHEN** genau eine Nachbarzelle frei ist
- **THEN** bleibt eine Hälfte am Teilungsursprung und die andere belegt diese Nachbarzelle

#### Scenario: Zwei oder mehr freie Zellen
- **WHEN** mindestens zwei Nachbarzellen frei sind
- **THEN** werden zufällig zwei unterschiedliche Zellen für die Hälften ausgewählt und die Ursprungszelle wird frei

#### Scenario: Gemeinsame Teilungsziele
- **WHEN** mehrere Teilungen dieselbe freie Zielzelle beanspruchen
- **THEN** werden die Teilungen in zufälliger Reihenfolge vollständig angenommen oder verworfen, sodass kein Ziel zweimal belegt wird
- **AND** bleibt ein unterlegenes Tier ohne Energiehalbierung an seinem Teilungsursprung
