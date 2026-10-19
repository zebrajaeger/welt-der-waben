# Spec Delta


## MODIFIED Requirements

### Requirement: Auf die Ankunft abgestimmte Jagd
Bei erfolgreicher Jagd SHALL die führende Karnivorenspitze das Beutezentrum bei der endgültigen Ankunft des Grasfressers erreichen. Dieser Kontakt SHALL das Aussaugen starten. Die Spitze SHALL bis zu dessen Abschluss im Zentrum und die übrigen Spitzen SHALL an ihren Ausgangspunkten bleiben. Erst danach SHALL der Karnivor nachziehen und seine führende Spitze zur Endposition bewegen. Die Animation SHALL nur den tatsächlich erfolgreichen Jäger zeigen.

#### Scenario: Bewegte Beute wird bei ihrer Ankunft aufgepiekt
- **WHEN** ein Grasfresser in diesem Schritt zieht und anschließend gefressen wird
- **THEN** beginnt der Vorstoß der Karnivorenspitze rechtzeitig vor der Ankunft
- **AND** sind Spitzenkontakt, vollständige Ankunft der Beute und Beginn des Aussaugens derselbe Zeitpunkt
- **AND** bleibt die Beute beim Kontakt sichtbar und der restliche Karnivorenkörper folgt erst nach vollständigem Aussaugen

#### Scenario: Stehende oder neugeborene Beute
- **WHEN** die gefressene Beute stehen geblieben oder in der Grasfresserphase geboren worden ist
- **THEN** richtet sich der Kontakt auf deren tatsächlich belegte Zelle zum gemeinsamen Jagdzeitpunkt
- **AND** wird ausschließlich ihre tatsächlich erfolgte Teilungsbewegung gezeigt, ohne eine zusätzliche eigene Nahrungsbewegung zu erfinden
- **AND** beginnt das Aussaugen nach abgeschlossener Teilung und Grasaufnahme dieser Hälfte

#### Scenario: Mehrere Jäger und mehrere Jagden
- **WHEN** mehrere Karnivoren dieselbe Beute anvisieren oder unabhängige Jagden im selben Schritt stattfinden
- **THEN** bewegt sich nur der je Beute erfolgreiche Karnivor auf diese Beutezelle
- **AND** bleiben unterlegene Karnivoren stehen und erhalten keine Beuteenergie, und jede Beute verschwindet genau einmal nach vollständigem Aussaugen
- **AND** laufen unabhängige Jagden einschließlich Aussaugphase auf derselben Zeitleiste parallel

### Requirement: Sichtbare Teilung eines vollen Bewohners
Eine erfolgreiche Teilung SHALL den vollen Bewohner zeigen und daraus kontinuierlich zwei Hälften entstehen lassen. Jede hinausziehende Hälfte SHALL mit der Spitzenbewegung in ihre Nachbarzelle schreiten. Bei nur einer freien Zelle SHALL eine Hälfte im Ursprung bleiben. Die Energieform SHALL zuerst die Halbierung zeigen. Zielgras SHALL ab Spitzenkontakt kontinuierlich verschwinden und die Energie der Hälfte erhöhen. Erst nach vollständiger Aufnahme SHALL diese ihren Schritt vollenden.

#### Scenario: Zwei freie Nachbarn
- **WHEN** ein Bewohner erfolgreich teilt und zwei unterschiedliche freie Nachbarzellen zugewiesen erhält
- **THEN** entstehen beide Formen sichtbar aus dem vollen Bewohner und ziehen in die zwei verschiedenen Richtungen auseinander
- **AND** ist die Ursprungszelle am Ende frei

#### Scenario: Nur ein freier Nachbar
- **WHEN** eine Teilung genau eine freie Nachbarzelle verwenden kann
- **THEN** bleibt eine Hälfte in der Ursprungszelle, während die andere sichtbar aus ihr in die freie Nachbarzelle schreitet

#### Scenario: Kein Platz oder verlorener Teilungskonflikt
- **WHEN** keine Teilung zustande kommt
- **THEN** werden weder eine zweite Form noch eine Teilungsbewegung dargestellt

#### Scenario: Geteilte Grasfresser als Beute
- **WHEN** eine der beiden Grasfresserhälften in demselben Schritt gefressen wird
- **THEN** vollendet diese Hälfte zuerst ihre Teilungsbewegung
- **AND** erreicht die Karnivorenspitze genau bei ihrer endgültigen Ankunft deren tatsächliche Zelle

#### Scenario: Unterbrochene Teilung
- **WHEN** während der Teilungsbewegung pausiert, die Fenstergröße geändert oder neu gestartet wird
- **THEN** gelten dieselben Regeln für Fortschritt, Projektion und Verwerfen des alten Übergangs wie bei anderen Bewegungen

## ADDED Requirements

### Requirement: Kontinuierliches Aussaugen der Beuteenergie
Während des Aussaugens SHALL die sichtbare Beuteenergie kontinuierlich auf null sinken und ihre gesamte Form bis auf null ins Kontaktzentrum schrumpfen. Gleichzeitig SHALL die sichtbare Karnivorenenergie kontinuierlich vom Wert vor der Jagd zum regelgemäßen Jagdergebnis steigen. Beim Kontakt SHALL kein Energiegewinn vorweggenommen werden. Erst am Ende SHALL die Beute vollständig verschwinden. Effizienz und Energieobergrenze SHALL unverändert gelten.

