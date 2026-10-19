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
Der Browser SHALL 60 feste Ticks pro Simulationssekunde darstellen. Tempo SHALL das Verhältnis von Simulationszeit zu Realzeit bestimmen. Bewohneraktionen SHALL unabhängig beginnen und abschließen dürfen; Mahlzeiten und Teilungen SHALL keine globale Rundengrenze erzwingen. Bildausfälle SHALL keine Ticks doppelt ausführen.

#### Scenario: Geschwindigkeitsänderung
- **WHEN** der Zeitfaktor erhöht wird
- **THEN** verstreichen pro Realzeit mehr Ticks bei unveränderten Raten pro Simulationssekunde

#### Scenario: Verzögerte Darstellung
- **WHEN** Bilder verspätet eintreffen oder die Anwendung aus einem inaktiven Tab zurückkehrt
- **THEN** werden Ticks in ihrer Reihenfolge genau einmal verarbeitet; nach gleicher Tickzahl ist das Ergebnis bildratenunabhängig und lange Inaktivität erzeugt keine unbeschränkte Nachholschleife

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
Eine erfolgreiche Jagd SHALL den Vorstoß auf die tatsächliche lokale Ankunft der Beute abstimmen. Ab Kontakt SHALL sämtliche Jägerspitzen während des Aussaugens halten. Nach vollständigem Aufzehren SHALL der Jäger nachziehen; bei überlebender Restbeute SHALL er zurückziehen. Unabhängige Jagden SHALL keine gemeinsame Kontaktzeit benötigen.

#### Scenario: Bewegte Beute wird bei ihrer Ankunft aufgepiekt
- **WHEN** eine beanspruchte Beute ihre laufende Bewegung beendet
- **THEN** treffen ihre vollständige Ankunft und der vorbereitete Spitzenkontakt zusammen; die Beute bleibt während des beginnenden Aussaugens sichtbar

#### Scenario: Stehende oder neugeborene Beute
- **WHEN** die beanspruchte Beute stillsteht oder gerade eine Teilungsbewegung abschließt
- **THEN** richtet sich der Kontakt auf ihre tatsächliche Zelle, ohne zusätzliche Beutebewegung; laufende Grasaufnahme endet vor dem lokalen Jagdkontakt

#### Scenario: Mehrere Jäger und mehrere Jagden
- **WHEN** mehrere Jäger dieselbe Beute beanspruchen oder unabhängige Jagden stattfinden
- **THEN** greift nur der Reservierungsinhaber diese Beute an; unterlegene Jäger warten lokal, und unabhängige Jagden dürfen verschiedene Kontaktzeiten haben

### Requirement: Vollständige Darstellung der Ereignisfolge
Die Darstellung SHALL Wachstum, Bewegung, Transfer, Teilung und Tod aus dem aktuellen Tickzustand und laufenden lokalen Aktionen abbilden. Restnahrung und übertragene Energie SHALL dem Regelzustand entsprechen. Teilungsbewegungen SHALL keine zusätzlichen aktiven Züge erfinden. Beendete oder abgebrochene Aktionen SHALL keine verwaisten Formen hinterlassen.

#### Scenario: Beute fehlt im fertigen Zustand
- **WHEN** ein Grasfresser nach einem Zellwechsel später aufgezehrt wird
- **THEN** bleiben seine Ankunft, sein Kontakt und seine Restenergie bis zu seinem tatsächlichen Entfernen darstellbar

#### Scenario: Tod und Teilung nach einer Bewegung
- **WHEN** ein Tier während einer eigenen Aktion stirbt oder nach deren Ende teilt
- **THEN** verschwindet es beim tatsächlichen Tod beziehungsweise beginnt die Teilung am lokalen Teilungszeitpunkt und an seiner aktuellen Position

### Requirement: Sichtbare Teilung eines vollen Bewohners
Eine lokale Teilung SHALL aus einem vollen Bewohner kontinuierlich zwei Hälften entstehen lassen. Hinausziehende Hälften SHALL ihre reservierten Nachbarn mit Spitzenbewegung erreichen; bei einem freien Nachbarn SHALL eine Hälfte bleiben. Halbierung und jeweilige Grasaufnahme SHALL getrennt sichtbar sein. Eine lange Mahlzeit einer Hälfte SHALL unbeteiligte Bewohner nicht aufhalten.

