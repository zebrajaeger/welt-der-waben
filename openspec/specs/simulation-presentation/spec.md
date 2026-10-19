# simulation-presentation Specification

## Purpose

Macht den Zustand und Ablauf des Wabenökosystems im Browser sichtbar und unterstützt eine schnelle Rückmeldung während der Entwicklung.

## Requirements

### Requirement: Visuelle Waben und Gras
Der Browser SHALL das gesamte Sechseckfeld mit unterscheidbaren Zellgrenzen zeichnen und das Gras jeder Zelle als mittigen Kreis beziehungsweise mittiges Oval darstellen, dessen Größe mit der vorhandenen Grasmenge skaliert.

#### Scenario: Unterschiedlicher Grasbestand
- **WHEN** zwei gleich große Zellen unterschiedliche Grasanteile besitzen
- **THEN** erscheint in der Zelle mit mehr Gras das größere mittige Grassymbol

### Requirement: Energieabhängige Lebewesensymbole
Der Browser SHALL Grasfresser und Karnivoren unterscheidbar als dreizackige Sterne darstellen. Bei geringer Energie SHALL die Form aus drei dünnen Strichen bestehen und bei hoher Energie zu einem ausgefüllten dreieckigen Symbol werden; dazwischen SHALL die Füllung mit dem Anteil an der jeweiligen Maximalenergie zunehmen.

#### Scenario: Energieunterschied
- **WHEN** ein fast verhungerndes und ein energiereiches Lebewesen angezeigt werden
- **THEN** ist das erste als drei Striche und das zweite als gefülltes Dreieck erkennbar

### Requirement: Feste Simulationstakte und einstellbare Wiedergabe
Der Browser SHALL die Simulation in gleich langen logischen Schritten wiedergeben. Eine konfigurierte Wiedergabegeschwindigkeit SHALL nur die Häufigkeit der angezeigten Simulationsschritte bestimmen und nicht Graswachstum oder Energieverbrauch pro Schritt verändern. Alle Animationen eines Schritts SHALL in dessen Wiedergabeintervall passen und vor dem nächsten Schritt abschließen; ausgefallene Bilder SHALL keine überlappenden oder mehrfach ausgeführten Schritte erzeugen.

#### Scenario: Geschwindigkeitsänderung
- **WHEN** die Wiedergabegeschwindigkeit erhöht wird
- **THEN** erfolgen pro realer Zeit mehr Simulationsschritte, aber ein einzelner Schritt verwendet unveränderte Wachstums- und Verbrauchswerte
- **AND** werden Vorstoß und Nachziehbewegungen innerhalb des kürzeren Intervalls zeitlich entsprechend skaliert

#### Scenario: Verzögerte Darstellung
- **WHEN** einzelne Bilder verspätet eintreffen oder die Anwendung aus einem inaktiven Tab zurückkehrt
- **THEN** werden fällige Ereignisse in ihrer Reihenfolge genau einmal verarbeitet und keine parallelen Simulationsübergänge begonnen
- **AND** bleibt der resultierende Regelzustand unabhängig von Bildrate und Animationszeit

### Requirement: Entwicklungsaktualisierung
Die Entwicklungsumgebung SHALL beim Ändern von Anwendungscode im laufenden Entwicklungsprozess den Browser automatisch aktualisieren, sodass die aktuelle Darstellung ohne manuelles Neuladen sichtbar wird.

#### Scenario: Quelltextänderung im Entwicklungsmodus
- **WHEN** eine Anwendungsdatei bei laufendem Entwicklungsserver geändert wird
- **THEN** zeigt der Browser die aktualisierte Version ohne manuelles Neuladen an

