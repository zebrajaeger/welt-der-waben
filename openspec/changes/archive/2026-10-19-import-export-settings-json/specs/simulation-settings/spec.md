# Spec Delta

## ADDED Requirements

### Requirement: Portabler JSON-Export des Einstellungsentwurfs
Die Einstellungsbox SHALL „Als JSON exportieren“ anbieten. Ein gültiger Formularentwurf SHALL als lesbare UTF-8-JSON-Datei mit der Endung `.json` heruntergeladen werden können, einschließlich aller Parameter und beider Startenergien. Export SHALL weder aktive noch gespeicherte Einstellungen verändern und keine laufende Welt enthalten. Ungültige Entwürfe SHALL mit verständlichem Fehler ohne Dateidownload abgewiesen werden.

#### Scenario: Noch nicht übernommene Werte exportieren
- **WHEN** Benutzer gültige Formularwerte ändern und exportieren, ohne sie vorher zu übernehmen oder zu speichern
- **THEN** enthält der Download genau die vollständigen Entwurfswerte einschließlich Starttempo und Startenergien
- **AND** bleiben aktive Konfiguration, Pausenmodus und Browserspeicher unverändert; der laufende Tickstand wird nicht zurückgesetzt
- **AND** enthält die Datei keine Tiere, Grasbestände, Aktionszustände oder Tickstände

#### Scenario: Ungültiger Exportversuch
- **WHEN** der Entwurf leere, ungültige oder widersprüchliche Parameter enthält und Export gewählt wird
- **THEN** wird kein Download gestartet und ein zugänglicher Fehlerhinweis angezeigt
- **AND** bleiben der korrigierbare Entwurf, aktive Konfiguration und gespeicherte Werte erhalten

### Requirement: Vollständig validierter JSON-Dateiimport als Entwurf
Die Einstellungsbox SHALL „JSON importieren“ mit lokaler Dateiauswahl anbieten. Eine gültige Datei SHALL den gesamten Formularentwurf ersetzen, ohne automatisch zu übernehmen, neu zu starten oder zu speichern. Dateiinhalte SHALL vor jeder Änderung vollständig geprüft werden. Erfolg, Lese- und Validierungsfehler SHALL zugänglich gemeldet werden; bei Fehler oder Abbruch SHALL bestehende Werte erhalten bleiben.

#### Scenario: Datei laden und ausdrücklich aktivieren oder speichern
- **WHEN** eine gültige Einstellungsdatei ausgewählt wird
- **THEN** zeigt das Formular alle importierten Werte und einen Hinweis auf die separaten Aktionen Übernehmen und Speichern
- **AND** werden Unterschiede zu aktiven und zuletzt gespeicherten Einstellungen korrekt angezeigt
- **AND** bleiben aktives Tempo, laufende Welt, Pausenmodus und Browserspeicher bis zur jeweiligen ausdrücklichen Aktion unverändert
- **AND** startet anschließendes Übernehmen einen neuen Lauf bei Tick null unter Beibehaltung des Pausenmodus; anschließendes Speichern bewahrt die importierten Werte für den nächsten Seitenaufruf

#### Scenario: Fehlerhafter oder inkompatibler Import
- **WHEN** die Datei nicht gelesen werden kann, kein gültiges JSON enthält, eine unbekannte Version verwendet, Pflichtwerte auslässt, falsche Datentypen oder unzulässige Wertekombinationen enthält
- **THEN** wird der gesamte Import abgewiesen und die Ursache verständlich gemeldet
- **AND** bleiben bisheriger Formularentwurf, aktive Konfiguration und gespeicherte Einstellungen erhalten; es gibt weder eine Teilübernahme noch einen Rückfall auf Standardwerte

#### Scenario: Abbruch und erneute Auswahl derselben Datei
- **WHEN** Benutzer die Dateiauswahl abbrechen
- **THEN** bleiben sämtliche Werte unverändert und es wird kein Importerfolg gemeldet
- **WHEN** Benutzer dieselbe Datei später erneut auswählen, etwa nach zwischenzeitlicher Änderung des Entwurfs oder Korrektur einer fehlerhaften Datei
- **THEN** kann deren aktueller Inhalt erneut importiert und geprüft werden

#### Scenario: Import und Export ohne Browserspeicher
- **WHEN** der Browser den Zugriff auf lokalen Einstellungsspeicher verhindert
- **THEN** bleiben JSON-Import, JSON-Export und anschließendes Übernehmen unabhängig davon verwendbar

### Requirement: Versioniertes und kompatibles Einstellungsdateiformat
Neue Exporte SHALL das Format `{ "version": 2, "config": ... }` der aktuellen lokalen Speicherung verwenden. Import SHALL Version 2 vollständig prüfen und Version 1 mit der bisherigen Startenergie-Migration lesen. Unbekannte Zusatzfelder SHALL ignoriert und beim Export weggelassen werden; fehlende Pflichtwerte SHALL abgewiesen werden. Ein Export-Import-Rundlauf SHALL alle konfigurierbaren Zahlenwerte erhalten.

#### Scenario: Zwischen Browsern oder Adressen übertragen
- **WHEN** eine exportierte Datei in einem anderen Browser oder unter einer anderen Adresse importiert wird
- **THEN** enthält der neue Entwurf dieselben Parameterwerte unabhängig von dort gespeicherten Einstellungen
- **AND** werden Zahlen als JSON-Zahlen mit den bestehenden Parameternamen und Einheiten übertragen

#### Scenario: Ältere Datei ohne Startenergien
- **WHEN** eine ansonsten gültige Datei der Version 1 ohne separate Startenergien importiert wird
- **THEN** werden die Startenergien je Art aus der Hälfte ihrer jeweiligen Maximalenergie ergänzt und alle anderen Werte erhalten
- **AND** enthält ein erneuter Export Version 2 mit beiden Startenergien ausdrücklich

#### Scenario: Pflichtwerte und Zusatzfelder
- **WHEN** eine Datei der Version 2 eine Startenergie auslässt
- **THEN** wird der Import vollständig abgewiesen
- **WHEN** eine ansonsten gültige Datei unbekannte Zusatzfelder enthält
- **THEN** werden ausschließlich bekannte Einstellungswerte in den Entwurf übernommen und bei erneutem Export ausgegeben

### Requirement: Zugängliche und dokumentierte Dateiaktionen
Import und Export SHALL innerhalb der bestehenden Einstellungsbox per Tastatur und bei 360 Pixel Fensterbreite ohne horizontales Seitenscrolling erreichbar sein. Die Oberfläche SHALL erklären, dass Dateien Einstellungen übertragen und Import erst den Entwurf ändert. Beide README-Sprachfassungen SHALL Import, Export, Übernehmen und Speichern sowie ein gültiges vollständiges JSON-Beispiel dokumentieren. Dateiinhalte SHALL lokal verarbeitet und nicht an einen Server gesendet werden.

#### Scenario: Bedienung der Dateiaktionen
- **WHEN** Benutzer die Einstellungen in einem schmalen Fenster oder per Tastatur bedienen
- **THEN** sind beide Dateiaktionen erreichbar, die Dateiauswahl ist beschriftet und Rückmeldungen sind für assistive Technik zugänglich
- **AND** werden zum Lesen oder Schreiben der Einstellungsdatei keine Dateiinhalte über das Netzwerk übertragen
