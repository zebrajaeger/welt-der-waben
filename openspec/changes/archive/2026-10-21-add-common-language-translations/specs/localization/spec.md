# Spec Delta

## MODIFIED Requirements

### Requirement: Automatische Sprachwahl mit Englisch als Standard
Die Anwendung SHALL zuerst eine gespeicherte unterstützte Sprachwahl verwenden, sonst die erste passende Browsersprache in Präferenzreihenfolge. Pro Präferenz SHALL ein exakter Treffer vor einer passenden Schriftvariante und der Basissprache gelten. Ohne Treffer SHALL Englisch gelten; ohne nutzbare Sprachliste SHALL die einzelne Browsersprache geprüft werden. Chinesische Regionalpräferenzen SHALL ihrer Schriftvariante und norwegisches `no` dem Katalog `nb` zugeordnet werden.

#### Scenario: Unterstützte regionale Variante
- **WHEN** die Browserpräferenz `de-CH` beziehungsweise `en-GB` lautet
- **THEN** erscheint die Anwendung auf Deutsch beziehungsweise Englisch

#### Scenario: Reihenfolge und Rückfall
- **WHEN** die Sprachliste `fr-FR`, `de-DE`, `en-US` enthält
- **THEN** wird mit dem ausgelieferten französischen Katalog Französisch gewählt
- **WHEN** ausschließlich nicht unterstützte Sprachen oder keine nutzbaren Sprachangaben vorliegen
- **THEN** erscheint die Anwendung auf Englisch

#### Scenario: Chinesische Schriftvarianten
- **WHEN** die Präferenz `zh`, `zh-CN`, `zh-SG` oder `zh-Hans` lautet
- **THEN** wird vereinfachtes Chinesisch gewählt
- **WHEN** die Präferenz `zh-TW`, `zh-HK`, `zh-MO` oder `zh-Hant` lautet
- **THEN** wird traditionelles Chinesisch gewählt
- **AND** hat eine ausdrücklich angegebene Schriftvariante Vorrang vor der aus einer Region abgeleiteten Variante

#### Scenario: Norwegische Browserkennung
- **WHEN** eine Browserpräferenz `no` oder `no-NO` lautet
- **THEN** wird norwegisches Bokmål aus `nb` verwendet
- **AND** bleibt ein gespeichertes manuelles `de` auch bei norwegischer Browserpräferenz wirksam

## ADDED Requirements

### Requirement: Weltweites Sprachpaket
Die Anwendung SHALL vollständige Kataloge für `en`, `de`, `fr`, `es`, `it`, `pt`, `nl`, `pl`, `cs`, `uk`, `ru`, `tr`, `el`, `ro`, `hu`, `sv`, `da`, `fi`, `nb`, `ar`, `he`, `hi`, `bn`, `zh-Hans`, `zh-Hant`, `ja`, `ko`, `id`, `vi` und `th` liefern. Jeder Katalog SHALL alle englischen Referenzschlüssel mit sinngemäßen Übersetzungen, unveränderten Interpolationsparametern und technischen Bezeichnern enthalten. Englisch SHALL weiterhin Rückfallsprache sein.

#### Scenario: Vollständige neue Sprache
- **WHEN** Französisch, Arabisch oder Japanisch gewählt und anschließend Einstellungen, Validierungsfehler, Verlaufsdiagramm und Tooltip aufgerufen werden
- **THEN** erscheinen alle Anwendungstexte und zugänglichen Namen in der gewählten Sprache
- **AND** bleiben keine nur kopierten englischen Nachrichten, fehlenden Texte oder sichtbaren Übersetzungsschlüssel zurück
- **AND** dürfen technische Namen wie JSON, GitHub und der Projektname sowie sprachlich identische Wörter unverändert bleiben

### Requirement: Erreichbare lange Sprachliste
Die Sprachwahl SHALL alle ausgelieferten Sprachen mit ihren Eigennamen und lokalen Flaggen anzeigen. Ihre Höhe SHALL auf den verfügbaren Fensterraum begrenzt und die Liste bei Bedarf intern scrollbar sein. Der aktive Eintrag SHALL beim Öffnen sichtbar und fokussiert sein. Jede Sprache SHALL per Maus, Touch und Tastatur erreichbar sein; Auswahl, Escape und Außenklick SHALL die Liste weiterhin schließen.