### Requirement: Bewegung über drei einzeln geführte Spitzen
Der Browser SHALL jeden tatsächlichen Zellwechsel beider Arten durch nacheinander bewegte Spitzen zeigen. Zuerst SHALL die dem Zielzentrum nächste Spitze dieses erreichen. Danach SHALL die zweite und dann die dritte Spitze ins Zielfeld nachziehen. Während des Nachziehens SHALL die erste Spitze zur endgültigen, vom Ausgangszentrum am weitesten entfernten Spitze wandern. Der Übergang SHALL kontinuierlich und ohne Positionssprung enden.

#### Scenario: Vorstrecken und zweimaliges Nachziehen
- **WHEN** ein Bewohner in eine Nachbarzelle zieht
- **THEN** erreicht zuerst ausschließlich seine führende Spitze deren Zentrum
- **AND** die beiden anderen Spitzen verlassen ihre Ausgangspositionen anschließend nacheinander
- **AND** am Ende liegen alle drei Spitzen in der normalen Bewohnerform um das Zielzentrum, mit der ersten Spitze auf der vom Ausgangszentrum abgewandten Seite

#### Scenario: Bewegungsrichtungen und gleich nahe Spitzen
- **WHEN** ein Bewohner in einer der sechs Nachbarrichtungen zieht, auch zwischen geraden und ungeraden Reihen
- **THEN** wird die zum Zielzentrum geometrisch nächste Spitze zuerst bewegt
- **AND** bei gleichem Abstand wird eine der gleich nahen Spitzen reproduzierbar gewählt

#### Scenario: Bewohner ohne Zellwechsel
- **WHEN** ein Bewohner keinen Zug ausführt oder einen Zielkonflikt verliert
- **THEN** bleibt seine Form in seiner aktuellen Zelle und führt keine Schrittanimation aus

### Requirement: Auf die Ankunft abgestimmte Jagd
Bei erfolgreicher Jagd SHALL die führende Karnivorenspitze das Zentrum der Beutezelle genau dann erreichen, wenn der Grasfresser seine endgültige Bewegungsform dort erreicht. Die Beute SHALL bis zu diesem Kontakt sichtbar bleiben und beim Kontakt verschwinden. Anschließend SHALL der Karnivor seine beiden anderen Spitzen nachziehen und die Beutezelle einnehmen. Die Animation SHALL nur den tatsächlich erfolgreichen Jäger zeigen.

#### Scenario: Bewegte Beute wird bei ihrer Ankunft aufgepiekt
- **WHEN** ein Grasfresser in diesem Schritt zieht und anschließend gefressen wird
- **THEN** beginnt der Vorstoß der Karnivorenspitze rechtzeitig vor der Ankunft
- **AND** Spitzenkontakt, vollständige Ankunft der Beute und deren sichtbares Verschwinden sind derselbe Zeitpunkt
- **AND** der restliche Karnivorenkörper folgt erst nach dem Kontakt

#### Scenario: Stehende oder neugeborene Beute
- **WHEN** die gefressene Beute stehen geblieben oder in der Grasfresserphase geboren worden ist
- **THEN** richtet sich der Kontakt auf deren tatsächlich belegte Zelle zum gemeinsamen Jagdzeitpunkt
- **AND** wird ausschließlich ihre tatsächlich erfolgte Teilungsbewegung gezeigt, ohne eine zusätzliche eigene Nahrungsbewegung zu erfinden

#### Scenario: Mehrere Jäger und mehrere Jagden
- **WHEN** mehrere Karnivoren dieselbe Beute anvisieren oder unabhängige Jagden im selben Schritt stattfinden
- **THEN** bewegt sich nur der je Beute erfolgreiche Karnivor auf diese Beutezelle
- **AND** unterlegene Karnivoren bleiben stehen, und jede Beute verschwindet genau einmal
- **AND** unabhängige Jagden laufen auf derselben Zeitleiste parallel