#### Scenario: Beginn und Zwischenzustand
- **WHEN** die Spitze das Beutezentrum erreicht und anschließend ein Teil der Aussaugphase verstrichen ist
- **THEN** zeigt der Kontaktzeitpunkt die vollständige angekommene Beute und die Karnivorenenergie vor der Jagd
- **AND** ist im Zwischenzustand die Beute kleiner und energieärmer, während der Karnivor einen entsprechenden Teil seines regelgemäßen Energiegewinns zeigt
- **AND** bleibt die führende Spitze währenddessen exakt im Kontaktzentrum

#### Scenario: Vollständiges Aufzehren ohne Restlinien
- **WHEN** das Aussaugen endet
- **THEN** sind weder Füllung noch Striche oder andere Reste des Grasfressers sichtbar
- **AND** ist der regelgemäße Jagdenergiegewinn vollständig dargestellt, bevor die Spitzen nachziehen
- **AND** entsteht an der Phasengrenze kein Positions- oder Energiegewinnsprung

#### Scenario: Wirkungsgrad und Sättigung
- **WHEN** nur ein Anteil der Beuteenergie nutzbar ist oder der Karnivor seine Energieobergrenze erreicht
- **THEN** steigt seine dargestellte Energie kontinuierlich nur bis zum regelgemäßen Ergebnis
- **AND** wird die Beute dennoch vollständig aufgezehrt und keine zusätzliche Energie oder Teilung ausgelöst

### Requirement: Aussaugen innerhalb der steuerbaren Schrittanimation
Die Aussaugphase SHALL innerhalb desselben Simulationsschritts vor dem Nachziehen und einer etwaigen Karnivorenteilung abschließen. Pause, Fortsetzen, Tempowechsel und Größenänderung SHALL ihren Fortschritt erhalten; Neustart SHALL sie verwerfen. Übersprungene Bilder SHALL keine mehrfache Energieübertragung erzeugen. Der abgeschlossene Regelzustand und die Zufallsfolge SHALL unverändert bleiben.

#### Scenario: Unterbrechen und Tempo ändern
- **WHEN** während des Aussaugens pausiert, das Tempo geändert, fortgesetzt oder die Fenstergröße geändert wird
- **THEN** bleiben Restenergie und Formfortschritt bei Pause unverändert und werden beim Fortsetzen ohne Sprung mit dem gewählten Tempo weitergeführt
- **AND** bleibt der Spitzenkontakt bei Größenänderung erhalten

#### Scenario: Einzelschritt und Neustart
- **WHEN** eine Jagd als Einzelschritt abgespielt oder während des Aussaugens neu gestartet wird
- **THEN** umfasst der Einzelschritt Aussaugen, Nachziehen und mögliche Teilung vollständig und pausiert danach
- **AND** entfernt ein Neustart sämtliche sichtbaren Reste und Übertragungen des alten Übergangs

#### Scenario: Ausgelassene Zwischenbilder und nachfolgende Teilung
- **WHEN** die Wiedergabe das Ende der Aussaugphase oder den gesamten verbleibenden Schritt ohne Zwischenbilder überschreitet
- **THEN** wird keine Beute doppelt entfernt und keine Energie doppelt übertragen
- **AND** erfolgt eine regelgemäße Karnivorenteilung erst nach Aussaugen und Ankunft, mit exakt dem bisherigen Endzustand

### Requirement: Grasaufnahme bei gehaltenem Spitzenkontakt
Ein Grasfresser SHALL nach Spitzenkontakt im Graszentrum seine Kontaktpose halten, während das Grassymbol kontinuierlich auf null schrumpft und seine Energie zum regelgemäßen Aufnahmewert steigt. Erst nach vollständiger Aufnahme SHALL er den Schritt vollenden. Dies SHALL auch für hinausziehende Teilungshälften gelten. Wirkungsgrad, Sättigung, Verbrauch und abgeschlossene Regelzustände SHALL erhalten bleiben.

#### Scenario: Gras vor dem Nachziehen aufnehmen
- **WHEN** die erste Spitze das Zentrum einer grasbewachsenen Zielzelle erreicht
- **THEN** sind Gras und Ausgangsenergie zunächst vollständig sichtbar
- **AND** schrumpft das Gras während des gehaltenen Kontakts und die Bewohnerenergie steigt kontinuierlich
- **AND** bewegen sich die Spitzen erst nach vollständig verschwundenem Gras zu ihren Endpositionen

#### Scenario: Teilungshälften und stationäre Grasfresser
- **WHEN** eine Hälfte in eine grasbewachsene Nachbarzelle schreitet oder ein Grasfresser in seiner Zelle Gras aufnimmt
- **THEN** wird das Gras am jeweiligen Zellzentrum kontinuierlich aufgenommen
- **AND** wird eine stehenbleibende Teilungshälfte nicht erneut gefüttert und kein zusätzlicher aktiver Zug ausgelöst
- **AND** ist die Aufnahme einer gejagten Hälfte vor dem Karnivorenkontakt abgeschlossen

#### Scenario: Pausierte und beschleunigte Aufnahme
- **WHEN** während der Grasaufnahme pausiert, das Tempo geändert oder das Fenster vergrößert wird
- **THEN** bleiben Restgras, Energie und Spitzenfortschritt bei Pause eingefroren und setzen sich ohne Sprung fort
- **AND** bleiben Graszentrum und Kontaktspitze deckungsgleich und ausgelassene Bilder erzeugen keine doppelte Aufnahme
