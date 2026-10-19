# Spec Delta

## ADDED Requirements

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
