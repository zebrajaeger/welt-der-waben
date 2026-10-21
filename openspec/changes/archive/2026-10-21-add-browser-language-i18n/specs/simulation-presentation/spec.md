# Spec Delta

## MODIFIED Requirements

### Requirement: Tempoauswahl im Simulationsfenster
Die lokalisierte Tempoauswahl SHALL die Faktoren 0,25×, 0,5×, 1×, 2×, 4× und 8× im Zahlenformat der gewählten Sprache anbieten. Die Beschriftung SHALL auf Englisch „Speed“ und auf Deutsch „Tempo“ lauten. Bei 1× SHALL eine Realzeitsekunde 60 Simulationsticks entsprechen. Ein abweichender konfigurierter Startfaktor SHALL zusätzlich angeboten werden. Die Auswahl und bestehende Bedienelemente SHALL per Tastatur, Zeigegerät und in schmalen Fenstern bedienbar bleiben.

#### Scenario: Standardstart und Auswahl
- **WHEN** die Anwendung mit Standardkonfiguration startet
- **THEN** ist 2× ausgewählt und jede angebotene Geschwindigkeit ohne Neustart wählbar

#### Scenario: Abweichender Konfigurationswert
- **WHEN** ein gültiger abweichender Startfaktor konfiguriert ist
- **THEN** wird dieser zusätzlich angeboten und zunächst verwendet

#### Scenario: Tastatur und kleines Fenster
- **WHEN** die Auswahl per Tastatur oder auf einem schmalen Bildschirm bedient wird
- **THEN** bleiben Beschriftung, Zeitfaktor und Wiedergabebedienelemente erreichbar und erkennbar

#### Scenario: Sprachabhängige Tempowerte
- **WHEN** die Auswahl auf Englisch beziehungsweise Deutsch angezeigt wird
- **THEN** lauten Beschriftung und kleinster Faktor „Speed“ und „0.25×“ beziehungsweise „Tempo“ und „0,25×“
- **AND** verwendet die Simulation in beiden Fällen denselben numerischen Faktor

### Requirement: Direkt erreichbarer GitHub-Quellcode
Die Oberfläche SHALL einen sichtbaren kompakten Link auf `https://github.com/zebrajaeger/welt-der-waben` anbieten, der das Repository in einem neuen Tab öffnet und die Simulationsseite erhält. Er SHALL ohne zusätzliche externe Ressourcen erkennbar, per Tastatur aktivierbar und mit sichtbarem Fokus versehen sein. Sein zugänglicher Name SHALL lokalisiert sein: englisch „Source code on GitHub (new tab)“, deutsch „Quellcode auf GitHub (neuer Tab)“.

#### Scenario: Quellcode öffnen
- **WHEN** Benutzer den GitHub-Link mit Zeigegerät oder per Tastatur aktivieren
- **THEN** öffnet sich das Repository in einem neuen Tab und die Simulationsseite bleibt geöffnet
- **AND** werden weder Einstellungen übernommen oder gespeichert noch ein Neustart oder ein Wechsel des Pausenmodus ausgelöst
- **AND** weist die zugängliche Beschriftung auf GitHub und den neuen Tab hin