#### Scenario: Zwei freie Nachbarn
- **WHEN** eine Teilung zwei unterschiedliche Nachbarn reserviert
- **THEN** ziehen beide Formen in diese Richtungen auseinander und geben nach vollständigem Hinausziehen den Ursprung frei

#### Scenario: Nur ein freier Nachbar
- **WHEN** genau eine freie Nachbarzelle reserviert werden kann
- **THEN** bleibt eine Hälfte am Ursprung und die andere schreitet in diese Zelle

#### Scenario: Kein Platz oder verlorener Teilungskonflikt
- **WHEN** keine Teilung zustande kommt
- **THEN** werden weder zweite Formen noch Teilungsbewegungen oder halbierte Energie dargestellt

#### Scenario: Geteilte Grasfresser als Beute
- **WHEN** eine angekommene Hälfte unabhängig von der anderen lokal gejagt wird
- **THEN** vollendet sie ihre eigene Bewegung vor dem Kontakt; die andere Hälfte muss ihre Mahlzeit nicht auf eine gemeinsame Jagdphase abstimmen

#### Scenario: Unterbrochene Teilung
- **WHEN** während einer Teilung pausiert, die Fenstergröße geändert oder neu gestartet wird
- **THEN** bleiben Fortschritt und Projektion erhalten beziehungsweise wird bei Neustart die gesamte alte Teilung verworfen

### Requirement: Steuerbare unterbrechbare Animation
Pause SHALL Tickfortschritt und sämtliche sichtbaren Vorgänge einfrieren; Weiter SHALL ohne Sprung fortsetzen. Einzelschritt SHALL genau einen Tick ausführen und danach pausieren, auch wenn Aktionen noch laufen. Neustart SHALL alle Aktionen und Reservierungen verwerfen. Größenänderungen SHALL Fortschritte erhalten.

#### Scenario: Pause mitten in einem Schritt
- **WHEN** während einer Bewegung pausiert und später fortgesetzt wird
- **THEN** bleiben Formen, Restnahrung, Energien und Tickzahl eingefroren und setzen sich an derselben Stelle fort

#### Scenario: Einzelschritt und Neustart
- **WHEN** in der Pause ein Einzelschritt ausgelöst wird
- **THEN** steigt die Tickzahl genau um eins und die Wiedergabe bleibt danach pausiert; ein Neustart verwirft alle laufenden Aktionen und ihre späteren Ereignisse

#### Scenario: Größenänderung im Vorstoß
- **WHEN** während eines Vorstoßes die Fenstergröße geändert wird
- **THEN** passen sich Spitzen und Kontaktpunkte an die neue Projektion an, ohne Aktionen neu zu beginnen

### Requirement: Tempoauswahl im Simulationsfenster
Die mit „Tempo“ beschriftete Auswahl SHALL 0,25×, 0,5×, 1×, 2×, 4× und 8× anbieten. Bei 1× SHALL eine Realzeitsekunde einer Simulationssekunde mit 60 Ticks entsprechen. Ein abweichender konfigurierter Startfaktor SHALL zusätzlich angeboten werden. Auswahl und bestehende Bedienelemente SHALL per Tastatur, Zeigegerät und in schmalen Fenstern bedienbar bleiben.

#### Scenario: Standardstart und Auswahl
- **WHEN** die Anwendung mit Standardkonfiguration startet
- **THEN** ist 2× ausgewählt und jede angebotene Geschwindigkeit ohne Neustart wählbar

#### Scenario: Abweichender Konfigurationswert
- **WHEN** ein gültiger abweichender Startfaktor konfiguriert ist
- **THEN** wird dieser zusätzlich angeboten und zunächst verwendet

#### Scenario: Tastatur und kleines Fenster
- **WHEN** die Auswahl per Tastatur oder auf einem schmalen Bildschirm bedient wird
- **THEN** bleiben Beschriftung, Zeitfaktor und Wiedergabebedienelemente erreichbar und erkennbar

