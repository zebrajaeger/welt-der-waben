# Spec Delta

## Purpose

Wählt die Sprache der Simulationsoberfläche anhand der Browserpräferenzen und ermöglicht wartbare Übersetzungen durch getrennte Sprachkataloge mit Englisch als verlässlicher Rückfallsprache.

## ADDED Requirements

### Requirement: Automatische Sprachwahl mit Englisch als Standard
Die Anwendung SHALL beim Start zuerst eine gespeicherte unterstützte Sprachwahl verwenden, sonst die erste unterstützte Browsersprache in Präferenzreihenfolge. Regionale Varianten SHALL exakt, dann über die Basissprache zugeordnet werden. Ohne Treffer SHALL Englisch gelten; ohne nutzbare Sprachliste SHALL die einzelne Browsersprache geprüft werden. Zunächst SHALL Englisch und Deutsch unterstützt werden.

#### Scenario: Unterstützte regionale Variante
- **WHEN** die Browserpräferenz `de-CH` beziehungsweise `en-GB` lautet
- **THEN** erscheint die Anwendung auf Deutsch beziehungsweise Englisch

#### Scenario: Reihenfolge und Rückfall
- **WHEN** die Sprachliste `fr-FR`, `de-DE`, `en-US` enthält
- **THEN** wird Deutsch gewählt, solange Französisch nicht unterstützt wird
- **WHEN** ausschließlich nicht unterstützte Sprachen oder keine nutzbaren Sprachangaben vorliegen
- **THEN** erscheint die Anwendung auf Englisch

### Requirement: Erweiterbare Sprachdateien
Jede Sprache SHALL eine eigene JSON-Datei mit stabilen Übersetzungsschlüsseln und vollständigen Textvorlagen besitzen. Englisch SHALL der Referenzkatalog sein. Eine weitere Sprache SHALL durch eine entsprechend benannte Katalogdatei und einen neuen Build ergänzbar sein, ohne UI- oder Simulationslogik anzupassen. Die Anleitung SHALL Schlüssel, Platzhalter, Dateinamen und Prüfungen erklären.

#### Scenario: Weitere Übersetzung ergänzen
- **WHEN** eine gültige vollständige französische Sprachdatei ergänzt und die Anwendung neu gebaut wird
- **THEN** wird Französisch bei passender Browserpräferenz erkannt
- **AND** bleiben bestehende Oberflächenfunktionen ohne zusätzliche sprachbezogene Codezweige nutzbar

### Requirement: Englischer Rückfall für fehlende Übersetzungen
Fehlt ein verwendeter Übersetzungsschlüssel in der gewählten Sprache oder ist sein Text leer, SHALL die Anwendung den englischen Text verwenden. Fehlende Texte SHALL weder rohe Schlüssel anzeigen noch die Initialisierung abbrechen. Prüfungen SHALL fehlende englische Referenztexte sowie unpassende Platzhalter in ausgelieferten Katalogen melden.

#### Scenario: Unvollständiger übersetzter Eintrag
- **WHEN** in einem übersetzten Katalog ein englisch vorhandener Eintrag fehlt oder leer ist
- **THEN** erscheint dieser Text auf Englisch und die übrige Oberfläche bleibt in der gewählten Sprache

### Requirement: Vollständig lokalisierte Oberfläche
Statische und dynamische Anwendungstexte SHALL aus Sprachkatalogen stammen. Dies SHALL Überschriften, Bedienung, Einstellungen, Status, Rückmeldungen, bekannte Fehlermeldungen, Canvas-Beschriftungen, Tooltips, Einheitenhinweise, Dokumenttitel und zugängliche Namen einschließen. Nachrichten mit Werten SHALL vollständige übersetzbare Vorlagen verwenden. Technische Parameterpfade, URLs und der Projektname SHALL nicht übersetzt werden.

#### Scenario: Oberfläche und spätere Rückmeldung
- **WHEN** die Anwendung auf Englisch startet und später pausiert, Einstellungen validiert oder ein Tooltip angezeigt wird
- **THEN** verwenden Oberfläche, neue Rückmeldungen und zugängliche Namen Englisch
- **AND** erscheinen keine unübersetzten deutschen Anwendungsnachrichten
- **WHEN** dieselben Aktionen unter deutscher Browserpräferenz erfolgen
- **THEN** erscheinen die entsprechenden deutschen Übersetzungen

