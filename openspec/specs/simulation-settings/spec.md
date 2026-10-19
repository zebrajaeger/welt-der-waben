# simulation-settings Specification

## Purpose

Ermöglicht das verständliche Bearbeiten, bewusste Übernehmen und lokale Speichern von Simulationsparametern sowie die Wiederherstellung der Programmstandards.

## Requirements

### Requirement: Einklappbare Parametereinstellungen
Die Oberfläche SHALL eine zunächst eingeklappte Box „Einstellungen“ mit beschrifteten Eingaben für alle konfigurierbaren Feld-, Nahrungs-, Arten-, Tempo- und Aktionszeitwerte anbieten. Einheiten SHALL erkennbar sein; die Tickrate SHALL fest bei 60 bleiben. Die Box SHALL per Tastatur und in schmalen Fenstern bedienbar sein.

#### Scenario: Alle Parameter zugänglich
- **WHEN** die Einstellungen geöffnet werden
- **THEN** sind Feldbreite und -höhe, Grasmaximum und -wachstum, beide Wirkungsgrade, Transferrate, Zeitfaktor, alle sechs Aktionszeiten sowie je Art Startanzahl, Startenergie, Maximalenergie, Verbrauch und Teilungsanteil bearbeitbar
- **AND** sind Sekunderaten auf Simulationszeit bezogen und Aktionszeiten in Ticks gekennzeichnet

#### Scenario: Einklappen und schmaler Bildschirm
- **WHEN** Benutzer die Box per Tastatur öffnen, Werte ändern und wieder schließen oder ein 360 Pixel breites Fenster verwenden
- **THEN** bleiben Entwurfswerte erhalten und Eingaben sowie Aktionen ohne horizontales Seitenscrolling erreichbar
- **AND** verändern Öffnen und Schließen weder Tickzahl noch Pausenmodus eigenständig

### Requirement: Validierter Konfigurationsentwurf
Eingaben SHALL zunächst einen unabhängigen Entwurf bilden. Übernehmen und Speichern SHALL nur bei vollständig gültigen Zahlen und erfüllten Konfigurationsregeln erfolgen. Fehler SHALL verständlich und zugänglich angezeigt werden. Ein ungültiger Versuch SHALL weder aktive noch gespeicherte Einstellungen ersetzen.

#### Scenario: Ungültige oder widersprüchliche Werte
- **WHEN** ein Feld leer, nicht endlich oder außerhalb seines Bereichs ist, Populationen nicht ins Feld passen oder Wachstum mal Graswirkungsgrad mindestens dem Grasfresser-Verbrauch entspricht
- **THEN** werden Übernehmen und Speichern abgewiesen und die Ursache angezeigt
- **AND** bleiben Entwurf zur Korrektur, laufende Simulation und bisher gespeicherte Werte erhalten

#### Scenario: Bearbeiten während laufender Simulation
- **WHEN** Benutzer Entwurfswerte ändern
- **THEN** läuft die Simulation mit ihrer aktiven Konfiguration weiter, bis ausdrücklich übernommen wird

### Requirement: Bewusstes Übernehmen mit neuem Lauf
„Übernehmen“ SHALL einen gültigen Entwurf vollständig als aktive Konfiguration einsetzen und einen neuen Lauf bei Tick null beginnen. Laufende Aktionen und Reservierungen SHALL verworfen und der Pausenmodus SHALL erhalten werden. Die Oberfläche SHALL den Neustart vor der Aktion kenntlich machen. Übernehmen SHALL nicht automatisch speichern.

#### Scenario: Feld und Arten ändern
- **WHEN** ein gültiger Entwurf mit neuer Feldgröße und geänderten Artenwerten übernommen wird
- **THEN** verwenden Initialisierung, Simulation, Darstellung, Tempo und weitere Neustarts dieselben neuen Werte
- **AND** startet der neue Lauf bei Tick null mit der konfigurierten Anfangsbelegung und ohne alte Aktionen

#### Scenario: Übernehmen in der Pause
- **WHEN** Einstellungen im pausierten Zustand übernommen werden
- **THEN** bleibt der neue Lauf pausiert, bis Weiter oder Einzelschritt betätigt wird

### Requirement: Ausdrückliches lokales Speichern
„Im Browser speichern“ SHALL einen gültigen Entwurf für spätere Besuche derselben Browseradresse dauerhaft lokal speichern, ohne den aktuellen Lauf neu zu starten oder aktive Parameter zu verändern. Erfolg und Speicherfehler SHALL sichtbar gemeldet werden. Nur Einstellungen SHALL gespeichert werden, keine laufende Welt.