### Requirement: Tempoänderung ohne Animationssprung
Ein Tempowechsel SHALL ausschließlich die weitere Simulationszeit beschleunigen oder verlangsamen. Tick- und Aktionsfortschritte SHALL erhalten bleiben. Bewohner, Wachstum und Verbrauch SHALL denselben Zeitfaktor verwenden. Nach gleicher Tickzahl SHALL derselbe Anfangszustand mit derselben Zufallsfolge unabhängig vom Wiedergabetempo denselben Zustand ergeben.

#### Scenario: Beschleunigen mitten im Schritt
- **WHEN** das Tempo während einer lokalen Bewegung oder Teilung erhöht wird
- **THEN** bleiben die Formen am Änderungszeitpunkt erhalten und laufen danach schneller; keine Aktion wird neu ausgewürfelt

#### Scenario: Verlangsamen vor dem Jagdkontakt
- **WHEN** das Tempo vor einem lokalen Jagdkontakt verringert wird
- **THEN** bleiben Jäger und beanspruchte Beute aufeinander abgestimmt und die Beute bis zum Kontakt sowie während des Aussaugens sichtbar

#### Scenario: Gleiches Regelresultat bei verschiedenen Tempos
- **WHEN** derselbe Anfangszustand und Zufallsstrom bei verschiedenen Tempos verwendet werden
- **THEN** sind nach gleicher Tickzahl Regelzustand, Reservierungen und Aktionsfortschritte identisch

### Requirement: Tempo und bestehende Wiedergabebedienung
Die Tempoauswahl SHALL bei Pause und Einzeltick bedienbar bleiben. Änderung in der Pause SHALL keinen Tick auslösen. Weiter SHALL den neuen Faktor nutzen. Einzelschritt SHALL unabhängig vom Zeitfaktor genau einen Tick ausführen. Neustart SHALL aktive Parameter und Tempo erhalten. Neuladen SHALL gültige gespeicherte Einstellungen einschließlich Tempo verwenden, andernfalls die Programmstandards. Sofortige Tempowahl SHALL ohne ausdrückliches Speichern nicht dauerhaft sein.

#### Scenario: Änderung während einer Pause
- **WHEN** in der Pause ein anderer Zeitfaktor gewählt wird
- **THEN** bleiben Bild, Tickzahl und Aktionen unverändert, bis Weiter oder Einzelschritt betätigt wird

#### Scenario: Einzelschritt mit Tempoänderung
- **WHEN** vor einem Einzelschritt ein anderer Zeitfaktor gewählt wird
- **THEN** wird dennoch genau ein Tick ausgeführt und danach pausiert

#### Scenario: Neustart und Neuladen
- **WHEN** nach einer Tempowahl neu gestartet und später neu geladen wird
- **THEN** behält Neustart aktive Parameter und Tempowahl; Neuladen verwendet die zuletzt ausdrücklich gespeicherten gültigen Einstellungen oder ohne solche Daten die Programmstandards

#### Scenario: Neuer Lauf bei unbearbeitetem Entwurf
- **WHEN** Formularentwurf und aktive Einstellungen voneinander abweichen und Neustart betätigt wird
- **THEN** verwendet der neue Lauf die aktiven Einstellungen und das aktuelle Tempo, ohne den Entwurf zu übernehmen oder zu verwerfen

### Requirement: Kontinuierliches Aussaugen der Beuteenergie
Beute SHALL während der Entnahme entsprechend ihrer Restenergie schrumpfen. Jägerenergie SHALL Transfer und laufenden Verbrauch abbilden. Aussaugdauer SHALL von tatsächlich übertragener Energie und konstanter Rate abhängen. Nur bei Energie null SHALL die Beute restlos verschwinden; überlebende Restbeute SHALL sichtbar bleiben. Es SHALL kein Gewinn vor Kontakt und kein Verwerfen überschüssiger Nahrung erfolgen.

#### Scenario: Beginn und Zwischenzustand
- **WHEN** Kontakt erreicht ist und anschließend Energie übertragen wird
- **THEN** bleibt die Beute zunächst sichtbar, während ihre Restenergie sinkt und die Jägerspitze am Kontakt hält