#### Scenario: Später Listeneintrag im kleinen Fenster
- **WHEN** bei 360 × 480 CSS-Pixel eine am Ende der Liste stehende Sprache gewählt wird
- **THEN** sind deren Name und Auswahl ohne horizontales Seitenscrolling erreichbar
- **AND** öffnet die Liste beim nächsten Aufruf mit sichtbarem aktivem Eintrag
- **AND** bleiben Sprachbutton und Wiedergabesteuerung in ihrer bestätigten Kopfzeilenanordnung

### Requirement: Sprachgerechte Schreibrichtung
Arabische und hebräische Oberflächentexte SHALL von rechts nach links erscheinen; die übrigen gelieferten Sprachen SHALL von links nach rechts erscheinen. Das Dokument SHALL Sprache und Schreibrichtung kennzeichnen. Sprach-Eigennamen SHALL unabhängig von der aktuellen Sprache korrekt lesbar bleiben. Ein sofortiger Wechsel zwischen beiden Richtungen SHALL auch vorhandene Meldungen, Tooltiptexte und zugängliche Namen aktualisieren.

#### Scenario: Wechsel zwischen Hebräisch und Französisch
- **WHEN** Französisch auf Hebräisch und anschließend zurück umgestellt wird
- **THEN** wechseln Dokumentrichtung und Texte sofort zwischen Links-nach-rechts und Rechts-nach-links
- **AND** bleiben ein ungültiger Formulareintrag, Tick, Pausemodus, Historie und Diagrammoptionen erhalten

### Requirement: Stabile Geometrie bei gemischten Schreibrichtungen
Die Sprachwahl SHALL physisch rechts und die Wiedergabesteuerung links daneben auf gleicher Höhe bleiben, soweit Platz vorhanden ist. Rechts-nach-links-Texte SHALL weder Spielfeld noch Zeitverlauf spiegeln oder Anzahl-/Energieskalen vertauschen. Zahlen, Einheiten und technische Fragmente SHALL in gemischten Texten eindeutig lesbar bleiben. Feste Nachkommastellen, reservierte Zahlenfelder und Tooltipzuordnung SHALL für alle Sprachen erhalten bleiben.

#### Scenario: Arabisches Diagramm und Zahlen
- **WHEN** auf Arabisch Zeitwerte, Energiesummen, große Zahlen und ein Tooltip bei stillstehender Maus angezeigt werden
- **THEN** folgen Ziffern und Dezimalzeichen der Sprache bei unveränderter Genauigkeit
- **AND** bleiben Zahlenanker, Achsenseiten und die Zuordnung zur horizontalen Position stabil
- **AND** bleiben Σ und Einheit der jeweiligen Energiezeile erkennbar zugeordnet

### Requirement: Verständliche Übersetzungen und begrenztes Layout
Übersetzungen SHALL Anzahl, Energiesumme, Geschwindigkeit, Simulationszeit sowie Anwenden und Speichern eindeutig unterscheiden. Native Schriftsysteme und Sonderzeichen SHALL lesbar bleiben. Bei 1440 × 900, 360 × 740 und 360 × 480 CSS-Pixel SHALL Beschriftungen und Aktionen ohne horizontales Seitenscrolling erreichbar bleiben; Diagramm und Spielfeld SHALL ihre bestehenden Mindestgrößen und Platzbegrenzungen erhalten.

#### Scenario: Lange und nichtlateinische Texte
- **WHEN** deutsche, französische, russische, arabische, japanische oder bengalische Texte bei den vorgesehenen Fenstergrößen erscheinen
- **THEN** werden Texte bei Bedarf sinnvoll umgebrochen, ohne Aktionen zu verdecken oder zusätzliche dauerhafte Messwertzeilen einzuführen
- **AND** bleiben auch lange Fehlermeldungen und Energiesummen verständlich