#### Scenario: Speichern und erneut öffnen
- **WHEN** ein gültiger Entwurf gespeichert und die Seite später unter derselben Browseradresse neu geladen wird
- **THEN** startet ein neuer Lauf mit diesen gespeicherten Einstellungen und das Formular zeigt sie an
- **AND** werden weder alte Tiere noch Tickstände wiederhergestellt

#### Scenario: Speicherung nicht verfügbar
- **WHEN** der Browser das Lesen oder Schreiben lokaler Einstellungen verhindert
- **THEN** bleiben Bearbeiten, Übernehmen und Simulation nutzbar und die Speicherbeschränkung wird verständlich angezeigt
- **AND** wird ein fehlgeschlagener Schreibversuch nicht als erfolgreich gemeldet

### Requirement: Robustes Laden gespeicherter Einstellungen
Beim Start SHALL eine vollständige gültige gespeicherte Konfiguration verwendet werden; ohne gültige kompatible Daten SHALL die Anwendung mit aktuellen Programmstandards starten. Beschädigte oder inkompatible Daten SHALL einen sichtbaren Hinweis auslösen und keinen Teilzustand erzeugen. Fremde Browserdaten SHALL unverändert bleiben.

#### Scenario: Erster Besuch
- **WHEN** keine Einstellungen gespeichert sind
- **THEN** starten Formular und Simulation mit den aktuellen Programmstandards ohne Fehlermeldung

#### Scenario: Beschädigte oder inkompatible Speicherung
- **WHEN** gespeicherte Daten ungültiges Format, eine unbekannte Version, fehlende Werte, falsche Datentypen oder eine ungültige Wertekombination enthalten
- **THEN** werden sie insgesamt abgewiesen und Formular sowie Simulation verwenden aktuelle Programmstandards mit einem Hinweis

#### Scenario: Frühere Einstellungen ohne Startenergie
- **WHEN** eine gültige frühere Speicherung ohne separat konfigurierbare Startenergie geladen wird
- **THEN** bleiben ihre Werte erhalten und die Startenergie wird je Art einmalig mit der Hälfte ihrer gespeicherten Maximalenergie ergänzt
- **AND** enthalten neue Speicherungen beide Startenergien ausdrücklich; fehlende Werte in diesem neuen Format werden abgewiesen

### Requirement: Standardwerte als wiederherstellbarer Entwurf
„Standardwerte“ SHALL sämtliche Entwurfswerte durch die aktuellen Programmstandards ersetzen. Die Aktion SHALL zunächst weder den Lauf noch gespeicherte Werte ändern. Die Oberfläche SHALL erklären, wie Benutzer die Standards übernehmen und für spätere Besuche speichern können.

#### Scenario: Vorübergehend zu Standards zurückkehren
- **WHEN** Benutzer Standardwerte wählen und anschließend übernehmen
- **THEN** beginnt ein neuer Lauf mit Programmstandards und zuvor gespeicherte Einstellungen bleiben bis zu einer ausdrücklichen Speicherung erhalten

#### Scenario: Dauerhaft zu Standards zurückkehren
- **WHEN** Benutzer Standardwerte wählen und anschließend im Browser speichern
- **THEN** verwendet der nächste Seitenaufruf die gespeicherten Standardwerte
- **AND** verändert das Speichern den gegenwärtigen Lauf nicht

### Requirement: Verständliche Zustände und Tempoabgleich
Die Oberfläche SHALL erkennen lassen, ob der Entwurf von aktiven oder zuletzt erfolgreich gespeicherten Werten abweicht. Eine unmittelbare Tempowahl SHALL auch den Tempoentwurf aktualisieren und andere Entwurfsfelder erhalten. Eine Änderung des Tempoentwurfs SHALL erst durch Übernehmen wirksam werden; Speichern SHALL den sichtbaren Entwurf verwenden.

#### Scenario: Soforttempo neben unbearbeiteten Änderungen
- **WHEN** die laufende Tempoauswahl nach Änderungen anderer Formularfelder betätigt wird
- **THEN** ändern sich aktives Tempo und Tempoentwurf gemeinsam, andere Entwurfswerte bleiben erhalten und es erfolgt keine automatische Speicherung

#### Scenario: Gespeichert aber noch nicht übernommen
- **WHEN** ein vom aktiven Lauf abweichender Entwurf erfolgreich gespeichert wird
- **THEN** zeigt die Oberfläche sowohl den Speichererfolg als auch die noch nicht übernommenen Änderungen an

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