### Requirement: Dokument- und Zahlensprache stimmen überein
Das Sprachkennzeichen des Dokuments SHALL die gewählte Katalogsprache angeben. Alle sichtbaren Zahlenformate SHALL diese Sprache verwenden. Englisch SHALL Dezimalpunkte, Deutsch Dezimalkommas verwenden; Ganzzahlformat, feste Nachkommastellen und Breitenbegrenzungen SHALL erhalten bleiben. Die numerische Eingabeverarbeitung SHALL weiterhin Browser-Zahleneingaben verwenden und lokalisierte Anzeigetexte nicht als Modellwerte zurücklesen.

#### Scenario: Gleiches Ergebnis in beiden Sprachen
- **WHEN** derselbe Wert 10,5 in englischer beziehungsweise deutscher Oberfläche angezeigt wird
- **THEN** erscheint eine Energieangabe als „10.50“ beziehungsweise „10,50“
- **AND** bleibt der gespeicherte Zahlenwert identisch
- **AND** lautet das Sprachkennzeichen `en` beziehungsweise `de`

### Requirement: Sprachkataloge ohne zusätzlichen Dienst
Übersetzungen SHALL Bestandteil der statisch ausgelieferten Anwendung sein. Sprachwahl und Übersetzung SHALL keinen Übersetzungsdienst, kein CDN, keine Cookies und keinen lokalen Einstellungsspeicher benötigen. Die Anwendung SHALL unter dem vorhandenen GitHub-Pages-Unterpfad und ohne verfügbaren Browserspeicher lokalisierbar bleiben.

#### Scenario: Statische Auslieferung und gesperrter Speicher
- **WHEN** die Produktionsanwendung unter `/welt-der-waben/` mit blockiertem lokalen Speicher geladen wird
- **THEN** funktioniert die Sprachwahl anhand des Browsers und alle benötigten Übersetzungstexte sind lokal eingebunden

### Requirement: Sprache bleibt vom Simulationslauf getrennt
Initiale Sprachwahl und manuelles Umschalten SHALL weder Einstellungen migrieren noch Simulationsparameter verändern. Ein Wechsel SHALL Tick, Wiedergabe, Historie, Diagrammoptionen und Einstellungsentwurf erhalten und Texte, Zahlen, zugängliche Namen sowie vorhandene Meldungen sofort aktualisieren. Sprache SHALL getrennt von Konfigurationen gespeichert und nicht in JSON-Einstellungsexporte aufgenommen werden.

#### Scenario: Einstellungen über Sprachgrenzen übertragen
- **WHEN** eine deutsche Sitzung Einstellungen exportiert und eine englische Sitzung sie importiert
- **THEN** stimmen Parameter, Zahlenwerte und Formatversion überein
- **AND** erscheinen Hinweise und Beschriftungen in der jeweiligen Sitzungssprache

### Requirement: Erkennbare manuelle Sprachwahl
Ein abgesetzter Button oben rechts SHALL die Sprachwahl öffnen. Wiedergabesteuerungen SHALL rechtsbündig neben der Überschrift, links der Sprachwahl stehen und nur bei Platzmangel rechtsbündig umbrechen. Globus, lokale Flaggen und Sprach-Eigennamen SHALL die Auswahl ohne Kenntnis der aktuellen Sprache ermöglichen. Alle Katalogsprachen SHALL auswählbar, die aktive Sprache erkennbar sein. Bedienung SHALL per Tastatur, Maus und in schmalen Fenstern funktionieren.

#### Scenario: Unbekannte Oberflächensprache
- **WHEN** Benutzer in einer englischen Oberfläche den Globus-Button öffnen und „Deutsch“ wählen
- **THEN** wird die Oberfläche sofort deutsch und die Auswahl als aktiv markiert
- **AND** bleiben Welt, Pausemodus, Diagrammoptionen und ein unfertiger Formulareintrag erhalten

### Requirement: Gespeicherte Sprachpräferenz
Eine manuelle Sprachwahl SHALL im lokalen Browserspeicher abgelegt und bei späteren Besuchen vor Browserpräferenzen verwendet werden. Unbekannte oder unlesbare gespeicherte Sprachen SHALL ignoriert werden. Ein Speicherfehler SHALL weder den Sprachwechsel noch die Simulation verhindern. Simulationsparameter und andere gespeicherte Einträge SHALL unverändert bleiben.

#### Scenario: Auswahl nach Neuladen
- **WHEN** Deutsch manuell gewählt und die Seite mit englischer Browsersprache neu geladen wird
- **THEN** startet sie auf Deutsch
- **WHEN** der Speicherzugriff blockiert ist
- **THEN** lässt sich die Sprache weiterhin für den aktuellen Besuch umschalten