#### Scenario: Vollständiges Aufzehren ohne Restlinien
- **WHEN** die Beuteenergie vollständig aufgebraucht wird
- **THEN** verschwinden Füllung und Striche restlos und der Jäger zieht anschließend in die freie Beutezelle

#### Scenario: Wirkungsgrad und Sättigung
- **WHEN** Wirkungsgrad oder freie Jägerkapazität die Aufnahme begrenzen
- **THEN** wird nur nutzbare Nahrung entnommen; überlebende Restbeute bleibt sichtbar und der Jäger zieht zur Ausgangsform zurück

### Requirement: Aussaugen innerhalb der steuerbaren Schrittanimation
Aussaugen SHALL Teil einer lokalen Aktion ohne globale Rundengrenze sein. Erst danach SHALL Nachziehen, Rückziehen oder lokale Teilung folgen. Pause, Tempo- und Größenwechsel SHALL Fortschritte erhalten; Neustart SHALL sie verwerfen. Übersprungene Bilder SHALL keine zusätzliche Energie erzeugen oder Restnahrung vernichten.

#### Scenario: Unterbrechen und Tempo ändern
- **WHEN** während einer Mahlzeit pausiert, Tempo geändert, fortgesetzt oder das Fenster vergrößert wird
- **THEN** bleiben Fortschritte in der Pause erhalten und setzen sich ohne Sprung fort; der Spitzenkontakt bleibt deckungsgleich

#### Scenario: Einzelschritt und Neustart
- **WHEN** während einer Mahlzeit ein Einzeltick ausgelöst oder neu gestartet wird
- **THEN** führt Einzelschritt genau einen Tick weiter und hält verbleibende Aktionen pausiert; Neustart verwirft alte Mahlzeiten und Reservierungen

#### Scenario: Ausgelassene Zwischenbilder und nachfolgende Teilung
- **WHEN** ein Bild Aussaugende, Ankunft und folgende Teilung ohne Zwischenbilder überschreitet
- **THEN** werden die lokalen Ereignisse in ihrer Reihenfolge genau einmal verarbeitet und unabhängige Aktionen nicht auf denselben Endzeitpunkt gestaucht

### Requirement: Grasaufnahme bei gehaltenem Spitzenkontakt
Ein Grasfresser SHALL seine Kontaktpose während lokaler Grasaufnahme halten. Grassymbol und Bewohnerenergie SHALL tatsächliche Entnahme, Wachstum und Verbrauch abbilden. Aussaugdauer SHALL von übertragener Energie abhängen. Erst danach SHALL er nachziehen. Überschüssiges und nachwachsendes Gras SHALL erhalten bleiben. Dies SHALL auch für hinausziehende Teilungshälften gelten.

#### Scenario: Gras vor dem Nachziehen aufnehmen
- **WHEN** eine Spitze das Zentrum einer grasbewachsenen Zielzelle erreicht
- **THEN** beginnt lokale Aufnahme, während der Körper hält; erst danach wird nachgezogen und nicht aufgenommenes Gras bleibt sichtbar

#### Scenario: Teilungshälften und stationäre Grasfresser
- **WHEN** eine Hälfte hinausschreitet oder ein stationärer Grasfresser lokal frisst
- **THEN** erfolgt die Aufnahme am tatsächlichen Zellzentrum; verbleibende Hälften erhalten keine erfundene zweite Teilungsmahlzeit und Jagden werden auf lokale Ankunft abgestimmt

#### Scenario: Pausierte und beschleunigte Aufnahme
- **WHEN** während einer Aufnahme pausiert, Tempo geändert oder das Fenster vergrößert wird
- **THEN** bleiben Tick-, Energie- und Formfortschritt bei Pause unverändert und setzen sich ohne Sprung fort; Spitze und Graszentrum bleiben deckungsgleich

### Requirement: Sichtbare unabhängige Simulationszeit
Die Oberfläche SHALL aktuelle Tickzahl, daraus berechnete Simulationszeit und Populationen anzeigen. Gras SHALL in kleinen zeitlich gleichmäßigen Änderungen wachsen. Unbeteiligte Bewohner SHALL während langer Mahlzeiten und Teilungen weiter sichtbar handeln. Bei Start und nach Teilungen SHALL keine gemeinsame Aktionswelle erzwungen werden.

