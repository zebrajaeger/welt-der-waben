# Spec Delta

## MODIFIED Requirements

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