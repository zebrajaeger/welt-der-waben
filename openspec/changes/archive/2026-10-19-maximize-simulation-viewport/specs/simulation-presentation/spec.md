# Spec Delta

## ADDED Requirements

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