### Requirement: Vollständige Darstellung der Ereignisfolge
Die Darstellung SHALL Bewegungen, Grasaufnahme, Teilung, Jagd und Tod in ihrer logischen Reihenfolge abbilden. Ein später entferntes Tier SHALL bis zu seinem sichtbaren Entfernungsereignis darstellbar bleiben. Die Bewegung einer neuen Hälfte während der Teilung SHALL als Teil des Geburtsereignisses gelten und keinen eigenen aktiven Zug auslösen. Am Ende SHALL die Darstellung exakt den abgeschlossenen Simulationszustand zeigen.

#### Scenario: Beute fehlt im fertigen Zustand
- **WHEN** ein Grasfresser nach einem Zellwechsel noch im selben Schritt gefressen wird
- **THEN** bleiben seine Ausgangsform, seine Zielzelle und seine Ankunft bis zum Jagdkontakt darstellbar

#### Scenario: Tod und Teilung nach einer Bewegung
- **WHEN** ein Tier nach seinem Zug durch Energieverbrauch stirbt oder Nachwuchs erzeugt
- **THEN** verschwindet es beziehungsweise erscheint der Nachwuchs erst am entsprechenden Phasenabschluss
- **AND** richtet sich eine Teilung nach einer Jagd nach der neuen Karnivorenposition

### Requirement: Sichtbare Teilung eines vollen Bewohners
Eine erfolgreiche Teilung SHALL den vollen Bewohner zeigen und daraus kontinuierlich zwei Hälften entstehen lassen. Jede hinausziehende Hälfte SHALL mit der Spitzenbewegung in ihre Nachbarzelle schreiten. Bei nur einer freien Zelle SHALL eine Hälfte im Ursprung bleiben. Die Energieform SHALL zunächst die Halbierung und bei Grasfresserankunft danach die Energie aus aufgenommenem Gras zeigen. Das Gras der Zielzellen SHALL bis zur Ankunft sichtbar bleiben und dann verschwinden.

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

### Requirement: Steuerbare unterbrechbare Animation
Pause SHALL den sichtbaren Animationsfortschritt einfrieren und Weiter SHALL ihn ohne Sprung fortsetzen. Einzelschritt SHALL genau einen vollständigen animierten Simulationsschritt abspielen und danach pausieren; weitere Einzelschritt-Aufrufe währenddessen SHALL keinen zusätzlichen Schritt starten. Neustart SHALL einen laufenden Übergang verwerfen. Größenänderungen SHALL dessen Fortschritt und Ereignisreihenfolge erhalten.

#### Scenario: Pause mitten in einem Schritt
- **WHEN** während einer Spitzenbewegung pausiert und später fortgesetzt wird
- **THEN** bleiben Form, Beutesichtbarkeit und Fortschritt während der Pause unverändert
- **AND** setzt die Bewegung an derselben Stelle fort

#### Scenario: Einzelschritt und Neustart
- **WHEN** im pausierten Zustand ein Einzelschritt ausgelöst wird
- **THEN** wird genau ein Übergang vollständig animiert und anschließend der neue Schrittstand angezeigt
- **AND** verhindert Neustart während des Übergangs alle späteren Ereignisse dieses alten Übergangs

#### Scenario: Größenänderung im Vorstoß
- **WHEN** während einer Bewegung die Fenstergröße geändert wird
- **THEN** passen sich alle Spitzen an das neue Wabenraster an, ohne den Übergang neu zu beginnen

### Requirement: Tempoauswahl im Simulationsfenster
Die Oberfläche SHALL eine mit „Tempo“ beschriftete Auswahl für 0,25, 0,5, 1, 2, 4 und 8 Schritte pro Sekunde anbieten und den aktuellen Wert mit Einheit anzeigen. Der Startwert SHALL aus der Konfiguration stammen; ein abweichender gültiger Startwert SHALL zusätzlich auswählbar sein. Die Auswahl SHALL mit Tastatur und Zeigegeräten sowie in schmalen Fenstern bedienbar sein.

