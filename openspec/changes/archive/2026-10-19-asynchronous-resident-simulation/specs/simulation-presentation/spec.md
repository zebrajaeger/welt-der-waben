# Spec Delta

## MODIFIED Requirements

### Requirement: Feste Simulationstakte und einstellbare Wiedergabe
Der Browser SHALL 60 feste Ticks pro Simulationssekunde darstellen. Tempo SHALL das Verhältnis von Simulationszeit zu Realzeit bestimmen. Bewohneraktionen SHALL unabhängig beginnen und abschließen dürfen; Mahlzeiten und Teilungen SHALL keine globale Rundengrenze erzwingen. Bildausfälle SHALL keine Ticks doppelt ausführen.

#### Scenario: Geschwindigkeitsänderung
- **WHEN** der Zeitfaktor erhöht wird
- **THEN** verstreichen pro Realzeit mehr Ticks bei unveränderten Raten pro Simulationssekunde

#### Scenario: Verzögerte Darstellung
- **WHEN** Bilder verspätet eintreffen oder die Anwendung aus einem inaktiven Tab zurückkehrt
- **THEN** werden Ticks in ihrer Reihenfolge genau einmal verarbeitet; nach gleicher Tickzahl ist das Ergebnis bildratenunabhängig und lange Inaktivität erzeugt keine unbeschränkte Nachholschleife

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
Die Tempoauswahl SHALL bei Pause und Einzeltick bedienbar bleiben. Änderung in der Pause SHALL keinen Tick auslösen. Weiter SHALL den neuen Faktor nutzen. Einzelschritt SHALL unabhängig vom Zeitfaktor genau einen Tick ausführen. Neustart SHALL die Auswahl erhalten und Neuladen SHALL den konfigurierten Startfaktor verwenden.

#### Scenario: Änderung während einer Pause
- **WHEN** in der Pause ein anderer Zeitfaktor gewählt wird
- **THEN** bleiben Bild, Tickzahl und Aktionen unverändert, bis Weiter oder Einzelschritt betätigt wird

#### Scenario: Einzelschritt mit Tempoänderung
- **WHEN** vor einem Einzelschritt ein anderer Zeitfaktor gewählt wird
- **THEN** wird dennoch genau ein Tick ausgeführt und danach pausiert

#### Scenario: Neustart und Neuladen
- **WHEN** nach einer Tempowahl neu gestartet und später neu geladen wird
- **THEN** behält Neustart die Wahl und Neuladen verwendet den konfigurierten Startfaktor

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

## ADDED Requirements

### Requirement: Sichtbare unabhängige Simulationszeit
Die Oberfläche SHALL aktuelle Tickzahl, daraus berechnete Simulationszeit und Populationen anzeigen. Gras SHALL in kleinen zeitlich gleichmäßigen Änderungen wachsen. Unbeteiligte Bewohner SHALL während langer Mahlzeiten und Teilungen weiter sichtbar handeln. Bei Start und nach Teilungen SHALL keine gemeinsame Aktionswelle erzwungen werden.

#### Scenario: Unterschiedlich lange Mahlzeiten
- **WHEN** zwei unabhängige Tiere zu verschiedenen Zeiten oder mit unterschiedlichen Energiemengen Nahrung aufnehmen
- **THEN** sind unterschiedliche Aktionsphasen gleichzeitig sichtbar
- **AND** kann das Tier mit der kürzeren Mahlzeit bereits weiterziehen, während das andere noch saugt

#### Scenario: Feines Graswachstum
- **WHEN** eine unberührte Zelle während 60 Ticks beobachtet wird
- **THEN** erhält sie 60 kleine Wachstumsbeiträge bis zum Maximum anstelle eines großen Rundensprungs