#### Scenario: Unterschiedlich lange Mahlzeiten
- **WHEN** zwei unabhängige Tiere zu verschiedenen Zeiten oder mit unterschiedlichen Energiemengen Nahrung aufnehmen
- **THEN** sind unterschiedliche Aktionsphasen gleichzeitig sichtbar
- **AND** kann das Tier mit der kürzeren Mahlzeit bereits weiterziehen, während das andere noch saugt

#### Scenario: Feines Graswachstum
- **WHEN** eine unberührte Zelle während 60 Ticks beobachtet wird
- **THEN** erhält sie 60 kleine Wachstumsbeiträge bis zum Maximum anstelle eines großen Rundensprungs

### Requirement: Maximale proportionale Spielfelddarstellung
Die Oberfläche SHALL die verfügbare Fensterbreite ohne feste maximale Seitenbreite nutzen. Das gesamte Spielfeld SHALL mit einheitlichem Maßstab für beide Achsen maximal in die Zeichenfläche zwischen den übrigen Oberflächenelementen passen und dort zentriert sein. Kompakte Außen- und Zeichenabstände SHALL zulässig sein. Restflächen SHALL ausschließlich durch diese Abstände und das unterschiedliche Seitenverhältnis entstehen; Zellen SHALL weder verzerrt noch abgeschnitten werden.

#### Scenario: Breites Browserfenster
- **WHEN** das Fenster über 1500 CSS-Pixel hinaus verbreitert wird
- **THEN** wächst die verfügbare Zeichenfläche mit der Fensterbreite weiter
- **AND** wächst das Spielfeld solange mit, bis die verfügbare Höhe seine Größe begrenzt

#### Scenario: Breite oder Höhe begrenzt
- **WHEN** ein Feld in eine Zeichenfläche mit abweichendem Seitenverhältnis eingepasst wird
- **THEN** erreicht das Feld einschließlich seiner Zeichenabstände mindestens eine Flächengrenze bis auf höchstens zwei CSS-Pixel Rundungsabweichung
- **AND** bleibt es auf der anderen Achse zentriert und vollständig sichtbar, mit demselben Maßstab für beide Achsen

#### Scenario: Andere Kartengeometrie
- **WHEN** eine gültige Karte mit einer einzelnen Zelle, einer einzelnen Reihe oder einer einzelnen Spalte angezeigt wird
- **THEN** wird ihre tatsächliche Geometrie ebenso maximal und unverzerrt eingepasst, ohne Zellenzahl oder Nachbarschaften zu verändern

### Requirement: Größenanpassung an die tatsächliche Oberfläche
Die Zeichenfläche SHALL die tatsächlichen Höhen von Kopf, Einstellungen, Meldungen, Status und Legende berücksichtigen. Fensteränderungen und Layoutänderungen SHALL die Darstellung auch bei Pause neu einpassen. Die Größenanpassung SHALL nur die Projektion ändern und weder Simulationszustand noch Tempo, Pausenmodus, Entwurf oder Aktionsfortschritt eigenständig verändern.

#### Scenario: Einstellungen öffnen und schließen
- **WHEN** die Einstellungen auf- oder eingeklappt werden
- **THEN** passt sich das Spielfeld an die verbleibende Höhe an und nutzt nach dem Einklappen den frei gewordenen Platz wieder
- **AND** bleiben alle Formularwerte und Bedienfunktionen erhalten

#### Scenario: Umbruch oder Meldung
- **WHEN** Bedienelemente oder Legende umbrechen oder eine Einstellungs- beziehungsweise Speichermeldung ihre Höhe ändert
- **THEN** wird die Zeichenfläche aus dem neuen Layout bestimmt, ohne pauschale Höhenreserve

#### Scenario: Pausierte Bewegung skalieren
- **WHEN** während einer pausierten Bewegung oder Mahlzeit Fenstergröße oder Oberflächenhöhe geändert werden
- **THEN** bleiben Tickzahl, Restnahrung, Energien und lokale Aktionsfortschritte identisch und nur die sichtbare Projektion ändert sich
- **AND** bleiben Kontaktspitze und Zielzentrum deckungsgleich