#### Scenario: Standardstart und Auswahl
- **WHEN** die Anwendung mit der Standardkonfiguration geöffnet wird
- **THEN** ist „2 Schritte/s“ ausgewählt und jede angebotene Geschwindigkeit kann ohne Neustart gewählt werden

#### Scenario: Abweichender Konfigurationswert
- **WHEN** ein gültiger Startwert außerhalb der angebotenen Standardwerte konfiguriert ist
- **THEN** wird dieser als zusätzliche Option angezeigt und zunächst verwendet

#### Scenario: Tastatur und kleines Fenster
- **WHEN** ein Benutzer die Auswahl per Tastatur oder auf einem schmalen Bildschirm bedient
- **THEN** bleiben Beschriftung, aktueller Wert und alle bestehenden Wiedergabebedienelemente erkennbar und erreichbar

### Requirement: Tempoänderung ohne Animationssprung
Eine Tempoänderung SHALL ab dem Änderungszeitpunkt die weitere Wiedergabe beschleunigen oder verlangsamen und den bis dahin erreichten normierten Fortschritt erhalten. Sie SHALL weder einen Schritt neu berechnen noch eine zusätzliche Aktion auslösen. Bewegung, Teilung und Jagdkontakt SHALL gemeinsam skaliert werden. Regelzustand und Zufallsfolge je abgeschlossenem Schritt SHALL vom gewählten Tempo unabhängig bleiben.

#### Scenario: Beschleunigen mitten im Schritt
- **WHEN** das Tempo während einer Bewegung oder Teilung erhöht wird
- **THEN** bleibt die sichtbare Form am Änderungszeitpunkt erhalten und bewegt sich anschließend entsprechend schneller weiter
- **AND** werden die verbleibenden Ereignisse genau einmal in ihrer bisherigen Reihenfolge ausgeführt

#### Scenario: Verlangsamen vor dem Jagdkontakt
- **WHEN** das Tempo während des Vorstoßes einer Karnivorenspitze verringert wird
- **THEN** erreichen Karnivorenspitze und Grasfresser weiterhin gleichzeitig den vereinbarten Kontaktzeitpunkt
- **AND** bleibt die Beute bis dahin sichtbar

#### Scenario: Gleiches Regelresultat bei verschiedenen Tempos
- **WHEN** dieselbe Anfangsbelegung und Zufallsfolge mit unterschiedlichen Tempos oder mehreren Tempoänderungen abgespielt werden
- **THEN** sind Zustand, Gras, Energien und Populationen nach derselben Anzahl vollständiger Schritte identisch

### Requirement: Tempo und bestehende Wiedergabebedienung
Die Tempoauswahl SHALL während Pause und Einzelschritt bedienbar bleiben. Eine Änderung in der Pause SHALL den Animationsfortschritt und Pausenmodus erhalten; Weiter SHALL das neue Tempo nutzen. Einzelschritt SHALL mit dem gewählten Tempo genau einen Schritt abspielen und danach pausieren. Neustart SHALL das gewählte Tempo erhalten; Neuladen SHALL den konfigurierten Startwert wiederherstellen.

#### Scenario: Änderung während einer Pause
- **WHEN** ein pausierter Übergang eine neue Geschwindigkeit erhält
- **THEN** bleiben Bild, abgeschlossene Schrittzahl und Fortschritt eingefroren, bis Weiter betätigt wird
- **AND** gilt das neue Tempo für die Fortsetzung

#### Scenario: Einzelschritt mit Tempoänderung
- **WHEN** während eines animierten Einzelschritts eine andere Geschwindigkeit gewählt wird
- **THEN** wird derselbe Schritt mit dem neuen Tempo beendet und anschließend pausiert, ohne einen weiteren Schritt zu starten

#### Scenario: Neustart und Neuladen
- **WHEN** ein Benutzer nach einer Tempowahl neu startet und später die Seite neu lädt
- **THEN** erhält Neustart die Wahl und Neuladen setzt sie auf den konfigurierten Startwert zurück
