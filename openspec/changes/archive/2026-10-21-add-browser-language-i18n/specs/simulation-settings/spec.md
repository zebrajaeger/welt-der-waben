# Spec Delta

## ADDED Requirements

### Requirement: Lokalisierte Einstellungsbedienung
Das Einstellungsformular SHALL Gruppen, Parameter, Aktionen, Hilfen und Zustände in der gewählten Anwendungssprache anzeigen. Bestehende deutsche Aktionsbezeichnungen SHALL für Deutsch gelten und entsprechende englische Übersetzungen erhalten. Übersetzungen SHALL weder Parameterpfade noch Zahlenwerte, gespeicherte Einstellungen oder das JSON-Austauschformat ändern.

#### Scenario: Gleiches Formular in beiden Sprachen
- **WHEN** die Anwendung mit englischer beziehungsweise deutscher Browsersprache gestartet wird
- **THEN** erscheinen die gleichen Parameter und Aktionen vollständig in Englisch beziehungsweise Deutsch
- **AND** bewirken gültige Eingaben dieselbe Konfiguration und dasselbe Verhalten

### Requirement: Lokalisierte Einstellungsfehler und Rückmeldungen
Validierungs-, Import-, Export- und Speicherfehler sowie Erfolgs- und Wiederherstellungsmeldungen SHALL in der gewählten Sprache erscheinen. Feldbezogene Fehler SHALL die übersetzte Feldbezeichnung verwenden und die bestehende Feldzuordnung, Fokusführung und zugängliche Fehlermarkierung erhalten. Ungültige Eingaben SHALL weiterhin weder den laufenden Zustand noch gespeicherte gültige Einstellungen verändern.

#### Scenario: Ungültige Spaltenzahl
- **WHEN** eine ungültige Spaltenzahl übernommen wird
- **THEN** benennt die englische Fehlermeldung das Feld als „Columns“ und die deutsche als „Spalten“
- **AND** wird jeweils dasselbe Eingabefeld markiert und fokussiert
- **AND** bleiben der laufende Zustand und gespeicherte Einstellungen erhalten

#### Scenario: Import über Sprachgrenzen
- **WHEN** eine auf Englisch exportierte gültige Konfiguration auf Deutsch importiert wird
- **THEN** werden identische Parameterwerte eingelesen und die Importmeldung erscheint auf Deutsch
- **AND** benötigt die Datei keine Sprachkennung oder Migration aufgrund der Sprache