### Requirement: Erreichbare Bedienung bei geringer Fensterhöhe
Bei zu geringer Fensterhöhe SHALL die Seite vertikal scrollbar bleiben und eine Zeichenfläche von mindestens 160 CSS-Pixel Höhe anbieten. Lange geöffnete Einstellungen SHALL innerhalb einer begrenzten Höhe scrollbar sein. Alle Eingaben und Aktionen SHALL per Tastatur erreichbar bleiben. Die Seite SHALL kein horizontales Scrollen oder Überdecken der Bedienung benötigen.

#### Scenario: Niedriges Fenster mit offenen Einstellungen
- **WHEN** bei 360 × 480 CSS-Pixel die Einstellungen geöffnet und ihre letzten Eingaben sowie Aktionen aufgerufen werden
- **THEN** bleiben diese durch Scrollen und Tastaturfokus erreichbar; das Spielfeld bleibt vollständig innerhalb seiner mindestens 160 Pixel hohen Zeichenfläche
- **AND** entstehen keine negativen oder ungültigen Zeichengrößen und kein horizontales Seitenscrolling

### Requirement: Direkt erreichbarer GitHub-Quellcode
Die Oberfläche SHALL einen sichtbaren kompakten Link auf `https://github.com/zebrajaeger/welt-der-waben` anbieten. Er SHALL das Repository in einem neuen Tab öffnen und die Simulationsseite erhalten. Der Link SHALL ohne zusätzliche externe Ressourcen erkennbar, per Tastatur aktivierbar und mit sichtbarem Fokus sowie dem zugänglichen Namen „Quellcode auf GitHub (neuer Tab)“ versehen sein.

#### Scenario: Quellcode öffnen
- **WHEN** Benutzer den GitHub-Link mit Zeigegerät oder per Tastatur aktivieren
- **THEN** öffnet sich das Repository in einem neuen Tab und die Simulationsseite bleibt geöffnet
- **AND** werden weder Einstellungen übernommen oder gespeichert noch ein Neustart oder ein Wechsel des Pausenmodus ausgelöst
- **AND** weist die zugängliche Beschriftung auf GitHub und den neuen Tab hin

### Requirement: Quellcode-Link ohne zusätzlichen vertikalen Platzbedarf
Der Quellcode-Link SHALL in den vorhandenen Kopfbereich passen, ohne dessen Höhe zu erhöhen, eine zusätzliche Zeile zu erzeugen oder die Zeichenfläche zu verkleinern. Er SHALL Text, Bedienelemente und Spielfeld nicht überdecken. Bei breiten Fenstern und ab 360 CSS-Pixel Fensterbreite SHALL er sichtbar und erreichbar bleiben, ohne horizontales Seitenscrolling zu verursachen. Dies SHALL auch mit geöffneten Einstellungen gelten.

#### Scenario: Gleichbleibende Spielfeldhöhe
- **WHEN** die Oberfläche bei 1440 × 900, 360 × 740 oder 360 × 480 CSS-Pixel mit jeweils gleichem Einstellungszustand angezeigt wird
- **THEN** sind Kopfhöhe und Höhe der Zeichenfläche mit sichtbarem Link gegenüber dem bisherigen Layout ohne Link bis auf höchstens einen CSS-Pixel gleich
- **AND** bleibt der Link innerhalb des Fensters, ohne sichtbaren Text oder andere Bedienelemente zu überdecken
- **AND** gelten die bestehenden Regeln für proportionale Spielfelddarstellung und erreichbare Bedienung weiterhin

#### Scenario: Fokus und geöffnete Einstellungen
- **WHEN** Benutzer bei geöffneten oder geschlossenen Einstellungen den Link per Tab fokussieren
- **THEN** bleiben Symbol und Fokusmarkierung sichtbar und der Link lässt sich ohne horizontales Scrollen aktivieren
- **AND** werden durch den Fokus keine neue Zeile und keine Größenänderung des Kopfbereichs ausgelöst
